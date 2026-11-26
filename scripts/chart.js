/* Vẽ ảnh biểu đồ 15m (SVG) cho thông báo: nến, vùng vào, Entry/SL/TP, điểm quét thanh khoản và MSS. */
'use strict';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = function chartSvg(m15, s, info) {
  const dec = info.dec == null ? 2 : info.dec, f2 = (x) => (+x).toFixed(dec);
  const W = 1000, H = 560, L = 16, R = 86, T = 64, B = 70, buy = s.dir === 'BUY';
  const idx = [s.ready, s.mss ? s.mss.i : s.ready, s.sweep ? s.sweep.i : s.ready, s.zone ? s.zone.x1 : s.ready];
  let a = Math.max(0, Math.min.apply(null, idx) - 24); a = Math.min(a, m15.length - 60); a = Math.max(a, m15.length - 150);
  const bars = m15.slice(a), N = bars.length, pad = 14, slot = (W - L - R) / (N + pad), bw = Math.max(2, slot * 0.62);
  let hi = -1e9, lo = 1e9; bars.forEach((b) => { hi = Math.max(hi, b.h); lo = Math.min(lo, b.l); });
  [s.entry, s.sl, s.tp2, s.tp1].forEach((p) => { hi = Math.max(hi, p); lo = Math.min(lo, p); });
  const sp = (hi - lo) * 0.06; hi += sp; lo -= sp;
  const X = (i) => L + (i - a + 0.5) * slot, Y = (p) => T + ((hi - p) / (hi - lo)) * (H - T - B), right = W - R;
  const BG = '#0e131a', FG = '#e8edf3', MUTE = '#8a97a8', UP = '#2fbf82', DN = '#e5484d', BLUE = '#5aa9ff', WARN = '#f5a524';
  let o = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="DejaVu Sans, Arial, sans-serif">';
  o += '<rect width="' + W + '" height="' + H + '" fill="' + BG + '"/>';
  // lưới + trục giá
  const step = (() => { const raw = (hi - lo) / 6, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; })();
  for (let p = Math.ceil(lo / step) * step; p < hi; p += step) o += '<line x1="' + L + '" x2="' + right + '" y1="' + Y(p) + '" y2="' + Y(p) + '" stroke="#243040" stroke-width="1"/><text x="' + (right + 6) + '" y="' + (Y(p) + 4) + '" font-size="12" fill="' + MUTE + '">' + f2(p) + '</text>';
  // vùng vào
  const zc = buy ? UP : DN;
  if (s.zone) { const x1 = X(s.zone.x1) - slot / 2; o += '<rect x="' + x1 + '" y="' + Y(s.zone.top) + '" width="' + (right - x1) + '" height="' + Math.max(2, Y(s.zone.bot) - Y(s.zone.top)) + '" fill="' + zc + '" fill-opacity="0.2" stroke="' + zc + '" stroke-opacity="0.6"/><text x="' + (x1 + 6) + '" y="' + (Y(s.zone.top) + 14) + '" font-size="12" fill="' + zc + '">' + esc(s.zone.type) + '</text>'; }
  if (s.level != null) o += '<line x1="' + X(Math.max(a, s.mss.from)) + '" x2="' + right + '" y1="' + Y(s.level) + '" y2="' + Y(s.level) + '" stroke="' + BLUE + '" stroke-dasharray="5 4"/><text x="' + (X(Math.max(a, s.mss.from)) + 4) + '" y="' + (Y(s.level) - 5) + '" font-size="12" fill="' + BLUE + '">Mức bị phá (retest)</text>';
  // nến
  bars.forEach((b, k) => { const x = X(a + k), up = b.c >= b.o, c = up ? UP : DN, y1 = Y(Math.max(b.o, b.c)), y2 = Y(Math.min(b.o, b.c)); o += '<line x1="' + x + '" x2="' + x + '" y1="' + Y(b.h) + '" y2="' + Y(b.l) + '" stroke="' + c + '" stroke-width="1.3"/><rect x="' + (x - bw / 2) + '" y="' + y1 + '" width="' + bw + '" height="' + Math.max(1.2, y2 - y1) + '" fill="' + c + '"/>'; });
  // nhãn quét / MSS / nến từ chối
  const tag = (i, text, above, col) => { const b = m15[i], x = X(i), y = above ? Y(b.h) - 8 : Y(b.l) + 16; o += '<text x="' + x + '" y="' + y + '" font-size="12" font-weight="bold" fill="' + col + '" text-anchor="middle">' + esc(text) + '</text>'; };
  if (s.sweep) tag(s.sweep.i, 'Quét ' + (buy ? 'SSL' : 'BSL'), !buy, WARN);
  if (s.mss) tag(s.mss.i, s.mss.k + (buy ? ' ▲' : ' ▼'), buy, zc);
  if (s.rej) tag(s.rej.i, s.rej.kind, !buy, WARN);
  // Entry / SL / TP
  const x0 = X(s.ready), line = (p, col, label) => '<line x1="' + x0 + '" x2="' + right + '" y1="' + Y(p) + '" y2="' + Y(p) + '" stroke="' + col + '" stroke-width="1.6" stroke-dasharray="7 4"/><rect x="' + (right - 150) + '" y="' + (Y(p) - 9) + '" width="150" height="18" rx="3" fill="' + BG + '" fill-opacity="0.85"/><text x="' + (right - 6) + '" y="' + (Y(p) + 4) + '" font-size="12.5" font-weight="bold" fill="' + col + '" text-anchor="end">' + label + ' ' + f2(p) + '</text>';
  o += line(s.tp2, UP, 'TP2') + line(s.tp1, UP, 'TP1') + line(s.entry, BLUE, buy ? 'BUY' : 'SELL') + line(s.sl, DN, 'SL');
  // tiêu đề + chân trang
  o += '<text x="' + L + '" y="26" font-size="19" font-weight="bold" fill="' + FG + '">' + esc(info.name || 'XAUUSD') + ' 15m · ' + (buy ? 'MUA' : 'BÁN') + ' · ' + esc(s.title) + '</text>';
  o += '<text x="' + L + '" y="48" font-size="13" fill="' + MUTE + '">Điểm ' + s.score + '/100 (' + s.grade + ') · RR TP1 1:' + s.rr1 + ' · TP2 1:' + s.rr2 + ' · rủi ro $' + f2(s.risk) + (info.unit == null ? '/oz' : info.unit) + '</text>';
  o += '<text x="' + L + '" y="' + (H - 40) + '" font-size="12.5" fill="' + FG + '">' + esc(info.bias) + '</text>';
  o += '<text x="' + L + '" y="' + (H - 20) + '" font-size="11.5" fill="' + MUTE + '">' + esc(info.when) + ' · ' + esc(info.foot || 'dữ liệu Deriv XAU/USD') + ' · nội dung giáo dục, không phải lời khuyên đầu tư</text>';
  return o + '</svg>';
};
