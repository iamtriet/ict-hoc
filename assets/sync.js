/* ICT Hub — đồng bộ tiến độ giữa các thiết bị qua một repo GitHub RIÊNG TƯ (GitHub Contents API).
   Dữ liệu: bài đã học, quiz, thi thử, nhật ký, checklist, kế hoạch, dữ liệu CSV, ghi chú tin tức.
   Token (fine-grained, chỉ quyền Contents trên đúng 1 repo) chỉ lưu trong trình duyệt của từng thiết bị. */
(function () {
  'use strict';
  const ICT = window.ICT, esc = ICT.esc, $ = (s, r) => (r || document).querySelector(s);
  const KEYS = ['done', 'qbest', 'exam', 'journal', 'plan', 'chk', 'raw', 'newsnote'];
  const CFGK = 'ict.sync.cfg', TSK = 'ict.sync.ts', LASTK = 'ict.sync.last';
  const rd = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };
  const has = (x) => x !== undefined && x !== null;
  const enc = (s) => btoa(unescape(encodeURIComponent(s)));
  const dec = (b) => decodeURIComponent(escape(atob(b.replace(/\s/g, ''))));
  const cfg = () => rd(CFGK, null);
  let state = { st: cfg() ? 'idle' : 'off', msg: cfg() ? 'Chưa đồng bộ' : 'Chưa kết nối' }, timer = null, busy = false, listeners = [];

  function setState(st, msg) {
    state = { st, msg };
    listeners.forEach((f) => { try { f(state); } catch (e) { /* bỏ qua */ } });
    const b = document.getElementById('syncBtn'); if (b) { b.dataset.st = st; b.title = 'Đồng bộ: ' + msg; }
  }

  /* ảnh chụp dữ liệu cục bộ; khóa có dữ liệu nhưng chưa có mốc thời gian được gán mốc hiện tại */
  function snap() {
    const ts = rd(TSK, {}), data = {};
    KEYS.forEach((k) => {
      const v = rd('ict.' + k, null); if (!has(v)) return;
      data[k] = v; if (!ts[k]) ts[k] = Date.now();
    });
    wr(TSK, ts); return { data, ts };
  }

  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  function merge(L, R) {
    const out = { data: {}, ts: {} };
    KEYS.forEach((k) => {
      const lv = L.data[k], rv = R.data && R.data[k], lt = L.ts[k] || 0, rt = (R.ts && R.ts[k]) || 0;
      let v, t;
      if (!has(rv)) { v = lv; t = lt; }
      else if (!has(lv)) { v = rv; t = rt; }
      else if (k === 'done' && isObj(lv) && isObj(rv)) { v = Object.assign({}, rv, lv); t = Math.max(lt, rt); } // gộp: bài đã học không bị mất
      else if (k === 'qbest' && isObj(lv) && isObj(rv)) { v = Object.assign({}, rv); Object.keys(lv).forEach((i) => { v[i] = Math.max(v[i] || 0, lv[i] || 0); }); t = Math.max(lt, rt); }
      else if (k === 'exam' && Array.isArray(lv) && Array.isArray(rv)) { const m = {}; rv.concat(lv).forEach((e) => { m[e.ts + '|' + e.ok + '|' + e.t] = e; }); v = Object.keys(m).map((i) => m[i]).sort((a, b) => a.ts - b.ts).slice(-20); t = Math.max(lt, rt); }
      else if (rt > lt) { v = rv; t = rt; } else { v = lv; t = lt; } // còn lại: bản mới hơn thắng
      if (has(v)) { out.data[k] = v; out.ts[k] = t; }
    });
    return out;
  }
  const same = (a, b) => JSON.stringify(a.data) === JSON.stringify(b.data || {});

  function api(method, body) {
    const c = cfg();
    const h = { Authorization: 'Bearer ' + c.tok, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (body) h['Content-Type'] = 'application/json';
    return fetch('https://api.github.com/repos/' + c.repo + '/contents/' + c.path + (method === 'GET' ? '?t=' + Date.now() : ''), { method, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  }
  async function pull() {
    const r = await api('GET');
    if (r.status === 404) return { sha: null, doc: null };
    if (r.status === 401) throw new Error('Token không hợp lệ hoặc đã hết hạn.');
    if (r.status === 403) throw new Error('Token thiếu quyền (cần Contents: Read and write) hoặc bị giới hạn tốc độ.');
    if (!r.ok) throw new Error('GitHub trả lỗi ' + r.status + '.');
    const j = await r.json();
    let doc = null; try { doc = JSON.parse(dec(j.content)); } catch (e) { throw new Error('File dữ liệu trên GitHub bị hỏng.'); }
    return { sha: j.sha, doc };
  }

  /* mode: 'merge' (gộp hai chiều) | 'push' (máy này ghi đè đám mây) | 'pull' (đám mây ghi đè máy này) */
  async function run(mode) {
    const c = cfg(); if (!c || busy) return false;
    if (!navigator.onLine) { setState('err', 'Đang offline — sẽ đồng bộ khi có mạng'); return false; }
    busy = true; setState('sync', 'Đang đồng bộ…');
    try {
      let changedLocal = false;
      for (let i = 0; i < 3; i++) {
        const { sha, doc } = await pull(), L = snap(), R = doc && doc.data ? doc : { data: {}, ts: {} };
        let out;
        if (mode === 'push') out = { data: L.data, ts: L.ts };
        else if (mode === 'pull') { if (!doc) throw new Error('Trên đám mây chưa có dữ liệu để lấy.'); out = { data: R.data, ts: R.ts || {} }; }
        else out = merge(L, R);
        if (mode === 'pull') KEYS.forEach((k) => { if (!has(out.data[k])) try { localStorage.removeItem('ict.' + k); } catch (e) { /* bỏ qua */ } });
        KEYS.forEach((k) => { if (has(out.data[k]) && JSON.stringify(out.data[k]) !== JSON.stringify(L.data[k])) { try { localStorage.setItem('ict.' + k, JSON.stringify(out.data[k])); changedLocal = true; } catch (e) { /* bỏ qua */ } } });
        wr(TSK, out.ts);
        if (doc && same(out, R)) break; // đám mây đã đúng, không cần ghi
        const body = { message: 'sync ' + new Date().toISOString(), content: enc(JSON.stringify({ v: 1, saved: Date.now(), ts: out.ts, data: out.data })) };
        if (sha) body.sha = sha;
        const w = await api('PUT', body);
        if (w.ok) break;
        if ((w.status === 409 || w.status === 422) && i < 2) continue; // máy khác vừa ghi: thử lại
        if (w.status === 401 || w.status === 403) throw new Error('Token không có quyền ghi (cần Contents: Read and write).');
        if (w.status === 404) throw new Error('Không tìm thấy repo "' + c.repo + '" hoặc token không truy cập được repo này.');
        throw new Error('Không ghi được lên GitHub (' + w.status + ').');
      }
      wr(LASTK, Date.now());
      const d = new Date();
      setState('ok', 'Đã đồng bộ lúc ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'));
      if (changedLocal && ICT.afterSync) ICT.afterSync();
      busy = false; return true;
    } catch (e) {
      busy = false; setState('err', e && e.message ? e.message : 'Lỗi đồng bộ');
      return false;
    }
  }

  function schedule(ms) { if (!cfg()) return; clearTimeout(timer); timer = setTimeout(() => run('merge'), ms); }

  ICT.sync = {
    touch(k) { if (KEYS.indexOf(k) < 0) return; const ts = rd(TSK, {}); ts[k] = Date.now(); wr(TSK, ts); schedule(4000); },
    run, state: () => state,
    init() {
      if (!cfg()) return;
      setState('idle', 'Chưa đồng bộ'); setTimeout(() => run('merge'), 800);
      if (ICT.sync._on) return; ICT.sync._on = true;
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && Date.now() - rd(LASTK, 0) > 60000) run('merge'); });
      window.addEventListener('online', () => run('merge'));
    },
  };

  /* ---- Trang "Đồng bộ" ---- */
  ICT.syncPage = function (view) {
    const c = cfg(), last = rd(LASTK, 0);
    const guide = '<details class="tool"' + (c ? '' : ' open') + '><summary><b>Cách tạo token (làm 1 lần, dùng cho mọi thiết bị)</b></summary><ol>' +
      '<li>Mở <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com/settings/personal-access-tokens/new</a>.</li>' +
      '<li><b>Token name</b>: <code>ict-sync</code> · <b>Expiration</b>: tùy bạn (ví dụ 1 năm).</li>' +
      '<li><b>Repository access</b> → <i>Only select repositories</i> → chọn <code>ict-data</code>.</li>' +
      '<li><b>Permissions</b> → <i>Repository permissions</i> → <b>Contents: Read and write</b> (không cần quyền nào khác).</li>' +
      '<li>Bấm <b>Generate token</b>, sao chép chuỗi bắt đầu bằng <code>github_pat_</code> và dán vào ô bên dưới. Trên mỗi thiết bị khác, dán lại cùng token này.</li></ol>' +
      '<p class="muted" style="font-size:13px">Token chỉ lưu trong trình duyệt của thiết bị này và chỉ truy cập được repo dữ liệu, không đụng tới mã nguồn. Dùng máy chung thì nhớ bấm “Ngắt kết nối” sau khi học.</p></details>';
    const form = '<form class="tool" id="sy-form" method="post" action="#sync" autocomplete="on"><div class="frm"><div class="fld"><label for="sy-r">Repo dữ liệu</label><input id="sy-r" name="repo" value="' + esc(c ? c.repo : 'iamtriet/ict-data') + '" autocomplete="off" spellcheck="false"></div>' +
      '<div class="fld"><label for="sy-u">Tên lưu trong trình quản lý mật khẩu</label><input id="sy-u" name="username" value="ict-sync" autocomplete="username" spellcheck="false"></div>' +
      '<div class="fld"><label for="sy-t">Token</label><input id="sy-t" name="password" type="password" placeholder="github_pat_…" autocomplete="current-password" spellcheck="false"></div></div>' +
      '<div class="btns" style="margin-top:12px"><button type="submit" class="btn pri" id="sy-go">Kết nối &amp; đồng bộ</button></div><p class="muted" style="font-size:13px;margin:8px 0 0">Khi trình duyệt hỏi, hãy chọn <b>Lưu mật khẩu</b>: lần sau trên thiết bị khác (cùng tài khoản trình duyệt) chỉ cần bấm tự điền.</p></form>';
    const panel = '<div class="tool"><p>Trạng thái: <b id="sy-st"></b></p><p class="muted" style="font-size:13px">Repo: <code>' + esc(c ? c.repo : '') + '</code>' + (last ? ' · Lần cuối: ' + new Date(last).toLocaleString('vi-VN') : '') + '</p>' +
      '<div class="btns"><button type="button" class="btn pri" id="sy-now">Đồng bộ ngay</button><button type="button" class="btn" id="sy-push">Ghi đè đám mây bằng máy này</button><button type="button" class="btn" id="sy-pull">Lấy từ đám mây (ghi đè máy này)</button><button type="button" class="btn" id="sy-off">Ngắt kết nối</button></div>' +
      '<p class="muted" style="font-size:13px;margin-top:10px">Tự đồng bộ khi mở app, khi quay lại tab và vài giây sau mỗi thay đổi. Bài đã học được gộp từ mọi máy; điểm quiz lấy điểm cao nhất; nhật ký, kế hoạch và checklist lấy bản sửa mới nhất. Muốn bỏ đánh dấu một bài trên mọi máy, hãy bỏ ở một máy rồi bấm “Ghi đè đám mây bằng máy này”.</p></div>';
    view.innerHTML = '<div class="page"><div class="crumb">Đồng bộ</div><h1>Đồng bộ giữa các thiết bị</h1><p class="lead">Tiến độ, quiz, nhật ký, kế hoạch và dữ liệu CSV được lưu vào một repo <b>riêng tư</b> trên GitHub của bạn, để điện thoại và máy tính dùng chung một dữ liệu.</p>' + (c ? panel : '') + (c ? '' : form) + guide + (c ? '<h3>Đổi token hoặc repo</h3>' + form : '') + '</div>';
    const st = $('#sy-st', view), show = (s) => { st.textContent = s.msg; st.className = s.st === 'ok' ? 'up' : s.st === 'err' ? 'dn' : ''; };
    if (st) { show(state); listeners.push(show); ICT.live.push(() => { listeners = listeners.filter((f) => f !== show); }); }
    const go = $('#sy-form', view);
    go.onsubmit = (ev) => {
      ev.preventDefault();
      const repo = $('#sy-r', view).value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, ''), tok = $('#sy-t', view).value.trim() || (c && c.tok);
      if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !tok) { alert('Nhập repo dạng "tên/repo" và dán token.'); return; }
      wr(CFGK, { repo, tok, path: 'progress.json' }); ICT.sync.init(); run('merge').then(() => { if (location.hash === '#sync') ICT.syncPage(view); });
    };
    const b = (id, fn) => { const e = $(id, view); if (e) e.onclick = fn; };
    b('#sy-now', () => run('merge').then(() => ICT.syncPage(view)));
    b('#sy-push', () => { if (confirm('Ghi đè dữ liệu trên đám mây bằng dữ liệu của máy này?')) run('push').then(() => ICT.syncPage(view)); });
    b('#sy-pull', () => { if (confirm('Thay dữ liệu của máy này bằng dữ liệu trên đám mây?')) run('pull').then(() => ICT.syncPage(view)); });
    b('#sy-off', () => { try { localStorage.removeItem(CFGK); } catch (e) { /* bỏ qua */ } clearTimeout(timer); setState('off', 'Chưa kết nối'); ICT.syncPage(view); });
  };
})();
