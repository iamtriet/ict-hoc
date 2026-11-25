/* ICT Hub — ứng dụng: định tuyến, tiến độ, trang chủ, giáo trình, Replay Lab, thi thử */
(function () {
  'use strict';
  const ICT = window.ICT, esc = ICT.esc, $ = (s, r) => (r || document).querySelector(s);
  const store = (ICT.store = {
    get(k, d) { try { const v = localStorage.getItem('ict.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ict.' + k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } if (ICT.sync) ICT.sync.touch(k); },
  });
  ICT.live = []; // bộ dọn dẹp khi đổi trang
  const view = $('#view'), side = $('#side');
  const L = ICT.lessons, M = ICT.modules, byId = {}; L.forEach((l) => (byId[l.id] = l));
  const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const done = () => store.get('done', {}), qbest = () => store.get('qbest', {});
  const tagMap = { 1: 'Cơ bản', 2: 'Trung cấp', 3: 'Nâng cao' };

  /* ---- Quiz ---- */
  ICT.renderQuiz = function (el, items, opt) {
    opt = opt || {}; let ans = 0, ok = 0; const total = items.length;
    el.innerHTML = items.map((z, i) => '<div class="qq" data-i="' + i + '"><b>' + (i + 1) + '. ' + z.q + '</b><div class="opts">' + z.o.map((t, k) => '<button type="button" class="opt" data-k="' + k + '">' + t + '</button>').join('') + '</div><div class="fb"></div></div>').join('') + '<div class="qs"></div>';
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.opt'); if (!b || b.disabled) return;
      const qq = b.closest('.qq'), z = items[+qq.dataset.i], k = +b.dataset.k, good = k === z.a;
      [].forEach.call(qq.querySelectorAll('.opt'), (x, i) => { x.disabled = true; if (i === z.a) x.classList.add('ok'); else if (i === k) x.classList.add('no'); });
      qq.querySelector('.fb').innerHTML = '<p><b>' + (good ? '✔ Đúng. ' : '✘ Chưa đúng. ') + '</b>' + (z.why || '') + '</p>';
      ans++; if (good) ok++;
      if (ans === total) { el.querySelector('.qs').innerHTML = 'Kết quả: <span class="' + (ok / total >= 0.7 ? 'up' : 'dn') + '">' + ok + '/' + total + ' (' + Math.round((ok / total) * 100) + '%)</span>'; if (opt.onDone) opt.onDone(ok, total); }
    });
  };

  /* ---- Điều hướng ---- */
  function buildSide() {
    const d = done(); let h = '<a class="nv" href="#home" data-r="home">⌂ Trang chủ</a><a class="nv" href="#curriculum" data-r="curriculum">☰ Tổng quan giáo trình</a><h6>Giáo trình</h6>';
    M.forEach((m) => {
      const ls = L.filter((l) => l.m === m.n), n = ls.filter((l) => d[l.id]).length;
      h += '<details data-m="' + m.n + '"><summary><span>' + esc(m.title) + '</span><span class="mp">' + n + '/' + ls.length + '</span></summary><div class="ls">' + ls.map((l) => '<a class="nv" href="#' + l.id + '" data-r="' + l.id + '"><i class="dotp ' + (d[l.id] ? 'ok' : '') + '"></i>' + esc(l.title) + '</a>').join('') + '</div></details>';
    });
    h += '<h6>Thực hành</h6><a class="nv" href="#analyst" data-r="analyst">◈ Phân tích &amp; gợi ý lệnh</a><a class="nv" href="#replay" data-r="replay">▶ Replay Lab</a><a class="nv" href="#live" data-r="live">◉ Biểu đồ XAUUSD trực tiếp</a><a class="nv" href="#news" data-r="news">✺ Tin tức &amp; lịch kinh tế</a><a class="nv" href="#tools" data-r="tools">⚒ Công cụ</a><a class="nv" href="#glossary" data-r="glossary">Aa Từ điển ICT</a><a class="nv" href="#exam" data-r="exam">✎ Thi thử tổng hợp</a><a class="nv" href="#refs" data-r="refs">↗ Tham khảo</a><a class="nv" href="#progress" data-r="progress">◔ Tiến độ</a><a class="nv" href="#sync" data-r="sync">☁ Đồng bộ thiết bị</a>';
    side.innerHTML = h;
  }
  function markSide(r) {
    [].forEach.call(side.querySelectorAll('a.nv'), (a) => a.classList.toggle('on', a.dataset.r === r || (r.indexOf('t-') === 0 && a.dataset.r === 'tools') || (r.indexOf('rp-') === 0 && a.dataset.r === 'replay')));
    const cur = byId[r]; if (cur) { const dt = side.querySelector('details[data-m="' + cur.m + '"]'); if (dt) dt.open = true; const a = side.querySelector('a.on'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' }); }
  }
  function route() {
    ICT.live.forEach((f) => { try { f(); } catch (e) { /* bỏ qua */ } }); ICT.live = []; view.onclick = null;
    document.body.classList.remove('nav');
    const r = (location.hash || '#home').slice(1) || 'home';
    let ok = true;
    if (r === 'home') home();
    else if (byId[r]) lesson(byId[r]);
    else if (r === 'curriculum') curriculum();
    else if (r === 'replay' || r.indexOf('rp-') === 0) replayLab(r === 'replay' ? null : r.slice(3));
    else if (r === 'tools') ICT.tools.hub(view);
    else if (r.indexOf('t-') === 0 && ICT.tools.items[r.slice(2)]) ICT.tools.page(view, r.slice(2));
    else if (r === 'glossary') ICT.glossaryPage(view);
    else if (r === 'analyst') ICT.analystPage(view);
    else if (r === 'news') ICT.newsPage(view);
    else if (r === 'live') ICT.livePage(view);
    else if (r === 'refs') ICT.refsPage(view);
    else if (r === 'exam') exam();
    else if (r === 'progress') progress();
    else if (r === 'sync') ICT.syncPage(view);
    else { ok = false; home(); }
    markSide(ok ? r : 'home'); window.scrollTo(0, 0); document.title = 'Kênh Học ICT';
    view.insertAdjacentHTML('beforeend', '<div class="foot">Nội dung chỉ nhằm mục đích giáo dục, không phải lời khuyên đầu tư. Toàn bộ biểu đồ là <b>dữ liệu mô phỏng</b> do chương trình tạo ra để minh họa khái niệm, không phải giá thị trường thật. Giao dịch có rủi ro mất vốn. ICT (Inner Circle Trader) là khái niệm của Michael J. Huddleston; kênh học này là tài liệu độc lập, không liên kết hay được xác nhận bởi ông.</div>');
  }

  /* ---- Trang chủ ---- */
  function home() {
    const d = done(), n = Object.keys(d).filter((k) => byId[k]).length, next = L.filter((l) => !d[l.id])[0];
    view.innerHTML = '<div class="page wide"><div class="hero"><div><div class="crumb">Kênh học · Tiếng Việt · Miễn phí</div><h1>Học ICT bằng cách <em>xem giá chạy</em>, không chỉ đọc lý thuyết.</h1></div><p>Giáo trình ICT Trading Concepts từ cấu trúc thị trường, thanh khoản, PD Array, killzone đến các mô hình vào lệnh — mỗi khái niệm đi kèm biểu đồ tương tác, replay từng nến và bài kiểm tra.</p><div class="btns"><a class="btn pri" href="#' + (next ? next.id : 'm0l1') + '">' + (n ? 'Học tiếp: ' + esc(next ? next.title : 'Ôn tập') : 'Bắt đầu bài 1') + '</a><a class="btn" href="#replay">Mở Replay Lab</a><a class="btn" href="#news">Tin tức vàng</a><a class="btn" href="#t-killzone">Giờ killzone (giờ VN)</a></div></div><div id="heroP"></div>' +
      '<div class="stats"><div class="stat"><b>' + M.length + '</b><span>module</span></div><div class="stat"><b>' + L.length + '</b><span>bài học</span></div><div class="stat"><b>' + Object.keys(ICT.scenarios).length + '</b><span>kịch bản replay</span></div><div class="stat"><b>' + Object.keys(ICT.tools.items).length + '</b><span>công cụ</span></div><div class="stat"><b>' + ICT.glossary.length + '</b><span>thuật ngữ</span></div><div class="stat"><b>' + n + '/' + L.length + '</b><span>bài đã học</span></div></div>' +
      '<h2 style="font-size:22px;margin:30px 0 6px">Lộ trình</h2>' + M.map((m) => modHtml(m, d)).join('') +
      '<h2 style="font-size:22px;margin:34px 0 6px">Cách học hiệu quả nhất</h2><div class="cols"><div><h4>1 · Đọc ngắn, xem ngay</h4><p>Mỗi bài có biểu đồ bật/tắt từng lớp (swing, BOS/MSS, FVG, OB, thanh khoản). Bật dần từng lớp để hiểu nó làm gì.</p></div><div><h4>2 · Replay có hướng dẫn</h4><p>Replay tự dừng ở mỗi bước và đặt câu hỏi dự đoán. Hãy trả lời trước khi xem đáp án.</p></div><div><h4>3 · Tự thực hành</h4><p>Chuyển Replay Lab sang chế độ thực hành: ẩn chú thích, tự mua/bán, tự đặt SL/TP và xem kết quả theo R.</p></div><div><h4>4 · Ghi nhật ký</h4><p>Công cụ nhật ký tính win rate, expectancy, drawdown từ chính các lệnh của bạn.</p></div></div></div>';
    const P = ICT.Player($('#heroP'), ICT.scenarios.mssbull, { layers: ['ann'], avail: ['ann', 'swing', 'struct', 'fvg', 'ob', 'liq'], controls: true, cap: 'Thử ngay: bấm <b>▶ Phát</b> để xem một setup MSS hoàn chỉnh chạy từng bước.' });
    ICT.live.push(() => P.destroy());
  }
  function modHtml(m, d) {
    const ls = L.filter((l) => l.m === m.n);
    return '<div class="mod"><div class="n">' + String(m.n).padStart(2, '0') + '</div><h3>' + esc(m.title) + '</h3><div><p>' + esc(m.desc) + '</p><div class="ll">' + ls.map((l) => '<a href="#' + l.id + '" class="' + (d[l.id] ? 'ok' : '') + '">' + (d[l.id] ? '✔ ' : '') + esc(l.title) + '</a>').join('') + '</div></div></div>';
  }
  function curriculum() {
    const d = done(), n = L.filter((l) => d[l.id]).length;
    view.innerHTML = '<div class="page"><div class="crumb">Giáo trình</div><h1>Tổng quan giáo trình</h1><p class="lead">' + L.length + ' bài học trong ' + M.length + ' module. Hoàn thành ' + n + ' bài.</p><div class="bar"><i style="width:' + Math.round((n / L.length) * 100) + '%"></i></div>' + M.map((m) => modHtml(m, d)).join('') + '</div>';
  }

  /* ---- Bài học ---- */
  function lesson(l) {
    const m = M.filter((x) => x.n === l.m)[0], i = L.indexOf(l), prev = L[i - 1], next = L[i + 1], d = done();
    view.innerHTML = '<div class="page"><div class="crumb">Module ' + l.m + ' · ' + esc(m.title) + '</div><h1>' + esc(l.title) + '</h1><p class="lead">' + (l.lead || '') + '</p><div class="meta"><span class="tagc">⏱ ' + l.min + ' phút</span><span class="tagc ' + (l.lvl === 1 ? 'g' : 'o') + '">' + tagMap[l.lvl || 1] + '</span>' + (l.src ? '<span class="tagc">' + l.src + '</span>' : '') + '</div><div class="lesson">' + l.html + '</div>' +
      (l.replay && l.replay.length ? '<h2>Replay liên quan</h2><div class="cards">' + l.replay.map((id) => { const s = ICT.scenarios[id]; return s ? '<a class="card" href="#rp-' + id + '"><span class="tagc o">▶ Replay</span><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc || '') + '</p></a>' : ''; }).join('') + '</div>' : '') +
      (l.quiz && l.quiz.length ? '<div class="quiz"><h2>Kiểm tra nhanh</h2><p class="muted" style="margin:0">Chọn đáp án để xem giải thích ngay.</p><div id="qz"></div></div>' : '') +
      '<div class="btns" style="margin-top:26px"><button type="button" class="btn ' + (d[l.id] ? '' : 'pri') + '" id="doneBtn">' + (d[l.id] ? '✔ Đã học xong (bấm để bỏ)' : 'Đánh dấu đã học xong') + '</button></div>' +
      '<div class="lnav">' + (prev ? '<a href="#' + prev.id + '"><small>← Bài trước</small>' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a class="nx" href="#' + next.id + '"><small>Bài tiếp →</small>' + esc(next.title) + '</a>' : '<a class="nx" href="#exam"><small>Hoàn thành giáo trình →</small>Thi thử tổng hợp</a>') + '</div></div>';
    ICT.mountBlocks($('.lesson', view)).forEach((p) => ICT.live.push(() => p.destroy()));
    if (l.quiz && l.quiz.length) ICT.renderQuiz($('#qz'), l.quiz, { onDone(ok, t) { const q = qbest(); q[l.id] = Math.max(q[l.id] || 0, Math.round((ok / t) * 100)); store.set('qbest', q); } });
    $('#doneBtn').onclick = () => { const x = done(); if (x[l.id]) delete x[l.id]; else x[l.id] = 1; store.set('done', x); buildSide(); route(); };
    if (ICT.annotate) ICT.annotate($('.page', view));
    document.title = l.title + ' — Kênh Học ICT';
  }

  /* ---- Replay Lab ---- */
  function replayLab(id) {
    const ids = Object.keys(ICT.scenarios).filter((k) => ICT.scenarios[k].steps.length || k === 'liqmap'), mode = store.get('rmode', 'guided');
    if (!id || !ICT.scenarios[id]) id = id && ICT.scenarios[id] ? id : null;
    view.innerHTML = '<div class="page wide"><div class="crumb">Replay Lab</div><h1>Xem lại thị trường từng nến</h1><p class="lead">' + ids.length + ' kịch bản mô phỏng. <b>Có hướng dẫn</b>: replay tự dừng ở từng bước và hỏi dự đoán. <b>Tự thực hành</b>: chú thích bị ẩn, bạn tự quyết định mua/bán, SL/TP và nhận kết quả theo R.</p><div class="seg" role="group" aria-label="Chế độ"><button type="button" data-m="guided" class="' + (mode === 'guided' ? 'on' : '') + '">▶ Có hướng dẫn</button><button type="button" data-m="practice" class="' + (mode === 'practice' ? 'on' : '') + '">✎ Tự thực hành</button></div><div id="stage" style="margin:20px 0"></div>' + rawBox() + '<h2 style="font-size:20px;margin:26px 0 10px">Chọn kịch bản</h2><div class="rlg">' + ids.map((k) => { const s = ICT.scenarios[k]; return '<button type="button" class="rlc ' + (k === id ? 'on' : '') + '" data-id="' + k + '"><span class="tagc o">' + esc(s.tag || '') + '</span> <span class="tagc">' + '●'.repeat(s.lvl || 1) + '</span><b>' + esc(s.title) + '</b><small>' + esc(s.desc || '') + '</small></button>'; }).join('') + '</div></div>';
    const stage = $('#stage'); bindRaw();
    if (!id) stage.innerHTML = '<div class="blk" style="padding:18px"><b>Chọn một kịch bản bên dưới để bắt đầu.</b><p class="muted" style="margin:6px 0 0">Gợi ý cho người mới: <a href="#rp-mssbull">MSS tăng sau khi quét SSL</a> → <a href="#rp-fvg">FVG</a> → <a href="#rp-ob">Order Block</a>.</p></div>';
    else {
      const S = ICT.scenarios[id], avail = ['ann', 'swing', 'struct', 'fvg', 'ob', 'liq', 'pd'].concat(S.tf < 1440 ? ['kz'] : []).concat(id === 'sb' ? ['sb'] : []);
      const host = document.createElement('div'); host.className = 'blk'; stage.appendChild(host);
      const P = ICT.Player(host, S, { layers: S.raw ? (mode === 'guided' ? ['struct', 'fvg'] : []) : mode === 'guided' ? ['ann'] : [], avail: S.raw ? avail.filter((k) => k !== 'ann') : avail, controls: true, practice: mode === 'practice', h: 400, win: S.n > 70 ? 70 : 0, startV: S.raw ? Math.min(60, S.n - 1) : 10 });
      ICT.live.push(() => P.destroy());
      const rel = L.filter((l) => l.replay && l.replay.indexOf(id) >= 0);
      stage.insertAdjacentHTML('beforeend', '<p class="muted">' + esc(S.desc || '') + (rel.length ? ' Bài liên quan: ' + rel.map((l) => '<a href="#' + l.id + '">' + esc(l.title) + '</a>').join(', ') + '.' : '') + '</p>');
    }
    view.onclick = (e) => {
      const c = e.target.closest('.rlc'), s = e.target.closest('.seg button');
      if (c) { location.hash = 'rp-' + c.dataset.id; if (c.dataset.id === id) route(); }
      if (s) { store.set('rmode', s.dataset.m); route(); }
    };
    document.title = 'Replay Lab — Kênh Học ICT';
  }

  /* ---- Dữ liệu thật (CSV) ---- */
  function rawBox() {
    const has = !!ICT.scenarios.mydata;
    return '<details class="rawbox"' + (has ? ' open' : '') + '><summary>Dữ liệu thật của bạn (CSV từ TradingView / MT5) ' + (has ? '· đã nạp ' + ICT.scenarios.mydata.n + ' nến' : '') + '</summary><p class="muted" style="margin:8px 0">Nạp file nến OHLC của XAUUSD (hoặc bất kỳ sản phẩm nào) để replay và thực hành trên giá thật. Dữ liệu chỉ xử lý trong trình duyệt của bạn. Cần cột thời gian, open, high, low, close. Hướng dẫn xuất file ở trang <a href="#refs">Tham khảo</a>.</p><div class="frm"><div class="fld"><label for="rf">Chọn file CSV</label><input id="rf" type="file" accept=".csv,.txt,text/csv,text/plain"></div><div class="fld"><label for="ro">Múi giờ cột thời gian nếu không ghi rõ (UTC±giờ)</label><input id="ro" type="number" step="0.5" value="0"></div><div class="fld"><label for="rn">Tên hiển thị</label><input id="rn" value="XAUUSD dữ liệu thật"></div></div><div class="fld"><label for="rt">…hoặc dán nội dung CSV</label><textarea id="rt" placeholder="time,open,high,low,close&#10;2026-11-10T08:00:00-05:00,4012.3,4015.1,4010.2,4014.0"></textarea></div><div class="btns" style="margin-top:10px"><button type="button" class="btn pri" id="rgo">Nạp &amp; replay</button>' + (has ? '<button type="button" class="btn" id="rdel">Xóa dữ liệu đã nạp</button>' : '') + '<span class="muted" id="rms" style="font-size:13px"></span></div></details>';
  }
  function parseCSV(txt, off) {
    const lines = txt.trim().split(/\r?\n/).filter((l) => l.trim()); if (lines.length < 21) throw new Error('Cần ít nhất 20 dòng dữ liệu.');
    const delim = lines[0].indexOf('\t') >= 0 ? '\t' : lines[0].indexOf(';') >= 0 ? ';' : ',';
    const head = lines[0].split(delim).map((x) => x.trim().toLowerCase().replace(/["<>]/g, ''));
    const fi = (...k) => head.findIndex((h) => k.some((q) => h === q || h.indexOf(q) === 0));
    const ic = { d: fi('date'), t: fi('time', 'datetime', 'timestamp', 'gmt'), o: fi('open'), h: fi('high'), l: fi('low'), c: fi('close') };
    if ([ic.o, ic.h, ic.l, ic.c].some((x) => x < 0) || (ic.d < 0 && ic.t < 0)) throw new Error('Không tìm thấy các cột time/open/high/low/close ở dòng đầu.');
    const num = (x) => parseFloat(String(x).replace(delim === ';' ? ',' : '', delim === ';' ? '.' : ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const p = lines[i].split(delim).map((x) => x.trim().replace(/"/g, '')); let ts;
      let raw = ic.d >= 0 && ic.t >= 0 && ic.d !== ic.t ? p[ic.d] + ' ' + p[ic.t] : p[ic.t >= 0 ? ic.t : ic.d];
      if (/^\d{9,13}(\.\d+)?$/.test(raw)) { const n = +raw; ts = n < 1e11 ? n * 1000 : n; }
      else { raw = raw.replace(/\./g, (m, o2, str) => (/^\d{4}\.\d{2}\.\d{2}/.test(str) && o2 < 10 ? '-' : m)).replace(' ', 'T'); ts = /([zZ]|[+-]\d{2}:?\d{2})$/.test(raw) ? Date.parse(raw) : Date.parse(raw + 'Z') - off * 3600000; }
      const r = { t: ts, o: num(p[ic.o]), h: num(p[ic.h]), l: num(p[ic.l]), c: num(p[ic.c]) };
      if (isFinite(r.t + r.o + r.h + r.l + r.c)) rows.push(r);
    }
    return rows;
  }
  function bindRaw() {
    const go = $('#rgo'); if (!go) return;
    go.onclick = async () => {
      const ms = $('#rms'); ms.textContent = '';
      try {
        const f = $('#rf').files[0]; let txt = $('#rt').value; if (f) txt = await f.text(); if (!txt.trim()) throw new Error('Hãy chọn file hoặc dán dữ liệu.');
        const rows = parseCSV(txt, +$('#ro').value || 0); const S = ICT.defRaw('mydata', rows, { title: $('#rn').value || 'Dữ liệu thật', sym: 'XAUUSD' });
        store.set('raw', { rows: rows.slice(-600), title: $('#rn').value }); location.hash = 'rp-mydata'; if (location.hash === '#rp-mydata') route(); ms.textContent = 'Đã nạp ' + S.n + ' nến.';
      } catch (e) { ms.textContent = 'Lỗi: ' + e.message; ms.style.color = 'var(--bear)'; }
    };
    const del = $('#rdel'); if (del) del.onclick = () => { store.set('raw', null); delete ICT.scenarios.mydata; location.hash = 'replay'; route(); };
  }

  /* ---- Thi thử ---- */
  function exam() {
    const bank = []; L.forEach((l) => (l.quiz || []).forEach((z) => bank.push(Object.assign({ lid: l.id, m: l.m }, z))));
    const pick = bank.slice().sort(() => Math.random() - 0.5).slice(0, 20);
    view.innerHTML = '<div class="page"><div class="crumb">Luyện thi</div><h1>Thi thử tổng hợp</h1><p class="lead">20 câu ngẫu nhiên từ ' + bank.length + ' câu hỏi của toàn bộ giáo trình. Mục tiêu: ≥ 70%.</p><div class="quiz" style="margin-top:10px"><div id="ex"></div></div><div class="btns" style="margin-top:18px"><button type="button" class="btn pri" id="exAgain">Làm đề khác</button></div></div>';
    ICT.renderQuiz($('#ex'), pick, { onDone(ok, t) { const h = store.get('exam', []); h.push({ ok, t, ts: Date.now() }); store.set('exam', h.slice(-20)); } });
    if (ICT.annotate) ICT.annotate($('.page', view));
    $('#exAgain').onclick = () => route();
  }

  /* ---- Tiến độ ---- */
  function progress() {
    const d = done(), q = qbest(), n = L.filter((l) => d[l.id]).length, ex = store.get('exam', []), jr = store.get('journal', []);
    view.innerHTML = '<div class="page"><div class="crumb">Tiến độ</div><h1>Tiến độ học của bạn</h1><p class="lead">Dữ liệu lưu trong trình duyệt này; muốn dùng chung giữa các thiết bị, hãy bật <a href="#sync">Đồng bộ thiết bị</a> (lưu vào repo GitHub riêng tư của bạn).</p><div class="stats"><div class="stat"><b>' + n + '/' + L.length + '</b><span>bài đã học</span></div><div class="stat"><b>' + Object.keys(q).length + '</b><span>bài đã làm quiz</span></div><div class="stat"><b>' + (ex.length ? ex[ex.length - 1].ok + '/' + ex[ex.length - 1].t : '—') + '</b><span>đề thi gần nhất</span></div><div class="stat"><b>' + jr.length + '</b><span>lệnh trong nhật ký</span></div></div><div class="bar"><i style="width:' + Math.round((n / L.length) * 100) + '%"></i></div>' +
      M.map((m) => '<h3>' + esc(m.title) + '</h3><div class="tblw"><table><tr><th>Bài</th><th>Đã học</th><th>Quiz tốt nhất</th></tr>' + L.filter((l) => l.m === m.n).map((l) => '<tr><td><a href="#' + l.id + '">' + esc(l.title) + '</a></td><td>' + (d[l.id] ? '<span class="up">✔</span>' : '—') + '</td><td>' + (q[l.id] != null ? q[l.id] + '%' : '—') + '</td></tr>').join('') + '</table></div>').join('') +
      '<h3>Đặt lại</h3><p class="muted">Xóa tiến độ học và kết quả quiz (không xóa nhật ký giao dịch).</p><button type="button" class="btn" id="rs1">Đặt lại tiến độ…</button><span id="rs2" hidden> Chắc chắn? <button type="button" class="btn sm" id="rs3">Xóa tiến độ</button></span></div>';
    $('#rs1').onclick = () => { $('#rs2').hidden = false; }; $('#rs3').onclick = () => { store.set('done', {}); store.set('qbest', {}); store.set('exam', []); buildSide(); route(); };
  }

  /* ---- Tìm kiếm ---- */
  const idx = L.map((l) => ({ id: l.id, t: l.title, s: (l.title + ' ' + strip(l.html) + ' ' + (l.keys || '')).toLowerCase(), m: l.m }));
  const norm = (s) => s.toLowerCase();
  const sIn = $('#q'), sRes = $('#sres');
  sIn.addEventListener('input', () => {
    const k = norm(sIn.value.trim()); if (k.length < 2) { sRes.hidden = true; return; }
    const hits = idx.filter((x) => x.s.indexOf(k) >= 0).slice(0, 7), gl = ICT.glossary.filter((g) => (g[0] + ' ' + g[1] + ' ' + g[3]).toLowerCase().indexOf(k) >= 0).slice(0, 4);
    sRes.innerHTML = hits.map((h) => '<a href="#' + h.id + '">' + esc(h.t) + '<small>Module ' + h.m + '</small></a>').join('') + gl.map((g) => '<a href="#glossary" data-g="' + esc(g[0]) + '">' + esc(g[0]) + '<small>Từ điển · ' + esc(g[3].slice(0, 70)) + '…</small></a>').join('') || '<a>Không tìm thấy.</a>';
    sRes.hidden = false;
  });
  sRes.addEventListener('click', (e) => { const a = e.target.closest('a[data-g]'); if (a) store.set('gq', a.dataset.g); sRes.hidden = true; sIn.value = ''; });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) sRes.hidden = true; });

  /* ---- Khởi động ---- */
  $('#menuBtn').onclick = () => document.body.classList.toggle('nav');
  $('.scrim').onclick = () => document.body.classList.remove('nav');
  side.addEventListener('click', (e) => { if (e.target.closest('a.nv')) document.body.classList.remove('nav'); });
  $('#themeBtn').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'), nx = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nx); store.set('theme', nx);
  };
  const th = store.get('theme', null); if (th) document.documentElement.setAttribute('data-theme', th);
  const applyRaw = () => { try { const rw = store.get('raw', null); if (rw && rw.rows) ICT.defRaw('mydata', rw.rows, { title: rw.title || 'Dữ liệu thật', sym: 'XAUUSD' }); } catch (e) { store.set('raw', null); } };
  applyRaw();
  /* sau khi đồng bộ kéo dữ liệu mới về: làm mới thanh bên và các trang đang hiển thị dữ liệu (tránh ghi đè bằng bản cũ) */
  ICT.afterSync = () => { applyRaw(); buildSide(); const r = (location.hash || '#home').slice(1) || 'home'; if (['home', 'progress', 'curriculum', 'tools'].indexOf(r) >= 0 || r.indexOf('t-') === 0) route(); markSide(r); };
  buildSide(); window.addEventListener('hashchange', route); route(); if (ICT.sync) ICT.sync.init();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
