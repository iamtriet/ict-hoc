"""Cầu nối MetaTrader 5 -> trang ICT Live chạy trên máy này. CHỈ ĐỌC GIÁ.

Chạy:  python local/mt5_server.py --open     (hoặc bấm đúp local/ICT-Local.bat)
Cần:   phần mềm MT5 đang mở và đã đăng nhập; gói Python "MetaTrader5".

Chương trình chỉ nghe ở 127.0.0.1 (máy khác không vào được), không đọc thông tin tài khoản
và không có bất kỳ lệnh đặt, sửa hay đóng giao dịch nào.
"""
import argparse
import datetime as dt
import json
import os
import queue
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, unquote, urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERIOD = {"m5": 300, "m15": 900, "h1": 3600, "h4": 14400, "d1": 86400}
CANDIDATES = {"XAUUSD": ("XAUUSD", "GOLD"), "BTCUSD": ("BTCUSD",)}
# không phục vụ sw.js: bản chạy trên máy không lưu cache, tắt chương trình thì trang không tự mở lại bản cũ
FILES = ("index.html", "manifest.webmanifest")
FOLDERS = ("assets/", "live/", "icons/")
GRACE = 3.0  # quá giờ đóng nến bấy nhiêu giây mà chưa có nến mới thì coi như nến đã đóng


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def us_dst(ts):
    """Mỹ đang dùng giờ mùa hè tại thời điểm ts (giây UTC)?"""
    d = dt.datetime.fromtimestamp(ts, dt.timezone.utc)

    def sunday(month, n, hour):
        first = dt.datetime(d.year, month, 1, tzinfo=dt.timezone.utc)
        return first.replace(day=1 + (6 - first.weekday()) % 7 + 7 * (n - 1), hour=hour)

    return sunday(3, 2, 7) <= d < sunday(11, 1, 6)


class Clock:
    """Đổi giờ máy chủ của sàn sang UTC. `hours` = số giờ máy chủ đi trước UTC, đo từ tick vừa tới.
    Sàn dùng giờ theo phiên New York (UTC+2 mùa đông, +3 mùa hè) được đổi đúng mùa cho cả nến cũ."""

    def __init__(self, fixed=None):
        self.fixed = fixed is not None
        self.hours = fixed
        self.ny = False
        self._other = (None, 0)

    def observe(self, server_ts, now):
        if self.fixed:
            return
        diff = server_ts - now
        h = round(diff / 1800) / 2
        if abs(diff - h * 3600) > 600 or not -12 <= h <= 14:  # chịu được đồng hồ máy lệch tới 10 phút
            return
        if self.hours is not None and h != self.hours:
            value, n = self._other  # đã có giờ rồi thì chỉ đổi khi thấy giá trị mới nhiều lần liên tiếp
            self._other = (h, n + 1 if value == h else 1)
            if self._other[1] < 5:
                return
        self._other = (None, 0)
        self.hours = h
        self.ny = h == (3 if us_dst(now) else 2)

    def utc(self, server_ts):
        if self.ny:
            return server_ts - (3 if us_dst(server_ts - 7200) else 2) * 3600
        return server_ts - (self.hours or 0) * 3600


def terminal_running():
    try:
        out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq terminal64.exe", "/NH"], capture_output=True, timeout=10).stdout
        return b"terminal64.exe" in out.lower()
    except Exception:
        return True


class Bridge:
    def __init__(self, mt5, terminal=None, wanted=None, offset=None):
        self.mt5, self.terminal, self.wanted = mt5, terminal, wanted or {}
        self.clock = Clock(offset)
        self.lock = threading.Lock()
        self.symbols = {}      # mã -> {name, digits}
        self.up = False        # đã nối được phần mềm MT5
        self.linked = False    # phần mềm MT5 đang nối máy chủ sàn
        self.error = "chưa kết nối"
        self.clients = set()
        self.ticks = {}        # mã -> (khóa so sánh, sự kiện gửi đi)
        self.forming = {}      # (mã, khung) -> sự kiện nến đang chạy
        self.done = {}         # (mã, khung) -> giờ mở của nến đã đóng gần nhất
        self.skew = []         # (lúc đo, giờ sàn trừ giờ máy) của các tick vừa tới
        self.frames = {}

    def call(self, name, *a, **k):
        with self.lock:
            return getattr(self.mt5, name)(*a, **k)

    def market_now(self, now):
        """giờ theo sàn (giây UTC). Đồng hồ máy chạy sai không được làm nến bị chốt sớm hay muộn.
        Tick nào tới nhanh nhất trong 2 phút gần đây cho độ lệch sát nhất; không có tick mới thì giữ độ lệch cuối."""
        recent = [d for at, d in self.skew if now - at <= 120]
        if recent:
            return now + max(recent)
        return now + (self.skew[-1][1] if self.skew else 0)

    # ---------- kết nối ----------
    def connect(self):
        kw = {"timeout": 20000}
        if self.terminal:
            kw["path"] = self.terminal
        if not self.call("initialize", **kw):
            self.error = "không nối được MT5: %s" % (self.call("last_error"),)
            return False
        self.frames = {k: getattr(self.mt5, "TIMEFRAME_" + n) for k, n in (("m5", "M5"), ("m15", "M15"), ("h1", "H1"), ("h4", "H4"), ("d1", "D1"))}
        self.symbols = self.resolve()
        if not self.symbols:
            self.error = "không thấy mã XAUUSD hay BTCUSD trong MT5"
            return False
        self.up, self.error = True, None
        log("Đã nối MT5. Mã dùng:", ", ".join("%s = %s" % (k, v["name"]) for k, v in self.symbols.items()))
        return True

    def resolve(self):
        every = self.call("symbols_get") or []
        found = {}
        for sid, keys in CANDIDATES.items():
            want = self.wanted.get(sid)
            if want:
                match = [s for s in every if s.name == want]
            else:  # ưu tiên tên đúng, mã đang hiện trong Market Watch, tên ngắn nhất; bỏ biến thể 24/7
                match = [s for s in every if s.name.upper().startswith(keys) and "247" not in s.name]
                match.sort(key=lambda s: (s.name.upper() not in keys, not s.visible, len(s.name), s.name))
            if match and self.call("symbol_select", match[0].name, True):
                found[sid] = {"name": match[0].name, "digits": int(match[0].digits)}
        return found

    def info(self):
        ok = self.up and self.clock.hours is not None
        return {"ok": ok, "frames": list(PERIOD), "connected": self.linked, "symbols": self.symbols, "offsetHours": self.clock.hours, "newYorkTime": self.clock.ny,
                "error": self.error or (None if ok else "chưa xác định được giờ máy chủ sàn")}

    # ---------- nến ----------
    def rates(self, sid, tf, count):
        r = self.call("copy_rates_from_pos", self.symbols[sid]["name"], self.frames[tf], 0, count)
        if r is None:
            raise RuntimeError("MT5 không trả nến: %s" % (self.call("last_error"),))
        u = self.clock.utc
        return [[int(u(int(x["time"])) * 1000), float(x["open"]), float(x["high"]), float(x["low"]), float(x["close"])] for x in r]

    def candles(self, sid, tf, count, now=None):
        bars = self.rates(sid, tf, count + 1)
        now = self.market_now(time.time() if now is None else now)
        running = bool(bars) and bars[-1][0] / 1000 + PERIOD[tf] > now
        closed = bars[:-1] if running else bars
        return {"closed": closed[-count:], "open": bars[-1] if running else None}

    # ---------- phát trực tiếp ----------
    def send(self, event, data):
        msg = ("event: %s\ndata: %s\n\n" % (event, json.dumps(data, separators=(",", ":")))).encode()
        for q in list(self.clients):
            try:
                q.put_nowait(msg)
            except queue.Full:
                self.clients.discard(q)  # trình duyệt không nhận kịp: ngắt để nó nối lại và tải bù

    def step_bars(self, sid, tf, now):
        bars = self.rates(sid, tf, 3)
        if not bars:
            return
        key, last = (sid, tf), len(bars) - 1
        at = self.market_now(now)
        closed = [b for i, b in enumerate(bars) if i < last or at >= b[0] / 1000 + PERIOD[tf] + GRACE]
        if key not in self.done:
            self.done[key] = closed[-1][0] if closed else 0
        for b in closed:
            if b[0] > self.done[key]:
                self.done[key] = b[0]
                self.forming.pop(key, None)
                self.send("bar", {"sym": sid, "tf": tf, "bar": b, "closed": True})
        b = bars[-1]
        if b[0] > self.done[key]:
            ev = {"sym": sid, "tf": tf, "bar": b, "closed": False}
            if self.forming.get(key) != ev:
                self.forming[key] = ev
                self.send("bar", ev)

    def step(self, slow, now=None):
        """một vòng đọc giá; `slow` = đến lượt kiểm tra đủ mọi khung"""
        for sid, s in list(self.symbols.items()):
            t = self.call("symbol_info_tick", s["name"])
            if t is None:
                continue
            at = time.time() if now is None else now
            key = (int(t.time_msc), float(t.bid), float(t.ask))
            seen = self.ticks.get(sid)
            changed = seen is None or seen[0] != key
            if changed:
                if seen is not None:  # tick vừa tới trong lúc đang theo dõi: dùng để đo giờ máy chủ
                    self.clock.observe(key[0] / 1000, at)
                    if self.clock.hours is not None:
                        d = self.clock.utc(key[0] / 1000) - at
                        if abs(d) <= 600:
                            self.skew = [x for x in self.skew if at - x[0] <= 120][-400:] + [(at, d)]
                ev = None
                if self.clock.hours is not None:
                    ev = {"sym": sid, "t": int(self.clock.utc(key[0] / 1000) * 1000), "bid": key[1], "ask": key[2]}
                    self.send("tick", ev)
                self.ticks[sid] = (key, ev)
            if self.clock.hours is None:
                continue
            if changed or slow:
                self.step_bars(sid, "m5", at)
                self.step_bars(sid, "m15", at)
            if slow:
                self.step_bars(sid, "h1", at)
                self.step_bars(sid, "h4", at)

    def run(self, stop):
        slow_at = check_at = 0.0
        last_error = None
        while not stop.is_set():
            try:
                if not self.up:
                    # chỉ nối lại khi MT5 đang chạy, để không tự bật lại phần mềm bạn đã tắt
                    if not terminal_running() or not self.connect():
                        stop.wait(3)
                    continue
                now = time.time()
                if now >= check_at:
                    check_at = now + 1
                    ti = self.call("terminal_info")
                    if ti is None:
                        raise ConnectionError("mất kết nối với phần mềm MT5")
                    if bool(ti.connected) != self.linked:
                        self.linked = bool(ti.connected)
                        log("MT5 %s máy chủ sàn" % ("đã nối" if self.linked else "mất kết nối"))
                slow = now >= slow_at
                if slow:
                    slow_at = now + 0.5
                self.step(slow)
                last_error = None
                stop.wait(0.02)
            except Exception as e:  # ghi một lần rồi thử lại, không để luồng đọc giá chết
                if str(e) != last_error:
                    last_error = str(e)
                    log("Lỗi đọc giá:", e)
                if isinstance(e, ConnectionError):
                    self.up = self.linked = False
                    self.error = str(e)
                    self.ticks.clear()
                    self.skew = []
                    self.forming.clear()
                    self.done.clear()
                    self.call("shutdown")
                stop.wait(1)


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
                      ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml",
                      "": "application/octet-stream"}
    bridge = None
    disable_nagle_algorithm = True  # gửi từng giá ngay, không để TCP gom gói

    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def local_only(self):
        # chặn trang web lạ trỏ tên miền của nó vào 127.0.0.1 (DNS rebinding)
        port = self.server.server_address[1]
        return self.headers.get("Host") in ("127.0.0.1:%d" % port, "localhost:%d" % port)

    def reply(self, code, data):
        body = json.dumps(data, separators=(",", ":")).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def allowed(self, path):
        p = unquote(path).lstrip("/")
        if p == "" or p.endswith("/"):
            p += "index.html"
        parts = p.split("/")
        if "\\" in p or ":" in p or any(x.startswith(".") for x in parts):
            return False
        return p in FILES or p.startswith(FOLDERS) or p in ("assets", "live", "icons")

    def do_HEAD(self):
        if not self.local_only() or not self.allowed(urlparse(self.path).path):
            return self.send_error(404)
        return super().do_HEAD()

    def do_GET(self):
        if not self.local_only():
            return self.send_error(403)
        u = urlparse(self.path)
        b = self.bridge
        if u.path == "/mt5/info":
            for _ in range(30):  # vừa khởi động: đợi tối đa 3 giây để có tick đầu tiên
                if not b.up or b.clock.hours is not None:
                    break
                time.sleep(0.1)
            return self.reply(200, b.info())
        if u.path == "/mt5/candles":
            q = parse_qs(u.query)
            sid, tf = q.get("sym", [""])[0], q.get("tf", [""])[0]
            try:
                count = max(1, min(5000, int(q.get("count", ["500"])[0])))
            except ValueError:
                return self.reply(400, {"error": "count không hợp lệ"})
            if sid not in CANDIDATES or tf not in PERIOD:
                return self.reply(400, {"error": "mã hoặc khung không hợp lệ"})
            if not b.info()["ok"] or sid not in b.symbols:
                return self.reply(503, {"error": b.info()["error"] or "MT5 không có mã này"})
            try:
                return self.reply(200, b.candles(sid, tf, count))
            except Exception as e:
                return self.reply(503, {"error": str(e)})
        if u.path == "/mt5/stream":
            return self.stream()
        if not self.allowed(u.path):
            return self.send_error(404)
        return super().do_GET()

    def stream(self):
        b = self.bridge
        q = queue.Queue(maxsize=2000)
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()

        def pack(event, data):
            return ("event: %s\ndata: %s\n\n" % (event, json.dumps(data, separators=(",", ":")))).encode()

        def state():
            # chỉ báo "đã nối" khi lấy được nến: có phần mềm, có máy chủ sàn và đã đo được giờ
            return pack("state", {"connected": b.up and b.linked and b.clock.hours is not None})

        try:
            self.wfile.write(b"retry: 1000\n\n" + state())
            for ev in [t[1] for t in list(b.ticks.values()) if t[1]]:
                self.wfile.write(pack("tick", ev))
            for ev in list(b.forming.values()):
                self.wfile.write(pack("bar", ev))
            self.wfile.flush()
            b.clients.add(q)
            beat = time.time()
            while q in b.clients and not self.server.stopping:
                try:
                    self.wfile.write(q.get(timeout=1))
                except queue.Empty:
                    pass
                if time.time() - beat >= 1:
                    beat = time.time()
                    self.wfile.write(state())
                self.wfile.flush()
        except OSError:
            pass  # trình duyệt đã đóng trang
        finally:
            b.clients.discard(q)
            self.close_connection = True


class Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = False  # trên Windows, để True thì hai bản chạy chồng cùng một cổng
    stopping = False

    def handle_error(self, request, client_address):
        if not isinstance(sys.exc_info()[1], OSError):
            super().handle_error(request, client_address)


def serve(bridge, port):
    handler = type("BoundHandler", (Handler,), {"bridge": bridge})
    return Server(("127.0.0.1", port), handler)


def main():
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Cầu nối MT5 -> ICT Live trên máy này (chỉ đọc giá).")
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--open", action="store_true", help="mở trình duyệt vào trang ICT Live")
    ap.add_argument("--terminal", help="đường dẫn terminal64.exe nếu máy có nhiều bản MT5")
    ap.add_argument("--gold", help="tên mã vàng trong MT5 (ví dụ XAUUSDm)")
    ap.add_argument("--btc", help="tên mã Bitcoin trong MT5")
    ap.add_argument("--offset", type=float, help="giờ máy chủ sàn đi trước UTC (bỏ trống: tự đo)")
    args = ap.parse_args()
    try:
        import MetaTrader5 as mt5
    except ImportError:
        print("Chưa cài gói MetaTrader5. Chạy: python -m pip install MetaTrader5")
        return 1
    url = "http://127.0.0.1:%d/live/" % args.port
    bridge = Bridge(mt5, args.terminal, {"XAUUSD": args.gold, "BTCUSD": args.btc}, args.offset)
    try:
        server = serve(bridge, args.port)
    except OSError:
        print("Cổng %d đang được dùng: có thể chương trình đã chạy rồi. Mở %s" % (args.port, url))
        if args.open:
            webbrowser.open(url)
        return 1
    if not bridge.connect():
        log(bridge.error)
        log("Hãy mở MT5 và đăng nhập; chương trình sẽ tự nối. Trong lúc đó trang dùng giá web.")
    stop = threading.Event()
    reader = threading.Thread(target=bridge.run, args=(stop,), daemon=True)
    reader.start()
    web = threading.Thread(target=server.serve_forever, daemon=True)
    web.start()
    for _ in range(100):
        if not bridge.up or bridge.clock.hours is not None:
            break
        time.sleep(0.1)
    if bridge.up:
        if bridge.clock.hours is None:
            log("Chưa đo được giờ máy chủ sàn (không có giá mới). Có thể thêm --offset, ví dụ --offset 0")
        else:
            log("Giờ máy chủ sàn: UTC%+g%s" % (bridge.clock.hours, " (theo phiên New York)" if bridge.clock.ny else ""))
    log("Trang trực tiếp:", url)
    log("Giữ cửa sổ này mở. Bấm Ctrl+C để dừng.")
    if args.open:
        webbrowser.open(url)
    try:
        while web.is_alive():
            time.sleep(0.5)
    except KeyboardInterrupt:
        pass
    server.stopping = True
    stop.set()
    server.shutdown()
    reader.join(3)
    if bridge.up:
        bridge.call("shutdown")
    return 0


if __name__ == "__main__":
    sys.exit(main())
