/* ICT Hub — Tin tức & lịch kinh tế (widget TradingView chính thức), biểu đồ XAUUSD trực tiếp, trang tham khảo */
(function () {
  'use strict';
  const ICT = window.ICT, esc = ICT.esc, pad = ICT.pad;
  const $ = (s, r) => (r || document).querySelector(s);
  const theme = () => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const A = (href, t) => '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + t + '</a>';

  /* ---- gắn widget TradingView; nếu bị chặn/offline thì hiện liên kết thay thế ---- */
  function tv(box, name, cfg, link) {
    box.innerHTML = '<div class="tvwait muted">Đang tải widget TradingView…</div>';
    const wrap = document.createElement('div'); wrap.className = 'tradingview-widget-container';
    const inner = document.createElement('div'); inner.className = 'tradingview-widget-container__widget'; wrap.appendChild(inner);
    const sc = document.createElement('script'); sc.async = true; sc.src = 'https://s3.tradingview.com/external-embedding/embed-widget-' + name + '.js'; sc.text = JSON.stringify(cfg);
    const fail = () => { if (!box.isConnected || box.querySelector('iframe')) return; box.innerHTML = '<div class="tvfail"><b>Không tải được widget trực tiếp.</b><p class="muted">Widget cần internet và một trang không chặn script bên ngoài (ví dụ khi mở file trên máy hoặc trên web riêng). Bạn vẫn có thể mở nguồn trong tab mới:</p><a class="btn pri" href="' + link + '" target="_blank" rel="noopener noreferrer">Mở nguồn trực tiếp ↗</a></div>'; };
    sc.onerror = fail; wrap.appendChild(sc);
    const cp = document.createElement('div'); cp.className = 'tradingview-widget-copyright'; cp.innerHTML = A('https://www.tradingview.com/', 'Dữ liệu &amp; widget bởi TradingView'); wrap.appendChild(cp);
    box.appendChild(wrap);
    const t = setTimeout(fail, 9000); ICT.live.push(() => clearTimeout(t));
    const rm = () => { const w = box.querySelector('.tvwait'); if (w && box.querySelector('iframe')) w.remove(); }; const t2 = setInterval(rm, 800); ICT.live.push(() => clearInterval(t2));
  }

  /* ---- đếm ngược tới mốc tin kế tiếp (08:30 và 14:00 giờ NY) ---- */
  function nextNY(h, mi, now) {
    const T = ICT.tz, fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [y, mo, d] = fmt.format(now).split('-').map(Number);
    for (let k = 0; k < 9; k++) {
      const u = T.nyToUtc(y, mo - 1, d + k, h, mi), wd = new Date(Date.UTC(y, mo - 1, d + k)).getUTCDay();
      if (wd !== 0 && wd !== 6 && u > now.getTime()) return u;
    }
    return null;
  }
  function countdown(el) {
    const tick = () => {
      const now = new Date(); let h = '';
      [['Dữ liệu Mỹ (08:30 NY)', 8, 30], ['FOMC / biên bản (14:00 NY)', 14, 0]].forEach(([n, hh, mm]) => {
        const u = nextNY(hh, mm, now); if (!u) return; let s = Math.max(0, Math.floor((u - now.getTime()) / 1000));
        const dd = Math.floor(s / 86400); s -= dd * 86400; const hr = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60;
        const vn = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(u));
        h += '<div class="clock"><span>' + n + '</span><b>' + (dd ? dd + 'd ' : '') + pad(hr) + ':' + pad(mi) + ':' + pad(se) + '</b><span>Giờ VN: ' + vn + '</span></div>';
      });
      el.innerHTML = h;
    };
    tick(); const id = setInterval(tick, 1000); ICT.live.push(() => clearInterval(id));
  }

  ICT.newsPage = function (view) {
    const th = theme(), st = ICT.store;
    view.innerHTML = '<div class="page wide"><div class="crumb">Tin tức</div><h1>Tin tức &amp; lịch kinh tế cho vàng</h1><p class="lead">Cập nhật trực tiếp tình hình XAUUSD, lịch CPI/NFP/FOMC và tin tức. Phần cập nhật do widget TradingView cung cấp (cần internet); đồng hồ đếm ngược chạy ngay trên máy bạn.</p>' +
      '<div id="nb"></div><h2>Giá trực tiếp: chứng khoán, hàng hóa, ngoại tệ</h2><div class="tvbox" id="tvm" style="min-height:470px"></div><h2>Đếm ngược mốc tin kế tiếp</h2><div class="clocks" id="cd"></div>' +
      '<div class="cols"><div><h4>Giá vàng trực tiếp</h4><div class="tvbox" id="tvq" style="min-height:230px"></div></div><div><h4>Gợi ý đọc nhanh</h4><p>Trước mỗi tin đỏ, ghi giờ vào kế hoạch ngày. Quanh 08:30 NY (19:30–20:30 giờ VN) spread mở rộng và giá hay quét hai chiều — xem bài <a href="#m10l5">Giao dịch quanh tin tức</a>.</p><p>Xu hướng chung (không phải quy luật): số liệu lạm phát/việc làm <b>mạnh hơn dự báo</b> thường làm USD và lợi suất tăng, gây áp lực lên vàng; <b>yếu hơn</b> thường hỗ trợ vàng. Tâm lý trú ẩn an toàn có thể đảo ngược phản ứng này.</p></div></div>' +
      '<h2>Lịch kinh tế (Mỹ, mức độ trung bình–cao)</h2><div class="tvbox" id="tve" style="min-height:420px"></div>' +
      '<h2>Tin tức về vàng</h2><div class="tvbox" id="tvn" style="min-height:420px"></div>' +
      '<h2>Các báo cáo ảnh hưởng mạnh tới vàng</h2><div class="tblw"><table><tr><th>Báo cáo</th><th>Tần suất</th><th>Giờ NY</th><th>Giờ VN (NY đông / hè)</th><th>Ghi chú</th></tr>' +
      [['CPI — Chỉ số giá tiêu dùng', 'Hàng tháng', '08:30', '20:30 / 19:30', 'Quan trọng nhất về lạm phát; xem Core MoM và so với dự báo'],
       ['NFP — Bảng lương phi nông nghiệp', 'Thường thứ Sáu đầu tháng', '08:30', '20:30 / 19:30', 'Biến động rất mạnh; kèm tỷ lệ thất nghiệp và lương theo giờ'],
       ['FOMC — Quyết định lãi suất', '8 kỳ/năm', '14:00 (họp báo 14:30)', '02:00 / 01:00 (+1 ngày)', 'Thông điệp và dot plot quan trọng ngang quyết định'],
       ['PCE — Lạm phát ưa thích của Fed', 'Hàng tháng', '08:30', '20:30 / 19:30', 'Ảnh hưởng kỳ vọng lãi suất'],
       ['PPI — Giá sản xuất', 'Hàng tháng', '08:30', '20:30 / 19:30', 'Báo hiệu sớm áp lực lạm phát'],
       ['Bán lẻ, GDP', 'Hàng tháng / quý', '08:30', '20:30 / 19:30', 'Sức khỏe kinh tế'],
       ['Đơn xin trợ cấp thất nghiệp', 'Thứ Năm hàng tuần', '08:30', '20:30 / 19:30', 'Mức ảnh hưởng thấp–trung bình'],
       ['ISM PMI, JOLTS', 'Hàng tháng', '10:00', '22:00 / 21:00', 'Thường tạo nhịp trong NY AM'],
       ['Biên bản FOMC', 'Khoảng 3 tuần sau mỗi kỳ họp', '14:00', '02:00 / 01:00 (+1 ngày)', 'Tìm manh mối về hướng lãi suất']].map((r) => '<tr>' + r.map((c, i) => '<td>' + (i === 0 ? '<b>' + c + '</b>' : c) + '</td>').join('') + '</tr>').join('') + '</table></div>' +
      '<h2>Cách đọc nhanh báo cáo CPI</h2><ol><li><b>Core CPI MoM</b> (loại thực phẩm và năng lượng, so với tháng trước) thường được thị trường chú ý nhất.</li><li>So sánh <b>thực tế – dự báo (consensus) – kỳ trước</b>. Chính độ <i>bất ngờ</i> so với dự báo mới làm giá chạy, không phải con số tuyệt đối.</li><li>Xem cả <b>YoY</b> và số liệu điều chỉnh của kỳ trước.</li><li>Giá thường chạy hai chiều trong vài giây–vài phút đầu. Với trader ICT, đó là nhịp <b>quét thanh khoản</b>; chờ MSS và displacement rồi mới tính chuyện vào lệnh, hoặc đứng ngoài.</li></ol>' +
      '<div class="callout hist"><p>Lịch BLS dự kiến công bố CPI tháng 11/2026 vào <b>10/12/2026 lúc 08:30 giờ ET</b> (theo ' + A('https://www.bls.gov/schedule/news_release/cpi.htm', 'lịch chính thức của BLS') + '). Ngày giờ có thể thay đổi — luôn kiểm tra lại ở nguồn chính thức: ' + A('https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm', 'lịch FOMC của Fed') + ' và ' + A('https://www.tradingview.com/economic-calendar/', 'lịch kinh tế TradingView') + '.</p></div>' +
      '<h2>Ghi chú tin tức của tôi</h2><div class="fld"><textarea id="nn" placeholder="Ví dụ: CPI 08:30 NY — dự báo core 0,3%, ... Kế hoạch: đứng ngoài 15 phút trước/sau." aria-label="Ghi chú tin tức">' + esc(st.get('newsnote', '')) + '</textarea></div></div>';
    $('#nn', view).addEventListener('input', (e) => st.set('newsnote', e.target.value));
    if (ICT.newsBoard) ICT.newsBoard($('#nb', view));
    tv($('#tvm', view), 'market-overview', { colorTheme: th, dateRange: '1D', showChart: false, locale: 'vi_VN', width: '100%', height: '470', isTransparent: false, showSymbolLogo: false, showFloatingTooltip: false, tabs: [{ title: 'Chứng khoán', symbols: [{ s: 'FOREXCOM:SPXUSD', d: 'S&P 500' }, { s: 'FOREXCOM:NSXUSD', d: 'Nasdaq 100' }, { s: 'FOREXCOM:DJI', d: 'Dow Jones' }, { s: 'TVC:DXY', d: 'Chỉ số USD' }, { s: 'TVC:US10Y', d: 'Lợi suất 10 năm Mỹ' }] }, { title: 'Kim loại & dầu', symbols: [{ s: 'OANDA:XAUUSD', d: 'Vàng' }, { s: 'OANDA:XAGUSD', d: 'Bạc' }, { s: 'TVC:USOIL', d: 'Dầu WTI' }, { s: 'OANDA:XCUUSD', d: 'Đồng' }] }, { title: 'Ngoại tệ', symbols: [{ s: 'FX:EURUSD' }, { s: 'FX:GBPUSD' }, { s: 'FX:USDJPY' }, { s: 'FX:USDCHF' }, { s: 'FX:AUDUSD' }, { s: 'FX:USDCAD' }] }] }, 'https://www.tradingview.com/markets/');
    countdown($('#cd', view));
    tv($('#tvq', view), 'mini-symbol-overview', { symbol: 'OANDA:XAUUSD', width: '100%', height: '220', locale: 'vi_VN', dateRange: '1D', colorTheme: th, isTransparent: false, autosize: false, largeChartUrl: '' }, 'https://www.tradingview.com/symbols/XAUUSD/');
    tv($('#tve', view), 'events', { colorTheme: th, isTransparent: false, width: '100%', height: '420', locale: 'vi_VN', importanceFilter: '0,1', countryFilter: 'us' }, 'https://www.tradingview.com/economic-calendar/');
    tv($('#tvn', view), 'timeline', { feedMode: 'symbol', symbol: 'OANDA:XAUUSD', colorTheme: th, isTransparent: false, displayMode: 'regular', width: '100%', height: '420', locale: 'vi_VN' }, 'https://www.tradingview.com/symbols/XAUUSD/news/');
  };

  ICT.tvEmbed = tv;
  ICT.livePage = function (view) {
    view.innerHTML = '<div class="page wide"><div class="crumb">Thực hành</div><h1>Biểu đồ XAUUSD trực tiếp</h1><p class="lead">Biểu đồ thật của vàng (múi giờ New York) để áp dụng những gì đã học: đánh dấu swing, thanh khoản, FVG, OB trên nến thật. Widget của TradingView; cần internet.</p><div class="tvbox" id="tvc" style="min-height:540px"></div><div class="callout tip"><p>Quy trình gợi ý: (1) khung 4H/1H đánh dấu cấu trúc và thanh khoản; (2) khung 15m/5m tìm quét + MSS trong killzone; (3) ghi lại bạn <b>sẽ</b> làm gì, rồi xem giá chạy tiếp. Để luyện từng nến trên dữ liệu thật, dùng ' + A('https://www.tradingview.com/support/solutions/43000712747-bar-replay-how-and-why-to-test-a-strategy-in-the-past/', 'Bar Replay của TradingView') + ', hoặc xuất dữ liệu rồi nạp vào <a href="#replay">Replay Lab</a> (mục "Dữ liệu thật của bạn").</p></div></div>';
    tv($('#tvc', view), 'advanced-chart', { autosize: false, width: '100%', height: '520', symbol: 'OANDA:XAUUSD', interval: '15', timezone: 'America/New_York', theme: theme(), style: '1', locale: 'vi_VN', allow_symbol_change: false, withdateranges: true, hide_side_toolbar: false, save_image: true, support_host: 'https://www.tradingview.com' }, 'https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD');
  };

  ICT.refsPage = function (view) {
    const G = (t, items) => '<h2>' + t + '</h2><div class="cards">' + items.map((i) => '<a class="card" href="' + i[1] + '" target="_blank" rel="noopener noreferrer"><span class="tagc o">↗ ' + i[2] + '</span><h3>' + i[0] + '</h3><p>' + i[3] + '</p></a>').join('') + '</div>';
    view.innerHTML = '<div class="page wide"><div class="crumb">Tham khảo</div><h1>Nguồn &amp; tài liệu tham khảo</h1><p class="lead">Các nguồn bên ngoài để xem thêm hình ảnh, ví dụ và mẫu nến trên thị trường thật. Kênh này không sao chép biểu đồ hay hình của bên thứ ba; thay vào đó nhúng widget chính thức, liên kết nguồn và cho phép bạn nạp dữ liệu của chính mình.</p>' +
      G('Nguồn gốc ICT', [['The Inner Circle Trader — YouTube', 'https://www.youtube.com/@InnerCircleTrader', 'YouTube', 'Kênh chính thức của Michael J. Huddleston: các bài giảng mentorship miễn phí.']]) +
      G('Biểu đồ & ví dụ thực tế (vàng)', [['Ý tưởng giao dịch vàng trên TradingView', 'https://www.tradingview.com/symbols/SPOTGOLD/ideas/', 'TradingView', 'Biểu đồ do cộng đồng đăng. Chỉ là ý kiến cá nhân; dùng để xem cách người khác đánh dấu FVG/OB.'], ['Bar Replay của TradingView', 'https://www.tradingview.com/support/solutions/43000712747-bar-replay-how-and-why-to-test-a-strategy-in-the-past/', 'Hướng dẫn', 'Luyện từng nến trên dữ liệu lịch sử thật. Độ sâu dữ liệu phụ thuộc gói tài khoản.'], ['Biểu đồ XAUUSD trực tiếp (trong kênh)', '#live', 'Trong kênh', 'Widget TradingView múi giờ New York.']]) +
      G('Tin tức & lịch kinh tế', [['Lịch phát hành CPI — BLS', 'https://www.bls.gov/schedule/news_release/cpi.htm', 'Chính thức', 'Ngày giờ công bố CPI do Cục Thống kê Lao động Mỹ ấn định.'], ['Lịch họp FOMC — Federal Reserve', 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm', 'Chính thức', 'Các kỳ họp và ngày công bố biên bản.'], ['Lịch kinh tế — TradingView', 'https://www.tradingview.com/economic-calendar/', 'TradingView', 'Lọc theo quốc gia và mức độ quan trọng.'], ['Lịch kinh tế — Forex Factory', 'https://www.forexfactory.com/calendar', 'Forex Factory', 'Lịch phổ biến trong cộng đồng giao dịch.'], ['Lịch kinh tế — Investing.com', 'https://www.investing.com/economic-calendar/', 'Investing.com', 'Dự báo, kết quả và biên độ ảnh hưởng.']]) +
      G('Dữ liệu giá vàng', [['Giá vàng — World Gold Council', 'https://www.gold.org/goldhub/data/gold-prices', 'WGC', 'Dữ liệu giá vàng lịch sử từ Hội đồng Vàng Thế giới.'], ['Giá vàng — Trading Economics', 'https://tradingeconomics.com/commodity/gold', 'Trading Economics', 'Giá và biểu đồ vàng giao ngay.']]) +
      '<h2>Xuất dữ liệu nến để replay trong kênh</h2><ul><li><b>TradingView:</b> menu biểu đồ → Export chart data (tính năng có thể yêu cầu gói trả phí). File CSV có cột time, open, high, low, close.</li><li><b>MetaTrader 5:</b> View → Symbols → Bars → Request → Export Bars (CSV).</li><li>Sau đó mở <a href="#replay">Replay Lab</a> → "Dữ liệu thật của bạn", chọn file hoặc dán nội dung CSV. Dữ liệu chỉ xử lý trong trình duyệt của bạn.</li></ul>' +
      '<h2>Nghiên cứu</h2><ul><li>Osler, C. (2003). <i>Currency Orders and Exchange Rate Dynamics: An Explanation for the Predictive Success of Technical Analysis.</i> Journal of Finance — ghi nhận stop-loss/lệnh chờ tập trung ở các mức giá rõ ràng.</li></ul>' +
      '<div class="callout hist"><p>Liên kết dẫn tới trang của bên thứ ba; nội dung và điều khoản thuộc về họ. Kênh không liên kết hay được các bên đó xác nhận.</p></div></div>';
  };
})();
