"""Kiểm tra cầu nối MT5 bằng một MT5 giả (không cần phần mềm, không cần mạng). Chạy: python local/test_server.py"""
import calendar
import json
import sys
import threading
import time
import urllib.error
import urllib.request
from types import SimpleNamespace as NS

sys.path.insert(0, __file__.rsplit("test_server.py", 1)[0] or ".")
import mt5_server as srv  # noqa: E402

for s in (sys.stdout, sys.stderr):
    if hasattr(s, "reconfigure"):
        s.reconfigure(encoding="utf-8", errors="replace")


def need(cond, msg):
    if not cond:
        raise AssertionError(msg)


def ts(*a):
    return calendar.timegm(a + (0,) * (6 - len(a)))


class FakeMT5:
    TIMEFRAME_M5, TIMEFRAME_M15, TIMEFRAME_H1, TIMEFRAME_H4, TIMEFRAME_D1 = 5, 15, 60, 240, 1440

    def __init__(self, now, ahead=0):
        self.now, self.ahead = now, ahead * 3600
        self.bid = 3500.0
        self.msc = int((now + self.ahead) * 1000)
        names = ["XAUEURm", "XAUUSD247m", "XAUUSDm", "BTCUSDTm", "BTCUSDm", "ETHBTCm"]
        self.syms = [NS(name=n, visible=n in ("XAUUSDm", "BTCUSDm"), digits=3) for n in names]

    def initialize(self, **k):
        return True

    def shutdown(self):
        pass

    def last_error(self):
        return (1, "ok")

    def terminal_info(self):
        return NS(connected=True)

    def symbols_get(self):
        return self.syms

    def symbol_select(self, name, on):
        return True

    def symbol_info_tick(self, name):
        return NS(time=self.msc // 1000, time_msc=self.msc, bid=self.bid, ask=self.bid + 0.2)

    def copy_rates_from_pos(self, name, frame, start, count):
        g = frame * 60
        last = int(self.now + self.ahead) // g * g
        return [dict(time=last - (count - 1 - i) * g, open=1.0, high=2.0, low=0.5, close=self.bid if i == count - 1 else 1.5) for i in range(count)]


def events(q):
    out = []
    while not q.empty():
        kind, data = q.get().decode().strip().split("\n")
        out.append((kind[7:], json.loads(data[6:])))
    return out


def test_clock():
    c = srv.Clock()
    now = ts(2026, 11, 26, 7)
    c.observe(now + 0.4, now)
    need(c.hours == 0 and not c.ny and c.utc(now) == now, "sàn giờ UTC")
    c = srv.Clock()
    c.observe(now - 3600 * 5 - 900, now)
    need(c.hours is None, "tick cũ không đúng mốc nửa giờ thì không được dùng để đo")
    c = srv.Clock()
    c.observe(now + 7200, now)
    need(c.hours == 2 and c.ny, "sàn giờ phiên New York (mùa đông UTC+2)")
    summer = ts(2026, 7, 1, 12)
    need(c.utc(summer + 3 * 3600) == summer, "nến mùa hè phải trừ 3 giờ")
    need(c.utc(now + 7200) == now, "nến mùa đông phải trừ 2 giờ")
    for _ in range(4):
        c.observe(now + 5 * 3600, now)
    need(c.hours == 2, "một giá trị lạ thoáng qua không được đổi giờ đã đo")
    c.observe(now + 5 * 3600, now)
    need(c.hours == 5, "giá trị mới lặp lại nhiều lần thì đổi")
    f = srv.Clock(3)
    f.observe(now, now)
    need(f.hours == 3 and f.utc(now + 3 * 3600) == now, "giờ nhập tay được giữ nguyên")
    need(srv.us_dst(ts(2026, 3, 8, 8)) and not srv.us_dst(ts(2026, 3, 8, 6)) and srv.us_dst(ts(2026, 11, 1, 5)) and not srv.us_dst(ts(2026, 11, 1, 7)), "mốc đổi giờ của Mỹ")


def test_bridge():
    start = ts(2026, 11, 26, 7, 20)
    fake = FakeMT5(start, ahead=2)
    b = srv.Bridge(fake)
    need(b.connect(), "phải nối được")
    need({k: v["name"] for k, v in b.symbols.items()} == {"XAUUSD": "XAUUSDm", "BTCUSD": "BTCUSDm"}, "chọn sai mã: %s" % b.symbols)
    need(not b.info()["ok"], "chưa có tick mới thì chưa biết giờ máy chủ")
    q = srv.queue.Queue()
    b.clients.add(q)
    b.step(True, now=start)
    need(not events(q), "chưa đo được giờ thì chưa phát gì")
    fake.msc += 500
    fake.bid = 3501.0
    b.step(True, now=start + 0.5)
    got = events(q)
    need(b.info()["ok"] and b.clock.hours == 2, "đo giờ máy chủ sai: %s" % b.clock.hours)
    tick = [d for k, d in got if k == "tick" and d["sym"] == "XAUUSD"][0]
    need(tick["t"] == int((start + 0.5) * 1000) and tick["bid"] == 3501.0, "tick phải đổi về UTC: %s" % tick)
    forming = [d for k, d in got if k == "bar" and d["sym"] == "XAUUSD" and d["tf"] == "m15"][-1]
    need(not forming["closed"] and forming["bar"][0] == ts(2026, 11, 26, 7, 15) * 1000, "nến đang chạy sai giờ: %s" % forming)
    c = b.candles("XAUUSD", "m15", 5, now=start)
    need(len(c["closed"]) == 5 and c["open"][0] == ts(2026, 11, 26, 7, 15) * 1000 and c["closed"][-1][0] == ts(2026, 11, 26, 7) * 1000, "tách nến đã đóng / đang chạy sai")
    # sang kỳ mới: nến cũ được chốt đúng một lần
    fake.now = ts(2026, 11, 26, 7, 30, 1)
    fake.msc = int((fake.now + fake.ahead) * 1000)
    b.step(False, now=fake.now)
    done = [d for k, d in events(q) if k == "bar" and d["sym"] == "XAUUSD" and d["tf"] == "m15" and d["closed"]]
    need(len(done) == 1 and done[0]["bar"][0] == ts(2026, 11, 26, 7, 15) * 1000, "phải chốt nến cũ: %s" % done)
    b.step(True, now=fake.now + 1)
    need(not [d for k, d in events(q) if k == "bar" and d["closed"] and d["tf"] == "m15"], "không được chốt lặp")
    # hết giờ mà không có tick mới (thị trường nghỉ): chốt sau vài giây
    b.step(True, now=ts(2026, 11, 26, 7, 45) + 1)
    need(not [d for k, d in events(q) if k == "bar" and d["closed"] and d["tf"] == "m15"], "chưa quá thời gian chờ")
    b.step(True, now=ts(2026, 11, 26, 7, 45) + srv.GRACE + 0.1)
    done = [d for k, d in events(q) if k == "bar" and d["sym"] == "XAUUSD" and d["tf"] == "m15" and d["closed"]]
    need(len(done) == 1 and done[0]["bar"][0] == ts(2026, 11, 26, 7, 30) * 1000, "thiếu nến chốt theo giờ: %s" % done)


def test_wrong_pc_clock():
    start = ts(2026, 11, 26, 7, 29, 0)  # giờ thật của sàn
    fake = FakeMT5(start)
    b = srv.Bridge(fake)
    b.connect()
    q = srv.queue.Queue()
    b.clients.add(q)
    fast = 90  # đồng hồ máy chạy nhanh 90 giây
    b.step(True, now=start + fast)
    for i in range(1, 40):  # tick đều đặn tới sát giờ đóng nến
        fake.now = start + i
        fake.msc = int(fake.now * 1000)
        b.step(True, now=fake.now + fast + 0.05)
    got = [d for k, d in events(q) if k == "bar" and d["tf"] == "m15"]
    need(b.clock.hours == 0, "máy lệch 90 giây vẫn phải đo được giờ sàn: %s" % b.clock.hours)
    need(not [d for d in got if d["closed"]], "máy chạy nhanh không được làm nến bị chốt sớm: %s" % [d for d in got if d["closed"]][:2])
    c = b.candles("XAUUSD", "m15", 3, now=fake.now + fast)
    need(c["open"] and c["open"][0] == ts(2026, 11, 26, 7, 15) * 1000, "nến đang chạy bị coi là đã đóng")
    b.step(True, now=ts(2026, 11, 26, 7, 30) + srv.GRACE + 0.2 + fast)
    need([d for k, d in events(q) if k == "bar" and d["tf"] == "m15" and d["closed"]], "hết giờ theo sàn thì phải chốt")


def test_http():
    now = time.time()
    fake = FakeMT5(now)
    b = srv.Bridge(fake, offset=0)
    b.connect()
    server = srv.serve(b, 0)
    port = server.server_address[1]
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d" % port

    def get(path, host=None):
        r = urllib.request.Request(base + path, headers={"Host": host} if host else {})
        try:
            with urllib.request.urlopen(r, timeout=5) as x:
                return x.status, x.read(), x.headers
        except urllib.error.HTTPError as e:
            return e.code, b"", e.headers

    b.linked = True
    try:
        code, body, head = get("/mt5/info")
        need(code == 200 and json.loads(body)["ok"] and head.get("Access-Control-Allow-Origin") is None, "info")
        code, body, _ = get("/mt5/candles?sym=XAUUSD&tf=h1&count=7")
        j = json.loads(body)
        need(code == 200 and len(j["closed"]) == 7 and j["open"], "candles")
        for tf in ("m5", "d1"):
            need(get("/mt5/candles?sym=BTCUSD&tf=%s&count=3" % tf)[0] == 200, "thiếu nến " + tf)
        need(get("/mt5/candles?sym=EURUSD&tf=h1")[0] == 400 and get("/mt5/candles?sym=XAUUSD&tf=d7")[0] == 400, "tham số sai phải bị từ chối")
        for ok in ("/live/", "/live/app.js", "/assets/mt5.js", "/index.html", "/"):
            need(get(ok)[0] == 200, "phải phục vụ được " + ok)
        for bad in ("/.git/config", "/local/mt5_server.py", "/.claude/launch.json", "/scripts/notify.js", "/sw.js", "/assets/../.git/config", "/assets/%2e%2e/.git/config",
                    "/assets/..%5c.git%5cconfig", "/tai-lieu/"):
            need(get(bad)[0] == 404, "không được phục vụ " + bad)
        need(get("/mt5/info", host="evil.example:%d" % port)[0] == 403, "Host lạ phải bị chặn")
        # luồng trực tiếp: nhận được trạng thái rồi giá
        with urllib.request.urlopen(base + "/mt5/stream", timeout=5) as x:
            need(x.headers["Content-Type"] == "text/event-stream", "kiểu luồng")
            for _ in range(100):
                if b.clients:
                    break
                time.sleep(0.01)
            b.step(True)
            seen = b""
            end = time.time() + 4
            while time.time() < end and not (b"event: state" in seen and b"event: tick" in seen):
                seen += x.readline()
            need(b"event: state" in seen and b"event: tick" in seen, "luồng thiếu sự kiện: %r" % seen[:200])
            need(b'"connected":true' in seen, "đã sẵn sàng thì phải báo đã nối")
        b.clock.hours, b.clock.fixed = None, False
        with urllib.request.urlopen(base + "/mt5/stream", timeout=5) as x:
            head3 = x.readline() + x.readline() + x.readline() + x.readline()
            need(b'"connected":false' in head3, "chưa đo được giờ sàn thì chưa được báo đã nối: %r" % head3)
    finally:
        server.stopping = True
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    bad = 0
    for name, fn in (("giờ máy chủ sàn", test_clock), ("đọc giá và chốt nến", test_bridge), ("đồng hồ máy chạy sai", test_wrong_pc_clock), ("máy chủ web chỉ trên máy", test_http)):
        try:
            fn()
            print("✔ MT5:", name)
        except Exception as e:  # noqa: BLE001
            bad += 1
            print("✖ MT5:", name, "-", e)
    sys.exit(1 if bad else 0)
