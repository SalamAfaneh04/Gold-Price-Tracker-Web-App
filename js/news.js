// News: Using GNews API
// IDEAS TO NOT HARDCODE: 
// 1. Fetch from a secure backend endpoint where the key is stored securely.
// 2. Use a build pipeline (e.g. Webpack/Vite) with an .env file for environment variables.
var NEWS_API_KEY = '4607e42e4f5637b49a3af563e17e42b2';
var NEWS_API_URL = 'https://gnews.io/api/v4/search?q=gold+price+OR+gold+market+OR+gold+forecast&lang=en&max=9&apikey=' + NEWS_API_KEY;

// ---- NEWS CAROUSEL -----------------------------------------------------------------------------------------------------------
var newsCarouselIndex = 0;
var newsArticlesData = []; // Store full article data for modal

async function loadNews() {
  var grid = document.getElementById('newsGrid');
  if (!grid) return;

  var savedNewsStr = localStorage.getItem('savedGoldNewsV3');
  var savedNewsTime = localStorage.getItem('savedGoldNewsTimeV3');
  var now = new Date().getTime();

  // 1. Try Cache First
  if (savedNewsStr && savedNewsTime && (now - parseInt(savedNewsTime)) < 3600000) {
    try {
      var cachedData = JSON.parse(savedNewsStr);
      if (cachedData && cachedData.articles && cachedData.articles.length > 0) {
        console.log("Loading news from cache...");
        renderNews(cachedData.articles);
        return;
      }
    } catch (e) {
      console.warn("Failed to parse cached news, clearing storage.", e);
      localStorage.removeItem('savedGoldNewsV3');
      localStorage.removeItem('savedGoldNewsTimeV3');
    }
  }

  // 2. Try Fetch with Timeout
  var isGitHubPages = window.location.hostname.includes('github.io');
  console.log("Fetching live news from GNews... (Production Mode: " + isGitHubPages + ")");

  try {
    // If on GitHub Pages, we know GNews often blocks CORS. 
    // We'll still try, but with a shorter timeout to show fallbacks faster.
    const controller = new AbortController();
    const timeoutThreshold = isGitHubPages ? 4000 : 8000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutThreshold);

    const res = await fetch(NEWS_API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn("News API response error:", res.status, res.statusText);
      throw new Error('News API response not OK: ' + res.status);
    }
    
    const data = await res.json();
    if (data && data.articles && data.articles.length > 0) {
      console.log("Live news fetched successfully. Count:", data.articles.length);
      localStorage.setItem('savedGoldNewsV3', JSON.stringify(data));
      localStorage.setItem('savedGoldNewsTimeV3', now.toString());
      renderNews(data.articles);
    } else {
      console.warn("News API returned zero articles. Triggering fallback.");
      renderFallbackNews();
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn("News fetch timed out (" + (isGitHubPages ? 'Production' : 'Local') + "). Triggering fallback.");
    } else {
      console.warn("Error fetching news from API (likely CORS on Deployment):", error);
    }
    renderFallbackNews();
  }
}

function renderNews(articles) {
  try {
    var grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (!articles || !Array.isArray(articles)) {
      throw new Error("Invalid articles data");
    }

    // Store full article data for modal
    newsArticlesData = articles.map(function (a) {
      var dateObj = a.publishedAt ? new Date(a.publishedAt) : null;
      var isValidDate = dateObj && !isNaN(dateObj.getTime());
      
      return {
        title: a.title || 'Gold Market Update',
        description: a.description || '',
        content: a.content || '',
        image: a.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=500&auto=format&fit=crop',
        url: a.url || '#',
        source: (a.source && a.source.name) ? a.source.name : 'Market News',
        date: isValidDate ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '',
        dateShort: isValidDate ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
      };
    });

    var html = newsArticlesData.map(function (a, i) {
      return '<div class="news-card" onclick="openNewsModal(' + i + ')">' +
        '<div class="news-card-inner">' +
        '<div class="news-img-container">' + 
        '<img src="' + a.image + '" alt="" class="news-img" onerror="this.src=\'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=500&auto=format&fit=crop\'">' +
        '</div>' +
        '<div class="news-body">' +
        '<div class="news-source">' + a.source + '</div>' +
        '<div class="news-headline">' + a.title + '</div>' +
        '<div class="news-date">' + a.dateShort + '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');
    
    grid.innerHTML = html;
    updateCardSizes();
    newsCarouselIndex = 0;
    updateNewsCarousel();
    initNewsArrows();
  } catch (err) {
    console.error("Critical error in renderNews, falling back:", err);
    renderFallbackNews();
  }
}

function renderFallbackNews() {
  try {
    var grid = document.getElementById('newsGrid');
    if (!grid) return;

    // Use high-quality placeholder images from Unsplash to avoid local pathing issues on deployment
    var fallbackImg = "https://images.unsplash.com/photo-1610375461246-83df859d849d?q=80&w=800&auto=format&fit=crop";

    newsArticlesData = [
      {
        title: 'Gold prices hold near record highs as dollar weakens against major currencies',
        description: 'Gold prices remained near record levels on Friday as the U.S. dollar continued its descent against a basket of major currencies.',
        content: 'Spot gold was trading at $3,085.20 per ounce, just shy of the all-time high of $3,102 set earlier this week.',
        image: fallbackImg,
        url: '#',
        source: 'Reuters',
        date: 'Monday, March 31, 2026',
        dateShort: 'Mar 31, 2026'
      },
      {
        title: 'Central bank gold purchases reach five-year high in Q1 2026',
        description: 'Central banks around the world bought a combined 290 tonnes of gold in the first quarter of 2026.',
        image: fallbackImg,
        url: '#',
        source: 'Bloomberg',
        date: 'Sunday, March 30, 2026',
        dateShort: 'Mar 30, 2026'
      },
      {
        title: 'XAU/USD technical analysis: Bulls maintain control above $3,000/oz',
        description: 'Gold\'s technical picture remains strongly bullish as prices consolidate above the psychological $3,000 level.',
        image: fallbackImg,
        url: '#',
        source: 'FXStreet',
        date: 'Saturday, March 29, 2026',
        dateShort: 'Mar 29, 2026'
      },
      {
        title: 'Gold ETF inflows surge amid market volatility',
        description: 'Exchange-traded funds backed by gold saw their largest monthly inflows in over three years.',
        image: fallbackImg,
        url: '#',
        source: 'CNBC',
        date: 'Friday, March 28, 2026',
        dateShort: 'Mar 28, 2026'
      }
    ];

    var html = newsArticlesData.map(function (n, i) {
      return '<div class="news-card" onclick="openNewsModal(' + i + ')">' +
        '<div class="news-card-inner">' +
        '<div class="news-img-container"><img src="' + n.image + '" alt="News" class="news-img"></div>' +
        '<div class="news-body">' +
        '<div class="news-source">' + n.source + '</div>' +
        '<div class="news-headline">' + n.title + '</div>' +
        '<div class="news-date">' + n.dateShort + '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');
    
    grid.innerHTML = html;
    updateCardSizes();
    newsCarouselIndex = 0;
    updateNewsCarousel();
    initNewsArrows();
  } catch (err) {
    console.error("Total failure in news rendering:", err);
    if (grid) grid.innerHTML = '<p style="color:var(--gold);padding:20px;text-align:center;">Latest news currently unavailable. Please check back later.</p>';
  }
}

// ── News Modal ──────────────────────────────────────────────

var globalNewsModalInstance = null;

function openNewsModal(index) {
  var article = newsArticlesData[index];
  if (!article) return;

  var modalEl = document.getElementById('newsModal');
  if (!modalEl) return;

  if (!globalNewsModalInstance) {
    globalNewsModalInstance = new bootstrap.Modal(modalEl);
  }

  var imgEl = document.getElementById('newsModalImg');
  imgEl.src = article.image || '';
  imgEl.style.display = article.image ? '' : 'none';
  document.getElementById('newsModalSource').textContent = article.source;
  document.getElementById('newsModalDate').textContent = article.date;
  document.getElementById('newsModalTitle').textContent = article.title;
  document.getElementById('newsModalDesc').textContent = article.description;

  var linkEl = document.getElementById('newsModalLink');
  if (article.url && article.url !== '#') {
    linkEl.href = article.url;
    linkEl.style.display = 'inline-block';
  } else {
    linkEl.style.display = 'none';
  }

  globalNewsModalInstance.show();
}

// ── Carousel Navigation ─────────────────────────────────────

function getVisibleNewsCount() {
  return window.innerWidth <= 768 ? 1 : 3;
}

function updateCardSizes() {
  var viewport = document.querySelector('.news-viewport');
  var cards = document.querySelectorAll('.news-card, .news-skeleton');
  if (!viewport || !cards.length) return;

  var visible = getVisibleNewsCount();
  var cardWidth = viewport.offsetWidth / visible;

  cards.forEach(function (card) {
    card.style.width = cardWidth + 'px';
    card.style.minWidth = cardWidth + 'px';
    card.style.maxWidth = cardWidth + 'px';
  });
}

function getCardSlideWidth() {
  var viewport = document.querySelector('.news-viewport');
  if (!viewport) return 300;
  var vpWidth = viewport.offsetWidth;
  var visible = getVisibleNewsCount();
  // gap is 0, cards use internal padding; each card = vpWidth / visible
  return vpWidth / visible;
}

function getMaxNewsIndex() {
  var grid = document.getElementById('newsGrid');
  if (!grid) return 0;
  var total = grid.children.length;
  var visible = getVisibleNewsCount();
  return Math.max(0, total - visible);
}

function updateNewsCarousel() {
  var grid = document.getElementById('newsGrid');
  if (!grid) return;
  var slideWidth = getCardSlideWidth();
  var offset = newsCarouselIndex * slideWidth;
  grid.style.transform = 'translateX(-' + offset + 'px)';

  // Update arrow states
  var leftBtn = document.getElementById('newsArrowLeft');
  var rightBtn = document.getElementById('newsArrowRight');
  if (leftBtn) {
    leftBtn.style.opacity = newsCarouselIndex <= 0 ? '0.35' : '1';
    leftBtn.style.pointerEvents = newsCarouselIndex <= 0 ? 'none' : 'auto';
  }
  if (rightBtn) {
    var maxIdx = getMaxNewsIndex();
    rightBtn.style.opacity = newsCarouselIndex >= maxIdx ? '0.35' : '1';
    rightBtn.style.pointerEvents = newsCarouselIndex >= maxIdx ? 'none' : 'auto';
  }
}

function initNewsArrows() {
  var leftBtn = document.getElementById('newsArrowLeft');
  var rightBtn = document.getElementById('newsArrowRight');

  if (leftBtn && !leftBtn._bound) {
    leftBtn.addEventListener('click', function () {
      if (newsCarouselIndex > 0) {
        newsCarouselIndex--;
        updateNewsCarousel();
      }
    });
    leftBtn._bound = true;
  }

  if (rightBtn && !rightBtn._bound) {
    rightBtn.addEventListener('click', function () {
      if (newsCarouselIndex < getMaxNewsIndex()) {
        newsCarouselIndex++;
        updateNewsCarousel();
      }
    });
    rightBtn._bound = true;
  }

  updateNewsCarousel();
}

// Recalculate on resize
window.addEventListener('resize', function () {
  updateCardSizes();
  var maxIdx = getMaxNewsIndex();
  if (newsCarouselIndex > maxIdx) newsCarouselIndex = maxIdx;
  updateNewsCarousel();
});

