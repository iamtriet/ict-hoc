/* ICT Hub — Bảng tin quan trọng & tác động: tiền tệ chính, giá vàng/bạc, tin Fed/lạm phát/địa chính trị tự phân loại và kết luận nghiêng tăng/giảm cho từng tài sản.
   Nguồn dữ liệu: Frankfurter (tỷ giá tham chiếu ECB), gold-api.com (giá kim loại), RSS qua rss2json.com (Fed, CNBC, BBC, Al Jazeera, FXStreet…).
   Mọi kết luận là suy luận theo từ khóa và quy tắc kinh nghiệm: xác suất, không phải lời khuyên đầu tư. */
(function () {
  'use strict';
  const ICT = window.ICT, esc = ICT.esc, $ = (s, r) => (r || document).querySelector(s);
  const AS = [['gold', 'Vàng (XAU)'], ['silver', 'Bạc (XAG)'], ['stocks', 'Chứng khoán Mỹ'], ['usd', 'USD'], ['yield', 'Lợi suất TP Mỹ'], ['oil', 'Dầu']];

  /* Quy tắc tác động: điểm từ −2 (giảm mạnh) đến +2 (tăng mạnh) cho từng tài sản trong phản ứng ngắn hạn thường gặp */
  const EV = {
    fed_hawk: { t: 'Fed/NHTW tăng lãi suất hoặc giọng diều hâu', e: { gold: -2, silver: -2, stocks: -1, usd: 2, yield: 2, oil: 0 }, why: 'Lãi suất cao hơn đẩy USD và lợi suất trái phiếu tăng; vàng không sinh lãi nên kém hấp dẫn; chi phí vốn cao đè lên cổ phiếu.', note: 'Nếu thị trường đã định giá trước (priced in) thì phản ứng có thể yếu hoặc ngược chiều.' },
    fed_dove: { t: 'Fed/NHTW cắt lãi suất hoặc giọng bồ câu', e: { gold: 2, silver: 2, stocks: 1, usd: -2, yield: -2, oil: 0 }, why: 'Lãi suất thấp hơn làm USD và lợi suất giảm, giảm chi phí cơ hội giữ vàng; cổ phiếu thường hưởng lợi.', note: 'Nếu cắt lãi vì kinh tế suy yếu nhanh, cổ phiếu có thể giảm thay vì tăng.' },
    cpi_hot: { t: 'Lạm phát nóng hơn dự báo', e: { gold: -1, silver: -1, stocks: -1, usd: 1, yield: 1, oil: 0 }, why: 'Thị trường đọc là Fed phải giữ lãi suất cao lâu hơn nên USD và lợi suất tăng, vàng chịu áp lực ngắn hạn.', note: 'Lạm phát cao kéo dài lại hỗ trợ vàng ở khung dài hạn; phản ứng đầu tiên và phản ứng sau có thể ngược nhau.' },
    cpi_cool: { t: 'Lạm phát nguội hơn dự báo', e: { gold: 1, silver: 1, stocks: 1, usd: -1, yield: -1, oil: 0 }, why: 'Kỳ vọng Fed nới lỏng tăng, USD và lợi suất giảm, vàng và cổ phiếu được hỗ trợ.', note: 'Chỉ đúng khi so với dự báo; con số thấp nhưng vẫn cao hơn dự báo thì không tính là “nguội”.' },
    jobs_strong: { t: 'Việc làm mạnh hơn dự báo', e: { gold: -1, silver: -1, stocks: 0, usd: 1, yield: 1, oil: 0 }, why: 'Kinh tế vững khiến Fed ít có lý do cắt lãi suất: USD và lợi suất tăng, vàng giảm nhẹ.', note: 'Với cổ phiếu có hai chiều: kinh tế tốt (tăng) nhưng lãi suất cao (giảm).' },
    jobs_weak: { t: 'Việc làm yếu hơn dự báo', e: { gold: 1, silver: 1, stocks: 0, usd: -1, yield: -1, oil: 0 }, why: 'Kỳ vọng cắt lãi suất tăng nên USD và lợi suất giảm, vàng tăng.', note: 'Nếu số liệu yếu đến mức gây lo suy thoái, cổ phiếu có thể giảm mạnh.' },
    geo_up: { m: 0.6, t: 'Căng thẳng địa chính trị leo thang', e: { gold: 2, silver: 1, stocks: -1, usd: 1, yield: -1, oil: 1 }, why: 'Dòng tiền chạy sang tài sản trú ẩn (vàng, USD, trái phiếu Mỹ), cổ phiếu chịu áp lực; dầu tăng nếu vùng xung đột liên quan đến nguồn cung.', note: 'Tin về xung đột kéo dài được tính nhẹ (x0,6); chỉ cú sốc mới tạo phản ứng lớn. Tác động thường ngắn: nếu căng thẳng không làm gián đoạn kinh tế, giá có thể trả lại mức tăng sau vài ngày.' },
    geo_down: { t: 'Hạ nhiệt, ngừng bắn, đàm phán', e: { gold: -1, silver: -0.5, stocks: 1, usd: -0.5, yield: 0.5, oil: -1 }, why: 'Nhu cầu trú ẩn giảm, khẩu vị rủi ro tăng, cổ phiếu hồi phục, dầu mất phần bù rủi ro.', note: 'Nếu thỏa thuận mong manh, thị trường có thể đảo chiều rất nhanh khi có vi phạm.' },
    tariff_down: { t: 'Thỏa thuận thương mại / giảm thuế quan', e: { gold: -0.5, silver: 0.5, stocks: 2, usd: -0.5, yield: 0.5, oil: 1 }, why: 'Rủi ro tăng trưởng giảm, cổ phiếu và hàng hóa công nghiệp (bạc, dầu) được hỗ trợ; nhu cầu trú ẩn giảm nhẹ.', note: 'Thỏa thuận có thể bị phá vỡ; thị trường thường đã phản ứng khi tin đồn xuất hiện.' },
    tariff: { t: 'Thuế quan / chiến tranh thương mại leo thang', e: { gold: 1, silver: -0.5, stocks: -2, usd: 1, yield: -0.5, oil: -1 }, why: 'Rủi ro tăng trưởng toàn cầu và lạm phát chi phí; cổ phiếu giảm mạnh, vàng hưởng trú ẩn, bạc bị kéo xuống vì nhu cầu công nghiệp lo ngại.', note: 'Tác động thay đổi theo mức thuế thực tế và phản ứng trả đũa.' },
    oil_up: { t: 'Dầu tăng mạnh', e: { gold: 0, silver: 0, stocks: -1, usd: 0.5, yield: 1, oil: 2 }, why: 'Dầu đắt làm kỳ vọng lạm phát và lợi suất tăng; cổ phiếu chịu áp lực chi phí.', note: 'Với vàng là tác động hai chiều: lạm phát cao (tốt) nhưng lãi suất cao (xấu).' },
    oil_down: { t: 'Dầu giảm mạnh', e: { gold: 0, silver: 0, stocks: 1, usd: -0.5, yield: -1, oil: -2 }, why: 'Áp lực lạm phát giảm, lợi suất hạ, cổ phiếu nhẹ nhõm.', note: 'Dầu giảm vì lo cầu yếu thì lại là tín hiệu xấu cho tăng trưởng.' },
    usd_up: { t: 'USD mạnh lên', e: { gold: -1, silver: -1, stocks: -0.5, usd: 1, yield: 0.5, oil: -0.5 }, why: 'Vàng và hàng hóa định giá bằng USD nên đắt hơn với người nắm tiền khác, thường giảm khi USD tăng.', note: 'Tương quan nghịch không phải lúc nào cũng giữ (trú ẩn cùng lúc đẩy cả vàng và USD lên).' },
    usd_down: { t: 'USD yếu đi', e: { gold: 1, silver: 1, stocks: 0.5, usd: -1, yield: -0.5, oil: 0.5 }, why: 'Vàng rẻ hơn với người nắm tiền khác, nhu cầu tăng; hàng hóa nói chung được hỗ trợ.', note: 'Hãy xem nguyên nhân USD yếu: do Fed nới lỏng (ủng hộ vàng) hay do rủi ro bán tháo (có thể khác).' },
    cb_gold: { t: 'Ngân hàng trung ương/ETF mua vàng', e: { gold: 1, silver: 0.5, stocks: 0, usd: 0, yield: 0, oil: 0 }, why: 'Nhu cầu cấu trúc dài hạn tạo đáy giá cao hơn.', note: 'Là động lực chậm; ít giải thích được biến động trong một phiên.' },
    crisis: { t: 'Khủng hoảng ngân hàng, nợ hoặc tín dụng', e: { gold: 2, silver: 0.5, stocks: -2, usd: 0.5, yield: -2, oil: -1 }, why: 'Chạy sang tài sản an toàn: vàng và trái phiếu tăng giá (lợi suất giảm), cổ phiếu bán tháo.', note: 'Giai đoạn đầu của khủng hoảng thanh khoản đôi khi cả vàng cũng bị bán để lấy tiền mặt.' },
    china_stim: { t: 'Trung Quốc kích thích kinh tế', e: { gold: 0.5, silver: 1, stocks: 1, usd: -0.5, yield: 0.5, oil: 1 }, why: 'Cầu hàng hóa và công nghiệp tăng (bạc, dầu), tâm lý rủi ro cải thiện.', note: 'Hiệu quả phụ thuộc quy mô thực tế của gói kích thích.' },
  };
  /* Phân loại tin theo từ khóa → sự kiện */
  const RULES = [
    ['fed_hawk', /\b(rate hikes?|hawkish|hike[sd]? rates?|raises? (interest )?rates?|higher for longer|tightening)\b/i],
    ['fed_dove', /\b(rate cuts?|cuts? (interest )?rates?|dovish|lower (interest )?rates|easing cycle|cuts? borrowing)\b/i],
    ['cpi_hot', /\b(inflation|cpi|pce|ppi)\b.{0,40}\b(hotter|accelerat\w*|jumps?|surges?|higher than expected|above expectations|climbs?)\b/i],
    ['cpi_cool', /\b(inflation|cpi|pce|ppi)\b.{0,40}\b(cools?|eases|slows?|softer|lower than expected|below expectations|falls?|drops?)\b/i],
    ['jobs_strong', /\b(payrolls?|jobs|hiring|employment)\b.{0,40}\b(beat|strong|stronger|surge[sd]?|better than expected)\b|\bunemployment\b.{0,30}\b(falls?|drops?|lowest)\b/i],
    ['jobs_weak', /\b(payrolls?|jobs|hiring|employment)\b.{0,40}\b(miss|weak|weaker|slump|slow\w*|shed|worse than expected|contract\w*)\b|\bunemployment\b.{0,30}\b(rises?|climbs?|jumps?|highest)\b|\blayoffs\b|\bjob cuts\b/i],
    ['geo_up', /\b(war|invasion|invade[sd]?|airstrikes?|missiles?|escalat\w+|new sanctions|sanctions on|attack(s|ed)?|strikes? (on|in|against)|hostilities|blockade|shelling|retaliat\w+)\b/i],
    ['geo_down', /\b(ceasefire|cease-fire|truce|peace (deal|talks|agreement)|de-?escalat\w+|talks resume)\b/i],
    ['tariff', /\b(tariffs?|trade war|trade tensions?|export controls?|trade dispute)\b(?!.{0,40}\b(refunds?|deal|truce|cut|lifted|eased|pause[sd]?|exempt\w*|suspend\w*)\b)/i],
    ['tariff_down', /\b(trade deal|trade truce|tariffs?.{0,25}(cut|lifted|eased|paused|suspended|rolled back))\b/i],
    ['oil_up', /\b(oil|crude|brent|wti|opec)\b.{0,40}\b(surges?|jumps?|rises?|rally|rallies|climbs?|spikes?|higher|output cuts?)\b/i],
    ['oil_down', /\b(oil|crude|brent|wti)\b.{0,40}\b(falls?|drops?|slumps?|tumbles?|slides?|lower|plunges?|declines?)\b/i],
    ['usd_up', /\b(dollar|greenback|dxy)\b.{0,40}\b(strengthens?|rises?|gains?|jumps?|surges?|firms?|rallies|higher|advances?|climbs?)\b/i],
    ['usd_down', /\b(dollar|greenback|dxy)\b.{0,40}\b(weakens?|falls?|slides?|slumps?|drops?|lower|declines?|sinks?|tumbles?)\b/i],
    ['cb_gold', /\bcentral banks?\b.{0,30}\b(buy\w*|purchas\w+|accumulat\w+)\b|\bgold etfs?\b.{0,20}\binflows?\b/i],
    ['crisis', /\b(bank (collapse|failure|failures|run)|banking crisis|financial crisis|credit crunch|debt crisis|contagion|liquidity crunch)\b/i],
    ['china_stim', /\bchina\b.{0,40}\b(stimulus|rate cut|easing)\b|\bpboc\b.{0,20}\b(cut|ease|stimulus)\b/i],
  ];
  const TOPICS = [
    ['fed', 'Fed & lãi suất', /\b(fed|federal reserve|fomc|powell|warsh|ecb|boe|boj|bank of japan|bank of england|rate decision|interest rates?|central banks?)\b/i],
    ['macro', 'Lạm phát & việc làm', /\b(inflation|cpi|pce|ppi|payrolls?|nfp|jobs|unemployment|gdp|retail sales|pmi|ism|layoffs)\b/i],
    ['geo', 'Địa chính trị', /\b(war|invasion|missiles?|airstrikes?|sanctions?|military|ceasefire|truce|conflict|tensions?|nato|iran|israel|gaza|ukraine|russia|taiwan|north korea|hostilities|nuclear|tariffs?|trade war)\b/i],
    ['fx', 'Tiền tệ', /\b(dollar|greenback|euro|yen|sterling|pound|yuan|renminbi|franc|currency|currencies|forex|eur\/usd|usd\/jpy|gbp\/usd|dxy)\b/i],
    ['metal', 'Vàng & bạc', /\b(gold|silver|bullion|precious metals?|platinum)\b/i],
    ['oil', 'Dầu', /\b(oil|crude|brent|wti|opec)\b/i],
    ['stocks', 'Chứng khoán', /\b(stocks?|wall street|s&p 500|nasdaq|dow jones|equities|bear market|bull market)\b/i],
  ];
  const FEEDS = [
    ['Fed', 'https://www.federalreserve.gov/feeds/press_all.xml'], ['FXStreet', 'https://www.fxstreet.com/rss/news'],
    ['CNBC', 'https://www.cnbc.com/id/100003114/device/rss/rss.html'], ['CNBC Kinh tế', 'https://www.cnbc.com/id/20910258/device/rss/rss.html'], ['CNBC Thị trường', 'https://www.cnbc.com/id/15839069/device/rss/rss.html'],
    ['BBC Kinh doanh', 'https://feeds.bbci.co.uk/news/business/rss.xml'], ['BBC Thế giới', 'https://feeds.bbci.co.uk/news/world/rss.xml'], ['Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml'],
    ['The Guardian', 'https://www.theguardian.com/business/rss'], ['MarketWatch', 'https://feeds.marketwatch.com/marketwatch/topstories/'],
  ];

  const arrow = (v) => (v >= 1.5 ? '<b class="up">▲▲</b>' : v >= 0.5 ? '<b class="up">▲</b>' : v <= -1.5 ? '<b class="dn">▼▼</b>' : v <= -0.5 ? '<b class="dn">▼</b>' : '<span class="muted">–</span>');
  const pct = (v) => (v == null || isNaN(v) ? '–' : '<span class="' + (v > 0.005 ? 'up' : v < -0.005 ? 'dn' : 'muted') + '">' + (v > 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + '%</span>');
  const dec = (s) => { const t = document.createElement('textarea'); t.innerHTML = s || ''; return t.value; };
  const plain = (s) => dec(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  const ago = (ms) => { const m = Math.max(0, Math.round((Date.now() - ms) / 60000)); return m < 60 ? m + ' phút trước' : m < 1440 ? Math.round(m / 60) + ' giờ trước' : Math.round(m / 1440) + ' ngày trước'; };
  const jget = (u, ms) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 12000); return fetch(u, { signal: c.signal, cache: 'no-store' }).then((r) => { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.json(); }); };
  const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };

  /* ---- Tiền tệ: Frankfurter (ECB) ---- */
  const CUR = [['EUR', 'Euro'], ['JPY', 'Yên Nhật'], ['GBP', 'Bảng Anh'], ['CHF', 'Franc Thụy Sĩ'], ['CAD', 'Đô Canada'], ['AUD', 'Đô Úc'], ['CNY', 'Nhân dân tệ']];
  const DXYW = { EUR: 0.576, JPY: 0.136, GBP: 0.119, CAD: 0.091, SEK: 0.042, CHF: 0.036 };
  async function loadFx() {
    const d0 = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
    const j = await jget('https://api.frankfurter.dev/v1/' + d0 + '..?base=USD&symbols=EUR,JPY,GBP,CHF,CAD,AUD,CNY,SEK');
    const days = Object.keys(j.rates).sort(), n = days.length, last = days[n - 1];
    const at = (i) => j.rates[days[Math.max(0, i)]];
    const idx30 = (() => { const t = new Date(last).getTime() - 30 * 86400000; let k = 0; days.forEach((d, i) => { if (new Date(d).getTime() <= t) k = i; }); return k; })();
    const perf = (cur, i) => { const a = at(n - 1)[cur], b = at(i)[cur]; return b ? (b / a - 1) * 100 : null; }; // đồng tiền mạnh lên so với USD (+) khi USD/XXX giảm
    const rows = CUR.map(([c, name]) => ({ c, name, rate: at(n - 1)[c], d1: perf(c, n - 2), d5: perf(c, n - 6), d30: perf(c, idx30) }));
    const usd = (i) => { let s = 0, w = 0; Object.keys(DXYW).forEach((c) => { const p = perf(c, i); if (p != null) { s += DXYW[c] * p; w += DXYW[c]; } }); return w ? -s / w : null; };
    return { date: last, rows, usd: { d1: usd(n - 2), d5: usd(n - 6), d30: usd(idx30) } };
  }
  async function loadMetals() {
    const [g, s] = await Promise.all([jget('https://api.gold-api.com/price/XAU', 9000), jget('https://api.gold-api.com/price/XAG', 9000)]);
    const now = Date.now(), H = lsGet('ict.px') || []; let ref = null;
    H.forEach((h) => { if (now - h.t >= 3600000 && now - h.t <= 30 * 3600000 && (!ref || h.t < ref.t)) ref = h; });
    if (!H.length || now - H[H.length - 1].t > 3600000) { H.push({ t: now, g: g.price, s: s.price }); lsSet('ict.px', H.slice(-60)); }
    return { g: g.price, s: s.price, gc: ref ? (g.price / ref.g - 1) * 100 : null, sc: ref ? (s.price / ref.s - 1) * 100 : null, since: ref ? ref.t : null };
  }

  /* ---- Tin: RSS qua rss2json ---- */
  async function loadNews(force) {
    const C = lsGet('ict.nbfeed');
    if (!force && C && Date.now() - C.t < 600000) return { items: C.items, t: C.t, fresh: true };
    const rs = await Promise.all(FEEDS.map(([n, u]) => jget('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(u), 14000).then((j) => (j.items || []).map((it) => ({ src: n, title: plain(it.title), desc: plain(it.description || it.content).slice(0, 220), link: it.link, ts: Date.parse(String(it.pubDate).replace(' ', 'T') + 'Z') || 0 }))).catch(() => [])));
    const seen = {}, items = [];
    rs.forEach((a) => a.forEach((x) => { const k = x.title.toLowerCase().slice(0, 70); if (!x.title || seen[k]) return; seen[k] = 1; items.push(x); }));
    items.sort((a, b) => b.ts - a.ts);
    if (!items.length) { if (C) return { items: C.items, t: C.t, fresh: false }; throw new Error('Không tải được tin'); }
    lsSet('ict.nbfeed', { t: Date.now(), items: items.slice(0, 160) });
    return { items, t: Date.now(), fresh: true };
  }
  function classify(it) {
    const text = it.title + '. ' + it.desc, ev = [], tp = [];
    RULES.forEach(([id, re]) => { if (re.test(it.title)) ev.push(id); });
    const up = ev.indexOf('geo_up'), dn = ev.indexOf('geo_down');
    if (up >= 0 && dn >= 0) { ev.splice(Math.max(up, dn), 1); ev.splice(Math.min(up, dn), 1); } // vừa leo thang vừa hạ nhiệt: bỏ cả hai
    if (ev.indexOf('tariff') >= 0 && ev.indexOf('geo_up') >= 0 && !/(war|invasion|missiles?|airstrikes?)/i.test(it.title)) ev.splice(ev.indexOf('geo_up'), 1);
    TOPICS.forEach(([id, , re]) => { if (re.test(text)) tp.push(id); });
    return { ev, tp };
  }

  /* ---- Kết luận ---- */
  function conclude(items, fx) {
    const now = Date.now(), cnt = {}, src = {};
    items.forEach((it) => { if (now - it.ts > 72 * 3600000) return; it.ev.forEach((e) => { cnt[e] = (cnt[e] || 0) + 1; (src[e] = src[e] || []).push(it); }); });
    const drivers = []; Object.keys(cnt).forEach((e) => drivers.push({ id: e, n: cnt[e], w: (cnt[e] >= 4 ? 2 : cnt[e] >= 2 ? 1.5 : 1) * (EV[e].m || 1), label: EV[e].t, fx: false }));
    if (fx && fx.usd.d5 != null) {
      if (fx.usd.d5 >= 0.7) drivers.push({ id: 'usd_up', n: 0, w: 1, label: 'Rổ USD ước tính tăng ' + fx.usd.d5.toFixed(2).replace('.', ',') + '% trong 5 phiên', fx: true });
      else if (fx.usd.d5 <= -0.7) drivers.push({ id: 'usd_down', n: 0, w: 1, label: 'Rổ USD ước tính giảm ' + Math.abs(fx.usd.d5).toFixed(2).replace('.', ',') + '% trong 5 phiên', fx: true });
    }
    const res = {};
    AS.forEach(([a]) => {
      let s = 0, pos = 0, neg = 0; const parts = [];
      drivers.forEach((d) => { const v = EV[d.id].e[a] * d.w; if (!v) return; s += v; if (v > 0) pos += v; else neg -= v; parts.push({ d, v }); });
      parts.sort((x, y) => Math.abs(y.v) - Math.abs(x.v));
      const mixed = pos > 0 && neg > 0 && Math.min(pos, neg) / Math.max(pos, neg) > 0.5;
      const lab = mixed && Math.abs(s) < 2 ? 'Lẫn lộn' : s >= 2.5 ? 'Nghiêng tăng mạnh' : s >= 1 ? 'Nghiêng tăng' : s <= -2.5 ? 'Nghiêng giảm mạnh' : s <= -1 ? 'Nghiêng giảm' : 'Trung tính';
      const conf = mixed || Math.abs(s) < 1 ? 'thấp' : Math.abs(s) >= 3 ? 'trung bình' : 'thấp–trung bình';
      res[a] = { s, lab, conf, parts: parts.slice(0, 3), total: parts.length };
    });
    return { res, drivers, src };
  }

  ICT.newsBoard = function (box) {
    box.innerHTML = '<h2 style="margin-top:8px">Kết luận nhanh: tin tức đang nghiêng về hướng nào?</h2><div id="nb-c" class="muted">Đang tổng hợp tin và tỷ giá…</div>' +
      '<h2>Tiền tệ chính tăng hay giảm so với USD</h2><div id="nb-f" class="muted">Đang tải tỷ giá…</div>' +
      '<h2>Tin quan trọng (tự phân loại)</h2><div class="ch-tg" id="nb-tg"></div><div id="nb-n" class="muted" style="margin-top:10px">Đang tải tin…</div>' +
      '<h2>Bảng quy tắc: nếu có tin này thì các tài sản thường phản ứng thế nào?</h2><div id="nb-m"></div>';
    let fx = null, news = null, topic = 'all';

    /* bảng quy tắc (tĩnh) */
    $('#nb-m', box).innerHTML = '<p class="muted" style="font-size:13.5px">Bấm vào một dòng để xem lý do và điều kiện ngược chiều. ▲ tăng, ▼ giảm, gấp đôi là mạnh. Đây là phản ứng ngắn hạn <b>thường gặp</b>, không bảo đảm.</p><div class="tblw"><table><tr><th>Tin / sự kiện</th>' + AS.map((a) => '<th>' + a[1] + '</th>').join('') + '</tr>' +
      Object.keys(EV).map((k) => '<tr class="nb-r" data-k="' + k + '" tabindex="0" style="cursor:pointer"><td><b>' + esc(EV[k].t) + '</b></td>' + AS.map((a) => '<td>' + arrow(EV[k].e[a[0]]) + '</td>').join('') + '</tr><tr class="nb-w" id="nbw-' + k + '" hidden><td colspan="' + (AS.length + 1) + '"><b>Vì sao:</b> ' + esc(EV[k].why) + '<br><b>Lưu ý ngược chiều:</b> ' + esc(EV[k].note) + '</td></tr>').join('') + '</table></div>';
    const tog = (r) => { const w = $('#nbw-' + r.dataset.k, box); if (w) w.hidden = !w.hidden; };
    $('#nb-m', box).addEventListener('click', (e) => { const r = e.target.closest('.nb-r'); if (r) tog(r); });
    $('#nb-m', box).addEventListener('keydown', (e) => { const r = e.target.closest && e.target.closest('.nb-r'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tog(r); } });

    function drawFx(m) {
      const el = $('#nb-f', box); if (!el) return;
      let h = '';
      if (m) h += '<div class="clocks" style="margin-bottom:12px"><div class="clock"><span>Vàng XAU/USD</span><b>$' + m.g.toLocaleString('en-US', { maximumFractionDigits: 2 }) + '</b><span>' + (m.gc != null ? pct(m.gc) + ' so với ' + ago(m.since).replace(' trước', '') + ' trước' : 'Chưa có mốc so sánh (mở lại sau 1 giờ)') + '</span></div>' +
        '<div class="clock"><span>Bạc XAG/USD</span><b>$' + m.s.toFixed(2) + '</b><span>' + (m.sc != null ? pct(m.sc) : 'Chưa có mốc so sánh') + '</span></div>' +
        '<div class="clock"><span>Tỷ lệ vàng/bạc</span><b>' + (m.g / m.s).toFixed(1).replace('.', ',') + '</b><span>Cao: bạc rẻ tương đối so với vàng</span></div></div>';
      if (fx) {
        h += '<div class="tblw"><table><tr><th>Tiền tệ</th><th>Tỷ giá (1 USD =)</th><th>1 phiên</th><th>5 phiên</th><th>30 ngày</th></tr>' +
          '<tr><td><b>USD (rổ 6 tiền tệ, ước tính kiểu DXY)</b></td><td class="muted">–</td><td>' + pct(fx.usd.d1) + '</td><td>' + pct(fx.usd.d5) + '</td><td>' + pct(fx.usd.d30) + '</td></tr>' +
          fx.rows.map((r) => '<tr><td>' + esc(r.name) + ' (' + r.c + ')</td><td>' + r.rate.toLocaleString('en-US', { maximumFractionDigits: r.c === 'JPY' ? 2 : 4 }) + ' ' + r.c + '</td><td>' + pct(r.d1) + '</td><td>' + pct(r.d5) + '</td><td>' + pct(r.d30) + '</td></tr>').join('') + '</table></div>' +
          '<p class="muted" style="font-size:13px">Số xanh/đỏ là mức đồng tiền đó <b>mạnh lên (+) hay yếu đi (−) so với USD</b>. Với dòng USD thì ngược lại: + nghĩa là USD mạnh lên. Dữ liệu là tỷ giá tham chiếu của ECB (chốt một lần mỗi ngày làm việc, mốc gần nhất: ' + esc(fx.date) + '), không phải giá từng giây; xem giá trực tiếp ở bảng TradingView bên dưới.</p>';
      } else h += '<p class="dn">Không tải được tỷ giá (cần internet).</p>';
      el.className = ''; el.innerHTML = h;
    }

    function drawNews() {
      const el = $('#nb-n', box), tg = $('#nb-tg', box); if (!el || !news) return;
      const items = news.items.map((it) => Object.assign({}, it, classify(it))).filter((it) => it.ev.length || it.tp.length);
      const counts = {}; items.forEach((it) => it.tp.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
      tg.innerHTML = [['all', 'Tất cả (' + items.length + ')']].concat(TOPICS.map((t) => [t[0], t[1] + ' (' + (counts[t[0]] || 0) + ')'])).concat([['impact', 'Có tác động rõ']]).map((t) => '<button type="button" class="tg' + (t[0] === topic ? ' on' : '') + '" data-t="' + t[0] + '">' + esc(t[1]) + '</button>').join('');
      const show = items.filter((it) => topic === 'all' || (topic === 'impact' ? it.ev.length : it.tp.indexOf(topic) >= 0)).slice(0, 40);
      el.className = '';
      el.innerHTML = '<p class="muted" style="font-size:13px;margin:0 0 8px">Cập nhật ' + ago(news.t) + (news.fresh ? '' : ' (dữ liệu đã lưu, không tải mới được)') + ' · <button type="button" class="tg" id="nb-rf">↻ Tải lại</button></p>' +
        (show.map((it) => {
          const imp = it.ev.map((e) => { const x = EV[e].e; return '<span class="nb-i"><b>' + esc(EV[e].t) + ':</b> ' + AS.filter((a) => Math.abs(x[a[0]]) >= 1).map((a) => a[1].replace(/ \(.*\)/, '') + ' ' + arrow(x[a[0]])).join(' · ') + '</span>'; }).join('');
          const safe = /^https?:\/\//.test(it.link || '') ? it.link : '#';
          return '<div class="nb-h"><a href="' + esc(safe) + '" target="_blank" rel="noopener noreferrer">' + esc(it.title) + '</a><div class="nb-m"><span>' + esc(it.src) + '</span><span>' + (it.ts ? ago(it.ts) : '') + '</span>' + it.tp.map((t) => '<span class="tagc">' + esc(TOPICS.filter((x) => x[0] === t)[0][1]) + '</span>').join('') + '</div>' + (imp ? '<div class="nb-imp">' + imp + '</div>' : '') + '</div>';
        }).join('') || '<p class="muted">Không có tin phù hợp bộ lọc.</p>') +
        '<p class="muted" style="font-size:12.5px;margin-top:10px">Tin gốc bằng tiếng Anh, lấy từ RSS công khai của các hãng tin (qua dịch vụ rss2json). Việc gắn nhãn và “tác động” là tự động theo từ khóa nên <b>có thể sai ngữ cảnh</b>; hãy bấm vào tin gốc để kiểm tra.</p>';
    }

    function drawConclusion() {
      const el = $('#nb-c', box); if (!el) return;
      if (!news) { el.innerHTML = '<p class="dn">Chưa tải được tin để tổng hợp. Bảng tỷ giá và bảng quy tắc bên dưới vẫn dùng được.</p>'; return; }
      const items = news.items.map((it) => Object.assign({}, it, classify(it))), C = conclude(items, fx);
      const g = C.res.gold, n3 = C.drivers.filter((d) => !d.fx).reduce((s, d) => s + d.n, 0);
      const why = (r) => r.parts.length ? r.parts.map((p) => esc(p.d.label) + (p.d.n > 1 ? ' (' + p.d.n + ' tin)' : '') + ' ' + arrow(p.v)).join('<br>') : '<span class="muted">Chưa có tin tác động rõ</span>';
      el.className = '';
      el.innerHTML = '<div class="tblw"><table><tr><th>Tài sản</th><th>Nghiêng</th><th>Điểm</th><th>Độ tin cậy</th><th>Động lực chính</th></tr>' + AS.map(([a, nm]) => { const r = C.res[a], cl = r.s >= 1 ? 'up' : r.s <= -1 ? 'dn' : 'muted'; return '<tr><td><b>' + nm + '</b></td><td class="' + cl + '"><b>' + (r.s >= 1 ? '▲ ' : r.s <= -1 ? '▼ ' : '– ') + r.lab + '</b></td><td>' + (r.s > 0 ? '+' : '') + r.s.toFixed(1).replace('.', ',') + '</td><td>' + r.conf + '</td><td style="font-size:13px">' + why(r) + '</td></tr>'; }).join('') + '</table></div>' +
        '<div class="callout key"><p><b>Đọc kết quả cho vàng:</b> ' + (g.parts.length ? 'trong ~3 ngày qua có ' + n3 + ' tin có tác động rõ (cộng thêm tín hiệu tỷ giá nếu có). Tổng hợp <b>' + g.lab.toLowerCase() + '</b> cho vàng, chủ yếu vì: ' + g.parts.map((p) => esc(p.d.label)).join('; ') + '.' : 'chưa có tin nào đủ rõ để nghiêng hẳn về một phía.') + ' Đây là <b>bối cảnh vĩ mô</b> (một nhóm bằng chứng trong <a href="#m11l7">bảng chấm điểm A+</a>), không phải tín hiệu vào lệnh: vẫn cần cấu trúc, thanh khoản và xác nhận trên biểu đồ (<a href="#m11l6">bài vĩ mô &amp; liên thị trường</a>).</p></div>' +
        '<div class="callout warn"><p>Cách tính: mỗi loại sự kiện (Fed diều hâu, địa chính trị leo thang, USD tăng…) được gán điểm tác động cố định cho từng tài sản theo kinh nghiệm thị trường, cộng lại và tăng nhẹ khi nhiều tin cùng loại. Thị trường thường <b>định giá trước</b> tin đã biết nên phản ứng thực có thể khác hoặc ngược lại. Chỉ nhằm học tập, không phải lời khuyên đầu tư.</p></div>';
    }

    function refresh(force) {
      $('#nb-c', box).textContent = 'Đang tổng hợp tin và tỷ giá…';
      Promise.all([loadFx().catch(() => null), loadMetals().catch(() => null), loadNews(force).catch(() => null)]).then(([f, m, n]) => {
        if (!box.isConnected) return; fx = f; news = n; drawFx(m); drawNews(); drawConclusion();
      });
    }
    box.addEventListener('click', (e) => {
      const t = e.target.closest('#nb-tg .tg'); if (t) { topic = t.dataset.t; drawNews(); return; }
      if (e.target.closest('#nb-rf')) refresh(true);
    });
    refresh(false);
    const id = setInterval(() => { if (document.visibilityState === 'visible') refresh(true); }, 600000); ICT.live.push(() => clearInterval(id));
  };
})();
