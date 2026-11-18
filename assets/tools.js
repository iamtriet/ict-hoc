/* ICT Hub — công cụ: killzone (giờ VN), khối lượng, expectancy, Monte Carlo, Fibonacci/OTE, SD, nhật ký, checklist, kế hoạch */
(function () {
  'use strict';
  const ICT = window.ICT, esc = ICT.esc, pad = ICT.pad;
  const T = (ICT.tools = { items: {} });
  const $ = (s, r) => (r || document).querySelector(s);
  const num = (el) => parseFloat(String(el.value).replace(',', '.')) || 0;
  const f2 = (x, d) => (isFinite(x) ? x.toFixed(d == null ? 2 : d) : '—');

  /* ---------- Múi giờ ---------- */
  function tzOff(date, tz) {
    const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date).forEach((x) => (p[x.type] = x.value));
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  }
  function nyToUtc(y, mo, d, h, mi) {
    const g = Date.UTC(y, mo, d, h, mi); let off = tzOff(new Date(g), 'America/New_York'), u = g - off * 60000;
    const off2 = tzOff(new Date(u), 'America/New_York'); if (off2 !== off) u = g - off2 * 60000; return u;
  }
  function vnFmt(utc, y, mo, d) {
    const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(utc)).forEach((x) => (p[x.type] = x.value));
    const dd = Math.round((Date.UTC(+p.year, +p.month - 1, +p.day) - Date.UTC(y, mo, d)) / 86400000);
    return p.hour + ':' + p.minute + (dd ? ' (' + (dd > 0 ? '+' : '') + dd + 'd)' : '');
  }
  ICT.tz = { tzOff, nyToUtc };
  const KZS = [
    ['Asian Killzone', '20:00', '00:00', 'Tích lũy, hình thành Asian Range', 20 * 60, 24 * 60],
    ['London Killzone', '02:00', '05:00', 'London mở cửa, hay có Judas Swing và đỉnh/đáy ngày', 120, 300],
    ['New York Killzone', '07:00', '10:00', 'Tin tức 8:30, mở cửa chứng khoán 9:30 — biến động lớn', 420, 600],
    ['London Close Killzone', '10:00', '12:00', 'Hồi/đảo chiều khi London đóng cửa', 600, 720],
    ['NY PM Killzone', '13:30', '16:00', 'Phiên chiều NY, thường tiếp diễn hoặc hồi', 810, 960],
    ['Silver Bullet — London', '03:00', '04:00', 'Cửa sổ Silver Bullet 1', 180, 240],
    ['Silver Bullet — NY AM', '10:00', '11:00', 'Cửa sổ Silver Bullet 2 (phổ biến nhất)', 600, 660],
    ['Silver Bullet — NY PM', '14:00', '15:00', 'Cửa sổ Silver Bullet 3', 840, 900],
    ['CBDR', '14:00', '20:00', 'Central Bank Dealers Range', 840, 1200],
  ];
  const KEY = [['Midnight Open (True Day Open)', '00:00'], ['Tin tức NY (8:30)', '08:30'], ['Mở cửa chứng khoán Mỹ', '09:30'], ['Đóng cửa FX NY / Open ngày mới (17:00)', '17:00']];

  T.items.killzone = { title: 'Killzone theo giờ Việt Nam', desc: 'Đồng hồ trực tiếp New York/Việt Nam, killzone hiện tại và bảng đổi giờ tự xử lý giờ mùa hè.', render(el) {
    const now = new Date(), iso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    el.innerHTML = '<div class="clocks"><div class="clock"><span>New York <i id="nyz"></i></span><b id="cNY">--:--</b></div><div class="clock"><span>Việt Nam (UTC+7)</span><b id="cVN">--:--</b></div><div class="clock"><span>London</span><b id="cLD">--:--</b></div><div class="clock"><span>Killzone hiện tại</span><b id="cKZ" style="font-size:16px;font-family:var(--ui)">—</b><span id="cNX"></span></div></div>' +
      '<div class="tool"><div class="frm"><div class="fld"><label for="kd">Đổi giờ cho ngày</label><input id="kd" type="date" value="' + iso + '"></div></div><div id="kzt"></div><p class="muted" style="margin:10px 0 0;font-size:13px">"(+1d)" nghĩa là sang ngày hôm sau theo giờ Việt Nam. Giờ mùa hè Mỹ thường bắt đầu Chủ nhật thứ hai của tháng 3 và kết thúc Chủ nhật đầu tiên của tháng 11; vì vậy cùng một killzone có thể lệch 1 giờ giữa mùa đông và mùa hè.</p></div>';
    function table() {
      const [y, m, d] = $('#kd', el).value.split('-').map(Number); if (!y) return;
      const off = tzOff(new Date(nyToUtc(y, m - 1, d, 12, 0)), 'America/New_York') / 60;
      let h = '<p style="margin:0 0 8px"><b>New York ngày này: UTC' + (off >= 0 ? '+' : '') + off + '</b> (' + (off === -4 ? 'giờ mùa hè EDT, chênh VN 11 giờ' : 'giờ mùa đông EST, chênh VN 12 giờ') + ')</p>';
      KZS.forEach((k) => { const a = k[1].split(':').map(Number), b = k[2].split(':').map(Number); h += '<div class="kzrow"><div><b>' + k[0] + '</b><small>' + k[3] + '</small></div><div class="t">NY ' + k[1] + '–' + k[2] + '</div><div class="t up">VN ' + vnFmt(nyToUtc(y, m - 1, d, a[0], a[1]), y, m - 1, d) + ' → ' + vnFmt(nyToUtc(y, m - 1, d, b[0] === 0 ? 24 : b[0], b[1]), y, m - 1, d) + '</div></div>'; });
      h += '<h4 style="margin:16px 0 4px">Mốc giờ quan trọng</h4>'; KEY.forEach((k) => { const a = k[1].split(':').map(Number); h += '<div class="kzrow"><div><b>' + k[0] + '</b></div><div class="t">NY ' + k[1] + '</div><div class="t up">VN ' + vnFmt(nyToUtc(y, m - 1, d, a[0], a[1]), y, m - 1, d) + '</div></div>'; });
      $('#kzt', el).innerHTML = h;
    }
    $('#kd', el).addEventListener('input', table); table();
    function tick() {
      const n = new Date(), fm = (tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(n);
      $('#cNY', el).textContent = fm('America/New_York'); $('#cVN', el).textContent = fm('Asia/Ho_Chi_Minh'); $('#cLD', el).textContent = fm('Europe/London');
      const off = tzOff(n, 'America/New_York') / 60; $('#nyz', el).textContent = off === -4 ? '(EDT)' : '(EST)';
      const [h, mi] = $('#cNY', el).textContent.split(':').map(Number), mn = h * 60 + mi;
      const act = KZS.slice(0, 5).filter((k) => mn >= k[4] && mn < k[5]), sb = KZS.slice(5, 8).filter((k) => mn >= k[4] && mn < k[5]);
      $('#cKZ', el).textContent = (act.map((k) => k[0].replace(' Killzone', '')).join(' + ') || 'Ngoài killzone') + (sb.length ? ' · SILVER BULLET' : '');
      const nx = KZS.slice(0, 5).map((k) => [k, ((k[4] - mn) + 1440) % 1440]).sort((a, b) => a[1] - b[1])[0];
      $('#cNX', el).textContent = act.length ? '' : 'Kế tiếp: ' + nx[0][0].replace(' Killzone', '') + ' sau ' + Math.floor(nx[1] / 60) + 'g ' + (nx[1] % 60) + 'p';
    }
    tick(); const id = setInterval(tick, 1000); ICT.live.push(() => clearInterval(id));
  } };

  /* ---------- Position size ---------- */
  T.items.risk = { title: 'Tính khối lượng lệnh', desc: 'Từ vốn, % rủi ro và khoảng cách SL ra số lot/hợp đồng, kèm các mốc TP theo R.', render(el) {
    const presets = { 'XAUUSD — 100$ mỗi 1$ giá/lot': 100, 'Forex — 10$/pip/lot': 10, 'NQ — 20$/điểm/hợp đồng': 20, 'MNQ — 2$/điểm': 2, 'ES — 50$/điểm': 50, 'MES — 5$/điểm': 5, 'Tùy chỉnh': 100 };
    el.innerHTML = '<div class="tool"><div class="frm"><div class="fld"><label for="rb">Vốn (USD)</label><input id="rb" value="10000" inputmode="decimal"></div><div class="fld"><label for="rp">Rủi ro mỗi lệnh (%)</label><input id="rp" value="1" inputmode="decimal"></div><div class="fld"><label for="rs">Khoảng cách SL (USD giá với vàng; pip/điểm với sản phẩm khác)</label><input id="rs" value="5" inputmode="decimal"></div><div class="fld"><label for="ri">Sản phẩm</label><select id="ri">' + Object.keys(presets).map((k) => '<option>' + k + '</option>').join('') + '</select></div><div class="fld"><label for="rv">Giá trị mỗi 1 đơn vị SL cho 1 lot (USD)</label><input id="rv" value="100" inputmode="decimal"></div></div><div class="res" id="rr"></div><p class="muted" style="font-size:13px;margin:10px 0 0">Với vàng, 1 lot thường là 100 ounce (mỗi $1 = $100/lot) nhưng hợp đồng khác nhau tùy sàn; hãy kiểm tra trên nền tảng của bạn. Công thức: <code>Khối lượng = (Vốn × %rủi ro) ÷ (SL × giá trị 1 pip/lot)</code>.</p></div>';
    const sel = $('#ri', el); sel.onchange = () => { $('#rv', el).value = presets[sel.value]; calc(); };
    function calc() {
      const b = num($('#rb', el)), p = num($('#rp', el)), s = num($('#rs', el)), v = num($('#rv', el)), risk = (b * p) / 100, lot = s && v ? risk / (s * v) : 0;
      $('#rr', el).innerHTML = '<div><small>Số tiền rủi ro (1R)</small><b>$' + f2(risk) + '</b></div><div><small>Khối lượng</small><b>' + f2(lot, 2) + '</b></div><div><small>TP 1R / 2R</small><b>' + f2(s) + ' / ' + f2(s * 2) + '</b></div><div><small>TP 3R / 4R</small><b>' + f2(s * 3) + ' / ' + f2(s * 4) + '</b></div><div><small>Lãi nếu đạt 2R</small><b class="up">$' + f2(risk * 2) + '</b></div><div><small>Mất nếu 5 lệnh thua liên tiếp</small><b class="dn">$' + f2(risk * 5) + '</b></div>';
    }
    el.addEventListener('input', calc); calc();
  } };

  /* ---------- Expectancy ---------- */
  T.items.expect = { title: 'Kỳ vọng (Expectancy) & Win rate hòa vốn', desc: 'Với win rate và RR của bạn, hệ thống có lãi kỳ vọng bao nhiêu R mỗi lệnh?', render(el) {
    el.innerHTML = '<div class="tool"><div class="frm"><div class="fld"><label for="ew">Win rate (%)</label><input id="ew" value="40" inputmode="decimal"></div><div class="fld"><label for="er">RR trung bình khi thắng (R)</label><input id="er" value="2.5" inputmode="decimal"></div><div class="fld"><label for="en">Số lệnh/tháng</label><input id="en" value="20" inputmode="decimal"></div></div><div class="res" id="eo"></div></div><h3>Bảng kỳ vọng (R mỗi lệnh)</h3><div class="tblw"><table id="et"></table></div><p class="muted" style="font-size:13px">Ô xanh: kỳ vọng dương. Công thức: <code>E = W × RR − (1 − W)</code>. Chỉ đúng nếu win rate và RR <b>thật sự</b> đo được trên mẫu đủ lớn (≥ 100 lệnh).</p>';
    function calc() {
      const w = num($('#ew', el)) / 100, r = num($('#er', el)), n = num($('#en', el)), e = w * r - (1 - w), be = 1 / (1 + r);
      $('#eo', el).innerHTML = '<div><small>Kỳ vọng / lệnh</small><b class="' + (e >= 0 ? 'up' : 'dn') + '">' + f2(e, 3) + 'R</b></div><div><small>Win rate hòa vốn</small><b>' + f2(be * 100, 1) + '%</b></div><div><small>Kỳ vọng / tháng</small><b class="' + (e >= 0 ? 'up' : 'dn') + '">' + f2(e * n, 1) + 'R</b></div><div><small>Chuỗi thua 5 lệnh (xác suất mỗi chuỗi)</small><b>' + f2(Math.pow(1 - w, 5) * 100, 1) + '%</b></div>';
      const ws = [25, 30, 35, 40, 45, 50, 55, 60], rs = [1, 1.5, 2, 3, 4];
      $('#et', el).innerHTML = '<tr><th>Win rate \\ RR</th>' + rs.map((x) => '<th>1:' + x + '</th>').join('') + '</tr>' + ws.map((x) => '<tr><td><b>' + x + '%</b></td>' + rs.map((y) => { const v = (x / 100) * y - (1 - x / 100); return '<td style="color:var(--' + (v >= 0 ? 'bull' : 'bear') + ');font-family:var(--mono)">' + (v >= 0 ? '+' : '') + f2(v, 2) + '</td>'; }).join('') + '</tr>').join('');
    }
    el.addEventListener('input', calc); calc();
  } };

  /* ---------- Monte Carlo ---------- */
  T.items.montecarlo = { title: 'Mô phỏng chuỗi lệnh (Monte Carlo)', desc: 'Xem cùng một hệ thống có lãi kỳ vọng dương vẫn có thể gặp drawdown sâu thế nào.', render(el) {
    el.innerHTML = '<div class="tool"><div class="frm"><div class="fld"><label for="mw">Win rate (%)</label><input id="mw" value="40"></div><div class="fld"><label for="mr">RR khi thắng</label><input id="mr" value="2.5"></div><div class="fld"><label for="mk">Rủi ro mỗi lệnh (%)</label><input id="mk" value="1"></div><div class="fld"><label for="mn">Số lệnh</label><input id="mn" value="100"></div></div><button type="button" class="btn pri" id="mgo">Chạy lại mô phỏng</button><svg class="eqc" id="msv" viewBox="0 0 720 300" role="img" aria-label="Các đường vốn mô phỏng"></svg><div class="res" id="mo"></div></div><p class="muted" style="font-size:13px">Mỗi đường là một chuỗi {N} lệnh ngẫu nhiên với cùng win rate và RR. Vốn gộp theo rủi ro % mỗi lệnh. Đây là mô hình đơn giản (độc lập, RR cố định).</p>';
    function run() {
      const w = num($('#mw', el)) / 100, r = num($('#mr', el)), k = num($('#mk', el)) / 100, n = Math.max(10, Math.min(500, Math.round(num($('#mn', el))))), S = 40, paths = [];
      let fin = [], dds = [];
      for (let s = 0; s < S; s++) { let eq = 1, peak = 1, dd = 0; const p = [1]; for (let i = 0; i < n; i++) { eq *= 1 + (Math.random() < w ? r * k : -k); p.push(eq); peak = Math.max(peak, eq); dd = Math.max(dd, 1 - eq / peak); } paths.push(p); fin.push(eq); dds.push(dd); }
      let mx = 0, mn = 1e9; paths.forEach((p) => p.forEach((v) => { mx = Math.max(mx, v); mn = Math.min(mn, v); })); mx = Math.max(mx, 1.05); mn = Math.min(mn, 0.95);
      const X = (i) => 30 + (i / n) * 670, Y = (v) => 280 - ((Math.log(v) - Math.log(mn)) / (Math.log(mx) - Math.log(mn))) * 260;
      let g = '<line x1="30" x2="700" y1="' + Y(1) + '" y2="' + Y(1) + '" stroke="var(--mute)" stroke-dasharray="4 3"/><text x="34" y="' + (Y(1) - 4) + '" fill="var(--faint)" font-size="11">Vốn ban đầu</text>';
      paths.forEach((p) => { g += '<polyline class="l ' + (p[n] >= 1 ? 'upl' : 'dnl') + '" points="' + p.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '"/>'; });
      g += '<text x="30" y="296" fill="var(--faint)" font-size="11">Lệnh 0</text><text x="700" y="296" text-anchor="end" fill="var(--faint)" font-size="11">Lệnh ' + n + '</text><text x="700" y="14" text-anchor="end" fill="var(--faint)" font-size="11">thang log</text>';
      $('#msv', el).innerHTML = g;
      fin.sort((a, b) => a - b); dds.sort((a, b) => a - b); const med = (a) => a[Math.floor(a.length / 2)];
      $('#mo', el).innerHTML = '<div><small>Vốn cuối (trung vị)</small><b>' + f2(med(fin), 2) + '×</b></div><div><small>Vốn cuối thấp nhất</small><b class="dn">' + f2(fin[0], 2) + '×</b></div><div><small>Drawdown tối đa (trung vị)</small><b>' + f2(med(dds) * 100, 1) + '%</b></div><div><small>Drawdown tệ nhất</small><b class="dn">' + f2(dds[dds.length - 1] * 100, 1) + '%</b></div><div><small>Số đường kết thúc có lãi</small><b>' + fin.filter((v) => v > 1).length + '/' + S + '</b></div>';
    }
    $('#mgo', el).onclick = run; el.addEventListener('change', run); run();
  } };

  /* ---------- Khoảng tin cậy expectancy ---------- */
  T.items.ci = { title: 'Khoảng tin cậy của Expectancy', desc: 'Với n lệnh, R trung bình và độ lệch chuẩn, kết quả của bạn có thật sự khác 0 không? Tính cả số lệnh cần có.', render(el) {
    el.innerHTML = '<div class="tool"><div class="frm"><div class="fld"><label for="cn">Số lệnh (n)</label><input id="cn" value="100" inputmode="decimal"></div><div class="fld"><label for="cm">R trung bình mỗi lệnh</label><input id="cm" value="0.3" inputmode="decimal"></div><div class="fld"><label for="cs">Độ lệch chuẩn của R</label><input id="cs" value="1.6" inputmode="decimal"></div></div><div class="btns" style="margin-bottom:10px"><button type="button" class="btn sm" id="cj">Lấy số liệu từ nhật ký của tôi</button><span class="muted" id="cjm" style="font-size:13px"></span></div><div class="res" id="co"></div></div><p class="muted" style="font-size:13px">Sai số chuẩn SE = σ ÷ √n. Khoảng tin cậy 95% ≈ trung bình ± 1,96 × SE. Nếu khoảng này chứa 0, bạn chưa thể phân biệt hệ thống với may rủi. Mô hình xấp xỉ chuẩn, giả định các lệnh độc lập.</p>';
    function calc() {
      const n = num($('#cn', el)), m = num($('#cm', el)), s = num($('#cs', el)); if (n < 2 || s <= 0) { $('#co', el).innerHTML = '<div><small>Nhập n ≥ 2 và σ &gt; 0</small><b>—</b></div>'; return; }
      const se = s / Math.sqrt(n), lo = m - 1.96 * se, hi = m + 1.96 * se, need = m !== 0 ? Math.ceil(Math.pow((1.96 * s) / m, 2)) : Infinity;
      $('#co', el).innerHTML = '<div><small>Sai số chuẩn (SE)</small><b>' + f2(se, 3) + 'R</b></div><div><small>Khoảng tin cậy 95%</small><b class="' + (lo > 0 ? 'up' : hi < 0 ? 'dn' : '') + '" style="font-size:16px">' + f2(lo, 2) + ' → ' + f2(hi, 2) + 'R</b></div><div><small>Kết luận</small><b style="font-size:14px;font-family:var(--ui)">' + (lo > 0 ? '<span class="up">Kỳ vọng dương có ý nghĩa</span>' : hi < 0 ? '<span class="dn">Kỳ vọng âm có ý nghĩa</span>' : 'Chưa phân biệt được với 0') + '</b></div><div><small>Số lệnh cần để loại trừ 0</small><b>' + (isFinite(need) ? need : '—') + '</b></div>';
    }
    $('#cj', el).onclick = () => { const J = ICT.store.get('journal', []).map((x) => x.r); if (J.length < 3) { $('#cjm', el).textContent = 'Nhật ký cần ít nhất 3 lệnh.'; return; } const mu = J.reduce((a, x) => a + x, 0) / J.length, sd = Math.sqrt(J.reduce((a, x) => a + Math.pow(x - mu, 2), 0) / (J.length - 1)); $('#cn', el).value = J.length; $('#cm', el).value = mu.toFixed(3); $('#cs', el).value = sd.toFixed(3); $('#cjm', el).textContent = 'Đã lấy ' + J.length + ' lệnh.'; calc(); };
    el.addEventListener('input', calc); calc();
  } };

  /* ---------- Fibonacci / OTE ---------- */
  T.items.fib = { title: 'Máy tính Fibonacci & OTE', desc: 'Nhập swing low/high để ra các mức 50%, 62%, 70,5%, 79% và vùng OTE.', render(el) {
    el.innerHTML = '<div class="tool"><div class="frm"><div class="fld"><label for="fl">Swing Low</label><input id="fl" value="4000.00" inputmode="decimal"></div><div class="fld"><label for="fh">Swing High</label><input id="fh" value="4040.00" inputmode="decimal"></div><div class="fld"><label for="fd">Nhịp displacement</label><select id="fd"><option value="up">Tăng (chờ hồi xuống để mua)</option><option value="dn">Giảm (chờ hồi lên để bán)</option></select></div></div><div class="tblw"><table id="ft"></table></div></div>';
    function calc() {
      const lo = num($('#fl', el)), hi = num($('#fh', el)), up = $('#fd', el).value === 'up', R = hi - lo, dec = (String($('#fl', el).value).split(/[.,]/)[1] || '').length || 4;
      const lv = [[0, 'Đỉnh/đáy nhịp'], [0.5, 'Equilibrium'], [0.62, 'OTE — biên trên'], [0.705, 'OTE — điểm ngọt'], [0.79, 'OTE — biên dưới'], [1, 'Gốc nhịp']];
      let h = '<tr><th>Mức</th><th>Giá</th><th>Ghi chú</th></tr>';
      lv.forEach((l) => { const p = up ? hi - R * l[0] : lo + R * l[0]; h += '<tr' + (l[0] >= 0.62 && l[0] <= 0.79 ? ' style="background:var(--tint)"' : '') + '><td>' + (l[0] * 100).toFixed(l[0] === 0.705 ? 1 : 0) + '%</td><td style="font-family:var(--mono)">' + p.toFixed(dec) + '</td><td>' + l[1] + '</td></tr>'; });
      $('#ft', el).innerHTML = R > 0 ? h : '<tr><td>Swing High phải lớn hơn Swing Low.</td></tr>';
    }
    el.addEventListener('input', calc); calc();
  } };

  /* ---------- SD projection ---------- */
  T.items.sd = { title: 'Chiếu mục tiêu theo độ lệch chuẩn (SD)', desc: 'Từ Asian Range hoặc CBDR, chiếu các mức −1, −2, −2,5, −4 SD làm mục tiêu tham khảo.', render(el) {
    el.innerHTML = '<div class="tool"><div class="frm"><div class="fld"><label for="sl">Đáy range</label><input id="sl" value="4010.00" inputmode="decimal"></div><div class="fld"><label for="sh">Đỉnh range</label><input id="sh" value="4022.00" inputmode="decimal"></div></div><div class="tblw"><table id="st"></table></div></div><p class="muted" style="font-size:13px">1 SD = độ rộng range. Chiếu <b>lên</b> từ đỉnh (khi bias tăng) hoặc <b>xuống</b> từ đáy (khi bias giảm). Đây là công cụ ước lượng mục tiêu, không phải điểm vào lệnh.</p>';
    function calc() {
      const lo = num($('#sl', el)), hi = num($('#sh', el)), R = hi - lo, dec = (String($('#sl', el).value).split(/[.,]/)[1] || '').length || 4; if (R <= 0) { $('#st', el).innerHTML = '<tr><td>Đỉnh phải lớn hơn đáy.</td></tr>'; return; }
      $('#st', el).innerHTML = '<tr><th>SD</th><th>Mục tiêu tăng (từ đỉnh)</th><th>Mục tiêu giảm (từ đáy)</th></tr>' + [1, 2, 2.5, 3, 4].map((k) => '<tr><td>' + k + ' SD</td><td style="font-family:var(--mono)" class="up">' + (hi + R * k).toFixed(dec) + '</td><td style="font-family:var(--mono)" class="dn">' + (lo - R * k).toFixed(dec) + '</td></tr>').join('');
    }
    el.addEventListener('input', calc); calc();
  } };

  /* ---------- Nhật ký ---------- */
  const MODELS = ['ICT 2022', 'Silver Bullet', 'Unicorn', 'Judas / London raid', 'OB + FVG / OTE', 'Turtle Soup', 'MMXM', 'Khác'];
  T.items.journal = { title: 'Nhật ký giao dịch', desc: 'Ghi lệnh, tự động tính win rate, expectancy, profit factor, drawdown và đường vốn theo R.', render(el) {
    const S = ICT.store; let J = S.get('journal', []);
    const today = new Date(); const iso = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
    el.innerHTML = '<div class="tool"><div class="frm"><div class="fld"><label for="jd">Ngày</label><input id="jd" type="date" value="' + iso + '"></div><div class="fld"><label for="js">Cặp/Chỉ số</label><input id="js" value="XAUUSD"></div><div class="fld"><label for="jm">Mô hình</label><select id="jm">' + MODELS.map((m) => '<option>' + m + '</option>').join('') + '</select></div><div class="fld"><label for="jx">Hướng</label><select id="jx"><option>Mua</option><option>Bán</option></select></div><div class="fld"><label for="jr">Kết quả (R, âm nếu thua)</label><input id="jr" value="2" inputmode="decimal"></div><div class="fld"><label for="je">Cảm xúc</label><select id="je"><option>Bình tĩnh</option><option>Hào hứng/FOMO</option><option>Sợ hãi</option><option>Tức giận/gỡ lỗ</option><option>Chán</option></select></div><div class="fld"><label for="jp">Đúng kế hoạch?</label><select id="jp"><option>Có</option><option>Không</option></select></div></div><div class="fld"><label for="jn">Ghi chú (lý do vào lệnh, bài học)</label><textarea id="jn"></textarea></div><div class="btns" style="margin-top:12px"><button type="button" class="btn pri" id="jadd">Thêm lệnh</button><button type="button" class="btn" id="jex">Xuất dữ liệu (JSON)</button><button type="button" class="btn" id="jim">Nhập dữ liệu…</button></div><div id="jio" hidden style="margin-top:10px"><textarea id="jta" style="width:100%;min-height:90px;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px;font:12px var(--mono)" aria-label="Dữ liệu JSON"></textarea><div class="btns" style="margin-top:8px"><button type="button" class="btn sm" id="jok">Áp dụng dữ liệu nhập</button><span class="muted" id="jms" style="font-size:13px"></span></div></div></div><div id="jst"></div><div id="jls"></div>';
    function stats() {
      const n = J.length; if (!n) { $('#jst', el).innerHTML = '<div class="tool muted">Chưa có lệnh nào. Thêm lệnh đầu tiên ở trên — số liệu sẽ tự cập nhật.</div>'; $('#jls', el).innerHTML = ''; return; }
      const w = J.filter((x) => x.r > 0), l = J.filter((x) => x.r < 0), tot = J.reduce((a, x) => a + x.r, 0), gw = w.reduce((a, x) => a + x.r, 0), gl = Math.abs(l.reduce((a, x) => a + x.r, 0));
      let eq = 0, peak = 0, dd = 0; const pts = [0]; J.forEach((x) => { eq += x.r; pts.push(eq); peak = Math.max(peak, eq); dd = Math.max(dd, peak - eq); });
      const mx = Math.max.apply(null, pts.concat([1])), mn = Math.min.apply(null, pts.concat([-1])), X = (i) => 20 + (i / Math.max(1, n)) * 680, Y = (v) => 150 - ((v - mn) / (mx - mn)) * 130;
      const byM = {}; J.forEach((x) => { (byM[x.m] = byM[x.m] || []).push(x.r); });
      const plan = J.filter((x) => x.p === 'Có'), off = J.filter((x) => x.p === 'Không');
      const avg = (a) => (a.length ? a.reduce((s, x) => s + x.r, 0) / a.length : 0);
      $('#jst', el).innerHTML = '<div class="res"><div><small>Số lệnh</small><b>' + n + '</b></div><div><small>Win rate</small><b>' + f2((w.length / n) * 100, 0) + '%</b></div><div><small>Tổng R</small><b class="' + (tot >= 0 ? 'up' : 'dn') + '">' + (tot >= 0 ? '+' : '') + f2(tot) + '</b></div><div><small>Expectancy</small><b class="' + (tot >= 0 ? 'up' : 'dn') + '">' + f2(tot / n, 2) + 'R</b></div><div><small>Profit factor</small><b>' + (gl ? f2(gw / gl) : '∞') + '</b></div><div><small>Max drawdown</small><b class="dn">' + f2(dd) + 'R</b></div></div>' +
        '<svg class="eqc" viewBox="0 0 720 170" role="img" aria-label="Đường vốn theo R"><line x1="20" x2="700" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="var(--mute)" stroke-dasharray="4 3"/><polyline fill="none" stroke="var(--accent)" stroke-width="2" points="' + pts.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ') + '"/><text x="20" y="165" fill="var(--faint)" font-size="11">Đường vốn (R tích lũy)</text></svg>' +
        '<div class="tblw"><table><tr><th>Mô hình</th><th>Số lệnh</th><th>Win%</th><th>Expectancy</th></tr>' + Object.keys(byM).map((k) => '<tr><td>' + esc(k) + '</td><td>' + byM[k].length + '</td><td>' + f2((byM[k].filter((v) => v > 0).length / byM[k].length) * 100, 0) + '%</td><td>' + f2(byM[k].reduce((a, v) => a + v, 0) / byM[k].length, 2) + 'R</td></tr>').join('') + '</table></div><p class="muted" style="font-size:13px">Lệnh đúng kế hoạch: ' + plan.length + ' (TB ' + f2(avg(plan)) + 'R) · Lệnh sai kế hoạch: ' + off.length + ' (TB ' + f2(avg(off)) + 'R).</p>';
      $('#jls', el).innerHTML = '<div class="tblw"><table><tr><th>Ngày</th><th>Cặp</th><th>Mô hình</th><th>Hướng</th><th>R</th><th>Cảm xúc</th><th>Kế hoạch</th><th>Ghi chú</th><th></th></tr>' + J.slice().reverse().map((x, i) => '<tr><td>' + x.d + '</td><td>' + esc(x.s) + '</td><td>' + esc(x.m) + '</td><td>' + x.x + '</td><td class="' + (x.r >= 0 ? 'up' : 'dn') + '"><b>' + (x.r >= 0 ? '+' : '') + x.r + '</b></td><td>' + esc(x.e) + '</td><td>' + x.p + '</td><td>' + esc(x.n || '') + '</td><td><button type="button" class="btn sm" data-del="' + (n - 1 - i) + '" aria-label="Xóa lệnh">✕</button></td></tr>').join('') + '</table></div>';
    }
    $('#jadd', el).onclick = () => { J.push({ d: $('#jd', el).value, s: $('#js', el).value || '—', m: $('#jm', el).value, x: $('#jx', el).value, r: num($('#jr', el)), e: $('#je', el).value, p: $('#jp', el).value, n: $('#jn', el).value }); S.set('journal', J); $('#jn', el).value = ''; stats(); };
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (b) { J.splice(+b.dataset.del, 1); S.set('journal', J); stats(); } });
    $('#jex', el).onclick = () => { const io = $('#jio', el); io.hidden = false; $('#jta', el).value = JSON.stringify(J); $('#jta', el).select(); try { navigator.clipboard.writeText($('#jta', el).value).then(() => ($('#jms', el).textContent = 'Đã sao chép vào clipboard.'), () => ($('#jms', el).textContent = 'Hãy copy thủ công từ ô trên.')); } catch (er) { $('#jms', el).textContent = 'Hãy copy thủ công từ ô trên.'; } };
    $('#jim', el).onclick = () => { $('#jio', el).hidden = false; $('#jta', el).value = ''; $('#jms', el).textContent = 'Dán JSON đã xuất rồi bấm Áp dụng.'; };
    $('#jok', el).onclick = () => { try { const a = JSON.parse($('#jta', el).value); if (!Array.isArray(a)) throw 0; J = a.filter((x) => typeof x.r === 'number'); S.set('journal', J); stats(); $('#jms', el).textContent = 'Đã nhập ' + J.length + ' lệnh.'; } catch (er) { $('#jms', el).textContent = 'Dữ liệu không hợp lệ.'; } };
    stats();
  } };

  /* ---------- Checklist & kế hoạch ---------- */
  const CHK = [
    ['Bias & bối cảnh', ['HTF (Ngày/4H) có cấu trúc và hướng bias rõ ràng', 'Biết Draw on Liquidity (mục tiêu) và thanh khoản gần nhất', 'Giá đang ở discount (mua) hoặc premium (bán) của dealing range', 'Không có tin lớn trong 15 phút tới (hoặc đã có kế hoạch)']],
    ['Thời gian', ['Đang trong killzone / cửa sổ Silver Bullet', 'Không phải giờ ăn trưa NY / thanh khoản mỏng']],
    ['Tín hiệu', ['Thanh khoản đã bị quét (EQH/EQL, PDH/PDL, Asian H/L…)', 'Có displacement + MSS đóng cửa vượt swing', 'Có vùng vào lệnh rõ (FVG/OB/Breaker/OTE) chưa bị lấp', 'Lý do vào lệnh viết được trong một câu']],
    ['Rủi ro', ['SL đặt ở điểm vô hiệu hóa kịch bản (không phải số tiền cảm thấy ổn)', 'RR tối thiểu theo kế hoạch (≥ 1:2)', 'Rủi ro ≤ mức quy định (ví dụ 1% vốn)', 'Chưa chạm giới hạn lỗ trong ngày/tuần']],
    ['Tâm lý', ['Không đang gỡ lỗ hay FOMO', 'Đã ngủ đủ, tập trung, không bị phân tâm']],
  ];
  T.items.checklist = { title: 'Checklist trước khi vào lệnh', desc: 'Danh sách kiểm tra 5 nhóm (bias, thời gian, tín hiệu, rủi ro, tâm lý). Tick đủ mới gọi là setup hợp lệ.', render(el) {
    const S = ICT.store; let st = S.get('chk', {}), k = 0, total = 0;
    let h = '<div class="tool"><div class="res"><div><small>Hoàn thành</small><b id="ck1">0%</b></div><div><small>Kết luận quy trình</small><b id="ck2" style="font-size:16px;font-family:var(--ui)">—</b></div></div>';
    CHK.forEach((g) => { h += '<h3 style="margin:18px 0 4px;font-size:16px">' + g[0] + '</h3>'; g[1].forEach((t) => { total++; h += '<label class="chk"><input type="checkbox" data-k="' + k + '"' + (st[k] ? ' checked' : '') + '><span>' + t + '</span></label>'; k++; }); });
    h += '<div class="btns" style="margin-top:14px"><button type="button" class="btn" id="ckr">Bỏ chọn tất cả</button></div></div><p class="muted" style="font-size:13px">Checklist đo <b>quy trình</b>, không dự đoán kết quả. Một setup đủ điều kiện vẫn có thể thua.</p>';
    el.innerHTML = h;
    function upd() { const n = el.querySelectorAll('input:checked').length, p = Math.round((n / total) * 100); $('#ck1', el).textContent = p + '%'; $('#ck2', el).innerHTML = p === 100 ? '<span class="up">Đủ điều kiện theo kế hoạch</span>' : p >= 70 ? '<span style="color:var(--warn)">Còn thiếu — cân nhắc đứng ngoài</span>' : '<span class="dn">Chưa phải setup</span>'; }
    el.addEventListener('change', (e) => { const c = e.target.closest('input[data-k]'); if (!c) return; st[c.dataset.k] = c.checked; S.set('chk', st); upd(); });
    $('#ckr', el).onclick = () => { st = {}; S.set('chk', st); [].forEach.call(el.querySelectorAll('input'), (c) => (c.checked = false)); upd(); }; upd();
  } };
  const PLAN = [['Mô hình giao dịch chính', 'Ví dụ: ICT 2022 Model trong NY Killzone, chỉ giao dịch XAUUSD (vàng).'], ['Khung thời gian', 'Bias: Ngày/4H · POI: 1H/15m · Entry: 5m/1m.'], ['Giờ giao dịch (theo giờ VN)', 'Ví dụ: 14:00–17:00 (London) hoặc 19:00–22:00 (NY).'], ['Điều kiện vào lệnh', 'Liệt kê từng điều kiện (thanh khoản, MSS, vùng vào…).'], ['Quản lý rủi ro', 'Rủi ro/lệnh: 0,5–1% · Tối đa 2 lệnh/ngày · Dừng khi lỗ 2% trong ngày.'], ['Quản lý lệnh', 'SL ở đâu · chốt 1/2 tại … · BE khi … · TP cuối tại …'], ['Điều kiện KHÔNG giao dịch', 'Tin đỏ, giờ trưa NY, ngày thứ Sáu chiều, sau 2 lệnh thua liên tiếp…'], ['Quy tắc tâm lý', 'Không gỡ lỗ, không tăng lot sau thua, review nhật ký mỗi cuối tuần.']];
  T.items.plan = { title: 'Mẫu kế hoạch giao dịch', desc: 'Điền 8 mục; nội dung tự lưu trong trình duyệt. Một kế hoạch viết ra rõ ràng giảm quyết định cảm tính.', render(el) {
    const S = ICT.store, st = S.get('plan', {});
    el.innerHTML = '<div class="tool">' + PLAN.map((p, i) => '<div class="fld" style="margin-bottom:12px"><label for="pl' + i + '">' + (i + 1) + '. ' + p[0] + '</label><textarea id="pl' + i + '" placeholder="' + esc(p[1]) + '">' + esc(st[i] || '') + '</textarea></div>').join('') + '<div class="btns"><button type="button" class="btn" id="plc">Sao chép toàn bộ kế hoạch</button><span class="muted" id="plm" style="font-size:13px"></span></div></div>';
    el.addEventListener('input', (e) => { const t = e.target.closest('textarea'); if (!t) return; st[t.id.slice(2)] = t.value; S.set('plan', st); });
    $('#plc', el).onclick = () => { const txt = PLAN.map((p, i) => (i + 1) + '. ' + p[0] + '\n' + (st[i] || '')).join('\n\n'); try { navigator.clipboard.writeText(txt).then(() => ($('#plm', el).textContent = 'Đã sao chép.'), () => ($('#plm', el).textContent = 'Không sao chép được, hãy copy thủ công.')); } catch (er) { $('#plm', el).textContent = 'Không sao chép được.'; } };
  } };

  /* ---------- Trang công cụ ---------- */
  const order = ['killzone', 'risk', 'expect', 'montecarlo', 'ci', 'fib', 'sd', 'journal', 'checklist', 'plan'];
  T.hub = function (view) {
    view.innerHTML = '<div class="page"><div class="crumb">Công cụ</div><h1>Bộ công cụ giao dịch</h1><p class="lead">Mọi công cụ chạy ngay trong trình duyệt. Dữ liệu cá nhân (nhật ký, kế hoạch) chỉ lưu ở máy bạn.</p><div class="cards">' + order.map((k) => '<a class="card" href="#t-' + k + '"><h3>' + esc(T.items[k].title) + '</h3><p>' + esc(T.items[k].desc) + '</p></a>').join('') + '</div></div>';
  };
  T.page = function (view, k) {
    const it = T.items[k]; view.innerHTML = '<div class="page"><div class="crumb"><a href="#tools" style="color:inherit">Công cụ</a></div><h1>' + esc(it.title) + '</h1><p class="lead">' + esc(it.desc) + '</p><div id="tb"></div></div>';
    it.render($('#tb', view)); document.title = it.title + ' — Kênh Học ICT';
  };
  T.items = order.reduce((o, k) => ((o[k] = T.items[k]), o), {});
})();
