/* Chú giải viết tắt ngay tại chỗ: gạch chân chấm, bấm hoặc rê chuột để xem tên đầy đủ và giải thích. */
(function () {
  'use strict';
  const ICT = window.ICT, esc = ICT.esc;
  /* [viết tắt, tên đầy đủ, giải thích ngắn tiếng Việt] */
  const T = [
    ['ICT', 'Inner Circle Trader', 'tên trường phái do Michael Huddleston (ICT) phổ biến'],
    ['SMC', 'Smart Money Concepts', 'cách gọi chung các khái niệm dòng tiền lớn, phát triển từ ICT'],
    ['FVG', 'Fair Value Gap', 'khoảng trống giá trị hợp lý: vùng 3 nến mà giá đi quá nhanh, chưa được lấp'],
    ['IFVG', 'Inversion Fair Value Gap', 'FVG bị phá xuyên nên đổi vai trò (hỗ trợ ↔ kháng cự)'],
    ['BPR', 'Balanced Price Range', 'vùng giao nhau của hai FVG ngược hướng'],
    ['OB', 'Order Block', 'vùng lệnh lớn: nến ngược hướng cuối cùng trước cú đẩy mạnh'],
    ['MSS', 'Market Structure Shift', 'đổi cấu trúc: giá phá swing ngược xu hướng cũ, kèm displacement'],
    ['BOS', 'Break of Structure', 'phá cấu trúc cùng chiều, xu hướng tiếp diễn'],
    ['CHoCH', 'Change of Character', 'đổi tính chất xu hướng (tên SMC của MSS)'],
    ['HTF', 'Higher Time Frame', 'khung thời gian lớn (H4, D1, W1) dùng để xác định hướng'],
    ['LTF', 'Lower Time Frame', 'khung thời gian nhỏ (M1–M15) dùng để canh điểm vào'],
    ['SL', 'Stop Loss', 'lệnh cắt lỗ: mức giá bạn chấp nhận sai'],
    ['TP', 'Take Profit', 'mức chốt lời'],
    ['RR', 'Risk : Reward', 'tỷ lệ lợi nhuận kỳ vọng trên rủi ro (RR 1:3 = lời gấp 3 lần lỗ)'],
    ['BE', 'Breakeven', 'hòa vốn: dời SL về giá vào lệnh'],
    ['OTE', 'Optimal Trade Entry', 'vùng vào lệnh tối ưu, thường 62%–79% của nhịp (Fibonacci)'],
    ['DOL', 'Draw on Liquidity', 'mục tiêu thanh khoản mà giá bị hút tới'],
    ['BSL', 'Buy-Side Liquidity', 'thanh khoản phía mua: lệnh dừng nằm trên các đỉnh'],
    ['SSL', 'Sell-Side Liquidity', 'thanh khoản phía bán: lệnh dừng nằm dưới các đáy'],
    ['EQH', 'Equal Highs', 'các đỉnh bằng nhau, nơi chứa nhiều stop'],
    ['EQL', 'Equal Lows', 'các đáy bằng nhau, nơi chứa nhiều stop'],
    ['POI', 'Point of Interest', 'vùng quan tâm: nơi bạn dự kiến canh vào lệnh'],
    ['PDH', 'Previous Day High', 'đỉnh của ngày hôm trước'],
    ['PDL', 'Previous Day Low', 'đáy của ngày hôm trước'],
    ['PWH', 'Previous Week High', 'đỉnh của tuần trước'],
    ['PWL', 'Previous Week Low', 'đáy của tuần trước'],
    ['PMH', 'Previous Month High', 'đỉnh của tháng trước'],
    ['PML', 'Previous Month Low', 'đáy của tháng trước'],
    ['STH', 'Short-Term High', 'đỉnh ngắn hạn (swing nhỏ nhất)'],
    ['ITH', 'Intermediate-Term High', 'đỉnh trung hạn: đỉnh có đỉnh ngắn hạn thấp hơn ở hai bên'],
    ['LTH', 'Long-Term High', 'đỉnh dài hạn: đỉnh có đỉnh trung hạn thấp hơn ở hai bên'],
    ['HH', 'Higher High', 'đỉnh cao hơn đỉnh trước'],
    ['HL', 'Higher Low', 'đáy cao hơn đáy trước'],
    ['LH', 'Lower High', 'đỉnh thấp hơn đỉnh trước'],
    ['LL', 'Lower Low', 'đáy thấp hơn đáy trước'],
    ['PD', 'Premium / Discount', 'vùng đắt (trên 50%) và vùng rẻ (dưới 50%) của một khoảng giá'],
    ['EQ', 'Equilibrium', 'mức cân bằng 50% của một khoảng giá'],
    ['CE', 'Consequent Encroachment', 'mức 50% của một FVG'],
    ['SD', 'Standard Deviation', 'độ lệch chuẩn: dùng chiếu mục tiêu từ một range'],
    ['AMD', 'Accumulation – Manipulation – Distribution', 'ba pha: tích lũy, thao túng, phân phối'],
    ['CBDR', 'Central Bank Dealers Range', 'phạm vi giá khoảng 14:00–20:00 giờ New York'],
    ['IPDA', 'Interbank Price Delivery Algorithm', 'cách ICT mô tả thuật toán “giao giá” liên ngân hàng'],
    ['MMXM', 'Market Maker Model', 'mô hình nhà tạo lập: tích lũy → quét thanh khoản → đảo chiều'],
    ['MMBM', 'Market Maker Buy Model', 'mô hình nhà tạo lập chiều mua'],
    ['MMSM', 'Market Maker Sell Model', 'mô hình nhà tạo lập chiều bán'],
    ['NWOG', 'New Week Opening Gap', 'khoảng trống giá giữa đóng cửa thứ Sáu và mở cửa đầu tuần'],
    ['NDOG', 'New Day Opening Gap', 'khoảng trống giá giữa đóng cửa và mở cửa ngày mới'],
    ['VI', 'Volume Imbalance', 'khoảng hở giữa thân các nến liền kề (không hở râu)'],
    ['SMT', 'Smart Money Tool (SMT divergence)', 'phân kỳ giữa hai tài sản tương quan: một cái tạo đỉnh/đáy mới, cái kia thì không'],
    ['NY', 'New York', 'giờ thị trường New York (múi giờ ET)'],
    ['VN', 'Việt Nam', 'giờ Việt Nam (UTC+7)'],
    ['UTC', 'Coordinated Universal Time', 'giờ quốc tế chuẩn'],
    ['EDT', 'Eastern Daylight Time', 'giờ New York mùa hè (UTC−4)'],
    ['EST', 'Eastern Standard Time', 'giờ New York mùa đông (UTC−5)'],
    ['ATR', 'Average True Range', 'biên độ dao động trung bình mỗi nến (thường chu kỳ 14)'],
    ['VWAP', 'Volume Weighted Average Price', 'giá trung bình có trọng số theo khối lượng'],
    ['POC', 'Point of Control', 'mức giá có khối lượng giao dịch lớn nhất'],
    ['VAH', 'Value Area High', 'biên trên vùng giá trị (~70% khối lượng)'],
    ['VAL', 'Value Area Low', 'biên dưới vùng giá trị (~70% khối lượng)'],
    ['HVN', 'High Volume Node', 'vùng khối lượng cao: giá hay dừng/đi ngang'],
    ['LVN', 'Low Volume Node', 'vùng khối lượng thấp: giá hay đi xuyên nhanh'],
    ['EMA', 'Exponential Moving Average', 'đường trung bình động hàm mũ'],
    ['RSI', 'Relative Strength Index', 'chỉ số sức mạnh tương đối (0–100)'],
    ['SOS', 'Sign of Strength', 'tín hiệu mạnh lên (Wyckoff)'],
    ['SOW', 'Sign of Weakness', 'tín hiệu yếu đi (Wyckoff)'],
    ['LPS', 'Last Point of Support', 'điểm hỗ trợ cuối trước khi tăng (Wyckoff)'],
    ['MAE', 'Maximum Adverse Excursion', 'mức đi ngược lớn nhất của một lệnh trước khi kết thúc'],
    ['MFE', 'Maximum Favorable Excursion', 'mức đi thuận lớn nhất của một lệnh'],
    ['DXY', 'US Dollar Index', 'chỉ số đồng USD so với rổ tiền tệ'],
    ['USD', 'US Dollar', 'đô la Mỹ'],
    ['FOMC', 'Federal Open Market Committee', 'ủy ban thị trường mở của Fed, họp quyết định lãi suất'],
    ['CPI', 'Consumer Price Index', 'chỉ số giá tiêu dùng (lạm phát)'],
    ['NFP', 'Non-Farm Payrolls', 'bảng lương phi nông nghiệp Mỹ, công bố thứ Sáu đầu tháng'],
    ['GDP', 'Gross Domestic Product', 'tổng sản phẩm quốc nội'],
    ['ISM', 'Institute for Supply Management', 'tổ chức công bố chỉ số PMI sản xuất/dịch vụ của Mỹ'],
    ['TIPS', 'Treasury Inflation-Protected Securities', 'trái phiếu chống lạm phát; lợi suất TIPS là “lợi suất thực”'],
    ['COT', 'Commitments of Traders', 'báo cáo vị thế của các nhóm nhà đầu tư trên thị trường futures'],
    ['ETF', 'Exchange-Traded Fund', 'quỹ hoán đổi danh mục'],
    ['CFD', 'Contract for Difference', 'hợp đồng chênh lệch, cách phổ biến để giao dịch vàng đòn bẩy'],
    ['FOMO', 'Fear Of Missing Out', 'sợ bỏ lỡ nên vào lệnh vội'],
    ['NQ', 'Nasdaq 100 futures', 'hợp đồng tương lai chỉ số Nasdaq 100'],
    ['ES', 'S&P 500 futures', 'hợp đồng tương lai chỉ số S&P 500'],
    ['YM', 'Dow Jones futures', 'hợp đồng tương lai chỉ số Dow Jones'],
    ['XAUUSD', 'Gold / US Dollar', 'cặp vàng giao ngay so với USD']
  ];
  const map = {}; T.forEach((t) => { map[t[0]] = t; });
  const gl = {}; (ICT.glossary || []).forEach((g) => { gl[g[0]] = g[3]; });
  const keys = T.map((t) => t[0]).sort((a, b) => b.length - a.length);
  const RE = new RegExp('(^|[^A-Za-z0-9_#])(' + keys.join('|') + ')(?![A-Za-z0-9_])', 'g');
  const SKIP = /^(A|BUTTON|CODE|PRE|SVG|ICT-CHART|ICT-DIAGRAM|INPUT|TEXTAREA|SELECT|SCRIPT|STYLE|ABBR|H1|H2|H3|H4|TEXTAREA|OPTION)$/;
  const norm = (s) => String(s).toLowerCase();

  function annotate(root) {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !/[A-Z]{2}/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        for (let p = n.parentNode; p && p !== root; p = p.parentNode) {
          if (p.nodeType === 1 && (SKIP.test(p.tagName.toUpperCase()) || p.classList.contains('ab-x') || p.classList.contains('lnav') || p.classList.contains('meta') || p.classList.contains('crumb') || p.classList.contains('btns') || p.classList.contains('foot') || p.classList.contains('noab'))) return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => {
      const s = n.nodeValue; RE.lastIndex = 0;
      let m, last = 0, frag = null;
      while ((m = RE.exec(s))) {
        const k = m[2], at = m.index + m[1].length, end = at + k.length, t = map[k];
        if (!frag) frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(s.slice(last, at)));
        const a = document.createElement('abbr'); a.className = 'ab'; a.tabIndex = 0; a.dataset.k = k; a.textContent = k; a.setAttribute('role', 'button');
        a.setAttribute('aria-label', k + ': ' + t[1]);
        frag.appendChild(a);
        last = end;
      }
      if (frag) { frag.appendChild(document.createTextNode(s.slice(last))); n.parentNode.replaceChild(frag, n); }
    });
  }

  /* ---- Popover ---- */
  let pop = null, cur = null;
  function ensure() {
    if (pop) return pop;
    pop = document.createElement('div'); pop.id = 'abpop'; pop.setAttribute('role', 'tooltip'); pop.hidden = true; document.body.appendChild(pop);
    pop.addEventListener('click', (e) => { const a = e.target.closest('a[data-g]'); if (a) { e.preventDefault(); ICT.store.set('gq', a.dataset.g); hide(); location.hash = '#glossary'; } });
    return pop;
  }
  function show(a) {
    const k = a.dataset.k, t = map[k]; if (!t) return;
    const p = ensure(); cur = a;
    p.innerHTML = '<b>' + esc(k) + '</b> <i>' + esc(t[1]) + '</i><p>' + esc(t[2].charAt(0).toUpperCase() + t[2].slice(1)) + '.</p>' + (gl[k] ? '<p class="ab-d">' + esc(gl[k]) + '</p>' : '') + '<a href="#glossary" data-g="' + esc(k) + '">Xem trong Từ điển ICT →</a>';
    p.hidden = false; p.style.left = '0px'; p.style.top = '0px';
    const r = a.getBoundingClientRect(), w = p.offsetWidth, h = p.offsetHeight, vw = document.documentElement.clientWidth;
    let x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8), y = r.bottom + 8;
    if (y + h > window.innerHeight - 8 && r.top - h - 8 > 8) y = r.top - h - 8;
    p.style.left = x + 'px'; p.style.top = y + 'px';
  }
  function hide() { if (pop) pop.hidden = true; cur = null; }
  let wired = false;
  function wire() {
    if (wired) return; wired = true;
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('abbr.ab');
      if (a) { e.preventDefault(); if (cur === a && pop && !pop.hidden) hide(); else show(a); return; }
      if (pop && !pop.hidden && !e.target.closest('#abpop')) hide();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
      else if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('abbr.ab')) { e.preventDefault(); show(e.target); }
    });
    document.addEventListener('mouseover', (e) => { if (!window.matchMedia('(hover:hover)').matches) return; const a = e.target.closest && e.target.closest('abbr.ab'); if (a && a !== cur) show(a); });
    document.addEventListener('mouseout', (e) => { if (!window.matchMedia('(hover:hover)').matches) return; const a = e.target.closest && e.target.closest('abbr.ab'); if (a && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#abpop'))) hide(); });
    window.addEventListener('scroll', hide, { passive: true }); window.addEventListener('hashchange', hide);
  }

  /* Gọi sau khi dựng một trang; theo dõi thêm nội dung sinh sau (đáp án quiz). */
  ICT.annotate = function (root) {
    if (!root) return; wire(); annotate(root);
    const q = root.querySelector('#qz, #ex'); if (!q) return;
    let tm = 0; const mo = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(() => { mo.disconnect(); annotate(root); mo.observe(q, { childList: true, subtree: true }); }, 60); });
    mo.observe(q, { childList: true, subtree: true });
    ICT.live.push(() => { mo.disconnect(); clearTimeout(tm); hide(); });
  };
})();
