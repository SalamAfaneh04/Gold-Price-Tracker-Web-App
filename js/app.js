// ---- CONFIG ------------------------------------------------------------------------------------------------------------
var GOLD_API_KEY = 'goldapi-4cglcw2tl8goh-io'; // Replace with your key from gold-api.com
var GOLD_API_URL = 'https://api.gold-api.com/price/XAU';

// News: Using GNews API (get free key at gnews.io)
var NEWS_API_KEY = '548ead4bdaa9b54fd350e18da7512e23';
var NEWS_API_URL = 'https://gnews.io/api/v4/search?q=gold+XAU+price&lang=en&max=6&apikey=' + NEWS_API_KEY;

// Currency
var USD_TO_JOD = 0.709;

// Gold weights (grams)
var RASHADI_WEIGHT_G    = 6.494;  // gold content in grams (21.6K)
var ENGLISH_WEIGHT_G    = 7.322;  // gold content in grams (22K)
var TROY_OZ_TO_GRAM     = 31.1035;
var TOLA_TO_GRAM        = 11.6638;

// Bar sizes in grams
var BAR_SIZES = [
  { name: '1 gram',   weight: 1     },
  { name: '5 grams',  weight: 5     },
  { name: '10 grams', weight: 10    },
  { name: '50 grams', weight: 50    },
  { name: '100 grams',weight: 100   },
  { name: '250 grams',weight: 250   },
  { name: '500 grams',weight: 500   },
  { name: '1 kg',     weight: 1000  },
];

// ---- STATE ----------------------------------------------------------------------------------------------------------------
var currentCurrency = 'USD';
var currentOzPriceUSD = 0;
var chartData = { labels: [], usd: [], jod: [] };
var priceChart = null;

// ---- INIT ------------------------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
  fetchGoldPrice();
  loadChartData();
  loadNews();

  // Auto-refresh every 60 seconds
  setInterval(fetchGoldPrice, 60000);
  // News refreshes every 10 minutes
  setInterval(loadNews, 600000);

  // Mobile nav toggle
  var toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', function() {
      var links = document.querySelector('.nav-links');
      var auth  = document.querySelector('.nav-auth');
      if (links) links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
      if (auth)  auth.style.display  = auth.style.display  === 'flex' ? 'none' : 'flex';
    });
  }

  // Visual effects
  initSparkles();
  // Slight delay so buttons are fully rendered before attaching burst
  setTimeout(attachBurstToButtons, 500);

  // Set default chart date range to last 30 days
  var today = new Date();
  var from  = new Date();
  from.setDate(today.getDate() - 30);
  var toEl   = document.getElementById('chartDateTo');
  var fromEl = document.getElementById('chartDateFrom');
  if (toEl)   toEl.value   = today.toISOString().split('T')[0];
  if (fromEl) fromEl.value = from.toISOString().split('T')[0];
});

// ---- FETCH GOLD PRICE ------------------------------------------------------------------------------------------
function fetchGoldPrice() {
  fetch(GOLD_API_URL, {})
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.price) {
      var prevPrice = currentOzPriceUSD;
      currentOzPriceUSD = parseFloat(data.price);
      updateAllPrices(prevPrice);
      saveChartPoint(currentOzPriceUSD);
    }
  })
  .catch(function(err) {
    console.warn('Gold API error, using demo price:', err);
    // Demo fallback price
    var prevPrice = currentOzPriceUSD;
    currentOzPriceUSD = 3020 + (Math.random() * 20 - 10);
    updateAllPrices(prevPrice);
  });
}

// ---- CALCULATIONS ----------------------------------------------------------------------------------------------------
function getGramPrice24K(ozPriceUSD) {
  return ozPriceUSD / TROY_OZ_TO_GRAM;
}

function getKaratPrice(ozPriceUSD, karat) {
  var purity = karat / 24;
  return getGramPrice24K(ozPriceUSD) * purity;
}

function convertPrice(usdPrice) {
  if (currentCurrency === 'JOD') return usdPrice * USD_TO_JOD;
  return usdPrice;
}

function formatPrice(usdPrice, decimals) {
  decimals = decimals || 2;
  var p = convertPrice(usdPrice);
  var sym = currentCurrency === 'JOD' ? 'JD ' : '$';
  return sym + p.toFixed(decimals);
}

function formatOz(usdPrice) {
  return formatPrice(usdPrice, 2);
}

// ---- UPDATE ALL PRICES ------------------------------------------------------------------------------------------
function updateAllPrices(prevPrice) {
  var oz   = currentOzPriceUSD;
  var g24  = getGramPrice24K(oz);
  var g21  = getKaratPrice(oz, 21);
  var g18  = getKaratPrice(oz, 18);
  var rashadi = g24 * RASHADI_WEIGHT_G;
  var english = g24 * ENGLISH_WEIGHT_G;
  var bar1kg  = g24 * 1000;

  var now = new Date();
  var timeStr = 'Updated ' + now.toLocaleTimeString();

  // Direction indicator
  var dir = oz > prevPrice ? 'up' : oz < prevPrice ? 'down' : 'same';

  // ---- HOME PAGE ----
  setEl('priceUSD', '$' + oz.toFixed(2), dir);
  setEl('priceJOD', 'JD ' + (oz * USD_TO_JOD).toFixed(2), dir);
  setEl('priceTime', timeStr);

  setEl('rate24', formatPrice(g24));
  setEl('rate21', formatPrice(g21));
  setEl('rate18', formatPrice(getKaratPrice(oz, 18)));
  setEl('rateRashadi', formatPrice(rashadi));
  setEl('rateEnglish', formatPrice(english));
  setEl('rateBar', formatPrice(bar1kg, 0));

  // ---- PRICES PAGE ----
  // Ounce display
  var ozEl = document.getElementById('ozPrice');
  if (ozEl) ozEl.textContent = formatOz(oz);
  var ptEl = document.getElementById('pageTime');
  if (ptEl) ptEl.textContent = timeStr;

  // Karat big cards
  setEl('k24gram', formatPrice(g24));
  setEl('k21gram', formatPrice(g21));
  setEl('k18gram', formatPrice(getKaratPrice(oz, 18)));

  setEl('k24oz', formatOz(oz));
  setEl('k21oz', formatOz(oz * (21/24)));
  setEl('k18oz', formatOz(oz * (18/24)));

  setEl('k24tola', formatPrice(g24 * TOLA_TO_GRAM));
  setEl('k21tola', formatPrice(g21 * TOLA_TO_GRAM));
  setEl('k18tola', formatPrice(getKaratPrice(oz, 18) * TOLA_TO_GRAM));

  // Coin prices
  setEl('rashadiPrice', formatPrice(rashadi));
  setEl('englishPrice', formatPrice(english));

  // Build karat table
  buildKaratTable(oz);
  // Build bar table
  buildBarTable(oz);

  // Ticker
  buildTicker(oz, g24, g21, g18, rashadi, english);

  // Re-run calc if inputs filled
  calculate();
}

// ---- SET ELEMENT ------------------------------------------------------------------------------------------------------
function setEl(id, val, dir) {
  var el = document.getElementById(id);
  if (!el) return;
  var prev = el.textContent;
  el.textContent = val;
  if (dir === 'up' && prev !== val)   { el.classList.remove('price-down'); el.classList.add('price-up'); el.parentElement && el.parentElement.classList.add('flash-up'); }
  if (dir === 'down' && prev !== val) { el.classList.remove('price-up'); el.classList.add('price-down'); el.parentElement && el.parentElement.classList.add('flash-down'); }
}

// ---- BUILD KARAT TABLE ------------------------------------------------------------------------------------------
function buildKaratTable(oz) {
  var tbody = document.getElementById('karatTableBody');
  if (!tbody) return;
  var karats = [24, 22, 21, 18, 14, 12, 10, 9];
  var rows = karats.map(function(k) {
    var gPrice = getGramPrice24K(oz) * (k / 24);
    return '<tr>' +
      '<td class="bold">' + k + 'K</td>' +
      '<td>' + ((k/24)*100).toFixed(1) + '%</td>' +
      '<td class="bold">' + formatPrice(gPrice) + '</td>' +
      '<td>' + formatOz(oz * (k/24)) + '</td>' +
      '<td>' + formatPrice(gPrice * 10) + '</td>' +
      '<td>' + formatPrice(gPrice * 100) + '</td>' +
    '</tr>';
  });
  tbody.innerHTML = rows.join('');
}

// ---- BUILD BAR TABLE ----------------------------------------------------------------------------------------------
function buildBarTable(oz) {
  var tbody = document.getElementById('barTableBody');
  if (!tbody) return;
  var g24 = getGramPrice24K(oz);
  var rows = BAR_SIZES.map(function(bar) {
    return '<tr>' +
      '<td class="bold">' + bar.name + '</td>' +
      '<td>' + bar.weight + ' g</td>' +
      '<td class="bold">' + formatPrice(g24 * bar.weight, bar.weight >= 100 ? 0 : 2) + '</td>' +
    '</tr>';
  });
  tbody.innerHTML = rows.join('');
}

// ---- TICKER ----------------------------------------------------------------------------------------------------------------
function buildTicker(oz, g24, g21, g18, rashadi, english) {
  var items = [
    'XAU/USD: ' + formatOz(oz),
    '24K/g: ' + formatPrice(g24),
    '21K/g: ' + formatPrice(g21),
    '18K/g: ' + formatPrice(g18),
    'Rashadi: ' + formatPrice(rashadi),
    'English: ' + formatPrice(english),
    '1 kg Bar: ' + formatPrice(g24 * 1000, 0),
  ];
  // Duplicate for seamless loop
  var all = items.concat(items);
  var html = all.map(function(t) {
    return '<span class="ticker-item">🔶 ' + t + '</span>';
  }).join('');
  var track = document.getElementById('tickerTrack');
  if (track) track.innerHTML = html;
}

// ---- CURRENCY TOGGLE ----------------------------------------------------------------------------------------------
function setCurrency(cur) {
  currentCurrency = cur;

  // Sync all .toggle-btn elements by matching text content or id
  var btns = document.querySelectorAll('.toggle-btn');
  btns.forEach(function(b) {
    b.classList.remove('active');
    // Match by id (btnUSD, btnJOD, btnUSD2, btnJOD2) OR by text content
    if (b.id === 'btn' + cur || b.id === 'btn' + cur + '2') {
      b.classList.add('active');
    } else if (!b.id && b.textContent.trim() === cur) {
      b.classList.add('active');
    }
  });

  if (currentOzPriceUSD > 0) updateAllPrices(currentOzPriceUSD);
  updateChartCurrency();
}

// ---- CHART ------------------------------------------------------------------------------------------------------------------
function saveChartPoint(priceUSD) {
  var stored = localStorage.getItem('goldChartData');
  if (stored) chartData = JSON.parse(stored);

  var now = new Date();
  var label = now.getMonth() + 1 + '/' + now.getDate();

  // Keep last 30 data points max
  chartData.labels.push(label);
  chartData.usd.push(priceUSD.toFixed(2));
  chartData.jod.push((priceUSD * USD_TO_JOD).toFixed(2));

  if (chartData.labels.length > 60) {
    chartData.labels = chartData.labels.slice(-60);
    chartData.usd = chartData.usd.slice(-60);
    chartData.jod = chartData.jod.slice(-60);
  }

  localStorage.setItem('goldChartData', JSON.stringify(chartData));
  renderChart();
}

function loadChartData() {
  var stored = localStorage.getItem('goldChartData');
  if (stored) {
    chartData = JSON.parse(stored);
    renderChart();
  } else {
    // Generate placeholder 30-day history
    var base = 2950;
    for (var i = 30; i >= 1; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      chartData.labels.push((d.getMonth()+1) + '/' + d.getDate());
      var p = base + (Math.random() * 100 - 20);
      base = p;
      chartData.usd.push(p.toFixed(2));
      chartData.jod.push((p * USD_TO_JOD).toFixed(2));
    }
    renderChart();
  }
}

function renderChart() {
  var canvas = document.getElementById('priceChart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var isJOD = currentCurrency === 'JOD';
  var prices = isJOD ? chartData.jod : chartData.usd;
  var sym    = isJOD ? 'JD' : '$';

  var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(201,149,42,0.3)');
  gradient.addColorStop(1, 'rgba(201,149,42,0.0)');

  if (priceChart) {
    priceChart.data.labels = chartData.labels;
    priceChart.data.datasets[0].data = prices;
    priceChart.data.datasets[0].label = 'XAU (' + sym + ')';
    priceChart.update();
    return;
  }

  priceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: 'XAU (' + sym + ')',
        data: prices,
        borderColor: '#C9952A',
        borderWidth: 2.5,
        fill: true,
        backgroundColor: gradient,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#C9952A',
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(28,26,20,0.9)',
          titleColor: '#E8B84B',
          bodyColor: '#FBF6EC',
          borderColor: 'rgba(201,149,42,0.3)',
          borderWidth: 1,
          callbacks: {
            label: function(ctx) { return ' ' + sym + ' ' + parseFloat(ctx.raw).toFixed(2); }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(201,149,42,0.06)' },
          ticks: { color: '#7A7060', font: { size: 11 }, maxTicksLimit: 6 }
        },
        y: {
          grid: { color: 'rgba(201,149,42,0.06)' },
          ticks: {
            color: '#7A7060', font: { size: 11 },
            callback: function(v) { return sym + ' ' + v; }
          }
        }
      },
      interaction: { intersect: false, mode: 'index' }
    }
  });
}

function toggleChart(cur, btn) {
  var btns = document.querySelectorAll('.ctoggle');
  btns.forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  currentCurrency = cur;
  updateChartCurrency();
}

function updateChartCurrency() {
  if (!priceChart) return;
  var isJOD = currentCurrency === 'JOD';
  var prices = isJOD ? chartData.jod : chartData.usd;
  var sym = isJOD ? 'JD' : '$';
  priceChart.data.datasets[0].data = prices;
  priceChart.data.datasets[0].label = 'XAU (' + sym + ')';
  priceChart.options.scales.y.ticks.callback = function(v) { return sym + ' ' + v; };
  priceChart.update();
}

// ---- CHART DATE FILTER -----------------------------------------------------------------------------------------
function filterChartByDate() {
  var fromEl = document.getElementById('chartDateFrom');
  var toEl   = document.getElementById('chartDateTo');
  if (!fromEl || !toEl || !priceChart) return;

  var fromVal = fromEl.value;
  var toVal   = toEl.value;

  var stored = localStorage.getItem('goldChartData');
  var allData = stored ? JSON.parse(stored) : chartData;

  if (!fromVal && !toVal) {
    priceChart.data.labels = allData.labels;
    priceChart.data.datasets[0].data = currentCurrency === 'JOD' ? allData.jod : allData.usd;
    priceChart.update();
    return;
  }

  var filtered = { labels: [], usd: [], jod: [] };
  for (var i = 0; i < allData.labels.length; i++) {
    var label = allData.labels[i]; // format M/D
    // Parse label back to a comparable string
    var parts = label.split('/');
    if (parts.length === 2) {
      var year = new Date().getFullYear();
      var month = parseInt(parts[0]);
      var day   = parseInt(parts[1]);
      var pointDate = year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
      var keep = true;
      if (fromVal && pointDate < fromVal) keep = false;
      if (toVal   && pointDate > toVal)   keep = false;
      if (keep) {
        filtered.labels.push(label);
        filtered.usd.push(allData.usd[i]);
        filtered.jod.push(allData.jod[i]);
      }
    }
  }

  var isJOD = currentCurrency === 'JOD';
  var sym = isJOD ? 'JD' : '$';
  priceChart.data.labels = filtered.labels;
  priceChart.data.datasets[0].data = isJOD ? filtered.jod : filtered.usd;
  priceChart.data.datasets[0].label = 'XAU (' + sym + ')';
  priceChart.update();
}

function resetChartFilter() {
  var fromEl = document.getElementById('chartDateFrom');
  var toEl   = document.getElementById('chartDateTo');
  if (fromEl) fromEl.value = '';
  if (toEl)   toEl.value   = '';
  filterChartByDate();
}

// ---- FLOATING SPARKLES -----------------------------------------------------------------------------------------
function initSparkles() {
  var layer = document.getElementById('sparkleLayer');
  if (!layer) return;

  var symbols = ['◆', '✦', '⬡', '✧', '❖', '⬟'];
  var colors  = ['#C9952A', '#E8B84B', '#F5D98A', '#B18E62', '#ffd700'];

  for (var i = 0; i < 18; i++) {
    (function(idx) {
      var el = document.createElement('div');
      el.className = 'sparkle';
      var size  = 8 + Math.random() * 14;
      var left  = Math.random() * 100;
      var delay = Math.random() * 12;
      var dur   = 8 + Math.random() * 14;
      var color = colors[Math.floor(Math.random() * colors.length)];
      var sym   = symbols[Math.floor(Math.random() * symbols.length)];

      el.style.cssText = [
        'left:' + left + 'vw',
        'top:' + (90 + Math.random() * 20) + 'vh',
        'font-size:' + size + 'px',
        'color:' + color,
        'animation-duration:' + dur + 's',
        'animation-delay:' + delay + 's',
      ].join(';');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.borderRadius = '50%';
      el.style.background = 'transparent';
      el.textContent = sym;
      layer.appendChild(el);
    })(i);
  }
}

// ---- COIN EXPLOSION --------------------------------------------------------------------------------------------
function triggerCoinBurst(event) {
  var burst = document.getElementById('coinBurst');
  if (!burst) return;

  var x = event ? event.clientX : window.innerWidth / 2;
  var y = event ? event.clientY : window.innerHeight / 2;

  burst.style.left = x + 'px';
  burst.style.top  = y + 'px';

  var coinSyms = ['🪙', '💰', '⬡', '✦', '◆'];
  var count = 10;

  for (var i = 0; i < count; i++) {
    (function(idx) {
      var coin = document.createElement('div');
      coin.className = 'burst-coin';

      var angle  = (idx / count) * 360 + (Math.random() * 36 - 18);
      var dist   = 50 + Math.random() * 80;
      var rad    = angle * Math.PI / 180;
      var tx     = Math.cos(rad) * dist;
      var ty     = Math.sin(rad) * dist;
      var rot    = (Math.random() * 360 - 180) + 'deg';
      var sym    = coinSyms[Math.floor(Math.random() * coinSyms.length)];

      coin.style.setProperty('--tx', tx + 'px');
      coin.style.setProperty('--ty', ty + 'px');
      coin.style.setProperty('--tr', rot);
      coin.textContent = sym;

      burst.appendChild(coin);

      setTimeout(function() { coin.remove(); }, 950);
    })(i);
  }
}

function attachBurstToButtons() {
  var btns = document.querySelectorAll('.btn-gold, .btn-gold-lg, .toggle-btn, .ctoggle, .btn-ghost');
  btns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      triggerCoinBurst(e);
    });
  });
}

// ---- CALCULATOR --------------------------------------------------------------------------------------------------------
function calculate() {
  var weightEl = document.getElementById('calcWeight');
  var karatEl  = document.getElementById('calcKarat');
  var resultEl = document.getElementById('calcResult');
  if (!weightEl || !karatEl || !resultEl) return;

  var weight = parseFloat(weightEl.value);
  var karat  = parseInt(karatEl.value);

  if (!weight || weight <= 0) {
    resultEl.textContent = 'Enter weight and karat to calculate value';
    return;
  }

  var gramPrice = getKaratPrice(currentOzPriceUSD, karat);
  var total = gramPrice * weight;
  var sym = currentCurrency === 'JOD' ? 'JD' : '$';
  var converted = convertPrice(total);

  resultEl.innerHTML =
    weight + 'g of ' + karat + 'K gold = ' +
    '<strong style="color:var(--gold)">' + sym + ' ' + converted.toFixed(2) + '</strong>' +
    ' &nbsp;·&nbsp; ' +
    '<small style="color:var(--muted)">' + sym + ' ' + convertPrice(gramPrice).toFixed(2) + '/g</small>';
}

// ---- NEWS --------------------------------------------------------------------------------------------------------------------
function loadNews() {
  var grid = document.getElementById('newsGrid');
  if (!grid) return;

  fetch(NEWS_API_URL)
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data && data.articles && data.articles.length) {
      renderNews(data.articles.slice(0, 3));
    } else {
      renderFallbackNews();
    }
  })
  .catch(function() {
    renderFallbackNews();
  });
}

function renderNews(articles) {
  var grid = document.getElementById('newsGrid');
  if (!grid) return;
  var html = articles.map(function(a) {
    var date = a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    var imgHtml = a.image
      ? '<img src="' + a.image + '" alt="" class="news-img" onerror="this.style.display=\'none\'">'
      : '<div class="news-img"></div>';
    return '<a href="' + (a.url || '#') + '" class="news-card" target="_blank" rel="noopener">' +
      imgHtml +
      '<div class="news-body">' +
        '<div class="news-source">' + (a.source && a.source.name ? a.source.name : 'Market News') + '</div>' +
        '<div class="news-headline">' + (a.title || 'Gold Market Update') + '</div>' +
        '<div class="news-date">' + date + '</div>' +
      '</div>' +
    '</a>';
  }).join('');
  grid.innerHTML = html;
}

function renderFallbackNews() {
  var grid = document.getElementById('newsGrid');
  if (!grid) return;
  var fallback = [
    { title: 'Gold prices hold near record highs as dollar weakens against major currencies', source: 'Reuters', date: 'Mar 31, 2026' },
    { title: 'Central bank gold purchases reach five-year high in Q1 2026, boosting demand outlook', source: 'Bloomberg', date: 'Mar 30, 2026' },
    { title: 'XAU/USD technical analysis: Bulls maintain control above key support at $3,000/oz', source: 'FXStreet', date: 'Mar 29, 2026' },
  ];
  var html = fallback.map(function(n) {
    return '<div class="news-card" style="cursor:default">' +
      '<div class="news-img" style="display:flex;align-items:center;justify-content:center;font-size:2.5rem"><img src="../assets/images/old-news.png" alt="News" class="news-img"></div>' +
      '<div class="news-body">' +
        '<div class="news-source">' + n.source + '</div>' +
        '<div class="news-headline">' + n.title + '</div>' +
        '<div class="news-date">' + n.date + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  grid.innerHTML = html;
}
