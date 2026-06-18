/* ==========================================================================
   Bright Side - Application Logic (English Version)
   ========================================================================== */

// 1. PRE-SEEDED GOOD NEWS DATASET
const DEFAULT_STORIES = [
  {
    id: "story-default-1",
    title: "Biodegradable plastic made from algae helps clean oceans",
    category: "science",
    content: "A team of young scientists has successfully developed a new type of biodegradable packaging made from brown marine algae. Unlike traditional plastic which takes centuries to decompose, this organic material completely degrades in seawater in under six weeks, leaving no harmful microplastics or residues behind. Several global companies have already announced plans to adopt this eco-friendly material.",
    author: "Science & Ecology",
    link: "https://example.com/algae-plastic",
    date: "15 Jun 2026",
    likes: 245,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "story-default-2",
    title: "Retired carpenter crafts free wooden toys for kids",
    category: "kindness",
    content: "Miloje (72), a retired carpenter, has spent the last three years in his workshop crafting wooden toys. He gives all of them—cars, houses, puzzles, and hobby horses—for free to children from low-income families and local orphanages. He has distributed over 600 unique hand-crafted toys so far, stating that seeing a child's smile is the only reward he needs.",
    author: "Local News",
    link: "",
    date: "14 Jun 2026",
    likes: 512,
    image: "https://images.unsplash.com/photo-1581844144558-f7b6059d2f2d?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "story-default-3",
    title: "Blue whale population shows rapid recovery",
    category: "nature",
    content: "The latest report by marine biologists brings great news: after decades of strict protection and conservation efforts, the blue whale population in the South Atlantic has recovered to nearly 95% of its historical numbers. These ocean giants are once again roaming the seas in large groups, representing one of the greatest ecological victories of this century.",
    author: "Green Planet",
    link: "https://example.com/whales-recovery",
    date: "12 Jun 2026",
    likes: 189,
    image: "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "story-default-4",
    title: "AI discovers powerful new antibiotic to fight superbugs",
    category: "science",
    content: "In a historic medical breakthrough, researchers used advanced artificial intelligence algorithms to screen millions of chemical compounds in a matter of days. The AI successfully identified a completely new molecular structure that destroys superbugs resistant to all known drugs. This discovery could save millions of lives globally.",
    author: "Medical Magazine",
    link: "https://example.com/ai-antibiotic",
    date: "10 Jun 2026",
    likes: 367,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "story-default-5",
    title: "Public street piano turns strangers into an orchestra",
    category: "culture",
    content: "A public piano was placed in the city center with a sign reading 'Play me, the world is listening'. The idea was simply to enrich public space, but the reaction has exceeded all expectations. Every day, people of all ages—from children to professional pianists and seniors—stop by to play, creating beautiful moments of community and joy for passersby.",
    author: "Culture Guide",
    link: "",
    date: "08 Jun 2026",
    likes: 304,
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "story-default-6",
    title: "Students launch 'Warm Winter for Everyone' clothing drive",
    category: "humanity",
    content: "A group of students organized a self-initiated drive to collect winter clothing, blankets, and food for homeless people. Instead of standard collection centers, they hung warm jackets and coats on park trees with a tag: 'If you need it, take it. If you have extra, leave it'. The initiative has quickly spread to other cities.",
    author: "Humanitarian Network",
    link: "",
    date: "05 Jun 2026",
    likes: 418,
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80"
  }
];

// 2. INSPIRATIONAL QUOTES
const INSPIRATION_QUOTES = [
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Wherever there is a human being, there is an opportunity for a kindness.", author: "Seneca" },
  { text: "There is a crack in everything. That's how the light gets in.", author: "Leonard Cohen" },
  { text: "Kind words can be short and easy to speak, but their echoes are truly endless.", author: "Mother Teresa" },
  { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
  { text: "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky.", author: "Rabindranath Tagore" },
  { text: "Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.", author: "Helen Keller" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Smile, and the world smiles with you.", author: "Anonymous" }
];

// 3. APPLICATION STATE
let stories = [];
let likedStories = [];
let activeCategory = "all";
let searchQuery = "";

// Base statistics constants
const BASE_SMILES = 1248;

// 4. APPLICATION INITIALIZATION
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  await loadData();
  setupEventListeners();
  renderStories();
  initFeaturedSlider();
  setupInteractiveQuote();
  updateStats();
});

// 5. THEME MANAGER (Light/Dark Mode)
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  
  systemPrefersDark.addEventListener("change", (e) => {
    if (!localStorage.getItem("color-scheme")) {
      setTheme(e.matches ? 'dark' : 'light', false);
    }
  });
}

function setTheme(theme, save = true) {
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode');
    metaColorScheme.content = 'dark';
    if (save) localStorage.setItem("color-scheme", "dark");
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark-mode');
    metaColorScheme.content = 'light';
    if (save) localStorage.setItem("color-scheme", "light");
  } else {
    localStorage.removeItem("color-scheme");
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle('dark-mode', isDark);
    metaColorScheme.content = 'light dark';
  }
}

// 6. DATA LOADER & PERSISTENCE
async function loadData() {
  // Load stories from localStorage or seed defaults
  const savedStories = localStorage.getItem("stories");
  if (savedStories) {
    stories = JSON.parse(savedStories);
    
    // In case the user had Serbian stories saved, let's reset to English if it contains default Serbian IDs
    // to keep the language transition seamless
    if (stories.length > 0 && stories.some(s => s.id === "story-default-1" && s.title.includes("Biorazgradiva"))) {
      stories = [...DEFAULT_STORIES];
      localStorage.setItem("stories", JSON.stringify(stories));
    }
  } else {
    stories = [...DEFAULT_STORIES];
    localStorage.setItem("stories", JSON.stringify(stories));
  }

  // Try to load stories scraped by the agent
  try {
    const response = await fetch('stories.json');
    if (response.ok) {
      const scrapedStories = await response.json();
      if (Array.isArray(scrapedStories)) {
        // Keep user's custom-created local stories (they don't start with story-default and aren't in scraped stories)
        const userCustomStories = stories.filter(s => 
          !s.id.startsWith("story-default") && 
          !scrapedStories.some(ss => ss.id === s.id)
        );

        const merged = [];
        const seenIds = new Set();

        // Add user custom stories first
        userCustomStories.forEach(s => {
          if (!seenIds.has(s.id)) {
            merged.push(s);
            seenIds.add(s.id);
          }
        });

        // Add scraped stories
        scrapedStories.forEach(s => {
          if (!seenIds.has(s.id)) {
            merged.push(s);
            seenIds.add(s.id);
          }
        });

        // Add default stories as fallback
        DEFAULT_STORIES.forEach(s => {
          if (!seenIds.has(s.id)) {
            merged.push(s);
            seenIds.add(s.id);
          }
        });

        stories = merged;
        localStorage.setItem("stories", JSON.stringify(stories));
      }
    }
  } catch (error) {
    console.log("No local stories.json found or failed to fetch. Using defaults/localStorage.");
  }

  // Load liked stories
  const savedLikes = localStorage.getItem("likedStories");
  if (savedLikes) {
    likedStories = JSON.parse(savedLikes);
  } else {
    likedStories = [];
    localStorage.setItem("likedStories", JSON.stringify(likedStories));
  }
}

function saveStories() {
  localStorage.setItem("stories", JSON.stringify(stories));
}

function saveLikes() {
  localStorage.setItem("likedStories", JSON.stringify(likedStories));
}

// 7. RENDER STORIES
function renderStories() {
  const newsGrid = document.getElementById("news-grid");
  const emptyState = document.getElementById("empty-state");
  const feedCount = document.getElementById("feed-count");
  
  // Filter stories based on category & search query
  const filteredStories = stories.filter(story => {
    const matchesCategory = activeCategory === "all" || story.category === activeCategory;
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          story.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Update feed count
  feedCount.textContent = `${filteredStories.length} ${filteredStories.length === 1 ? 'story' : 'stories'}`;

  // Check if empty
  if (filteredStories.length === 0) {
    newsGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }
  
  emptyState.classList.add("hidden");

  // Sort: Custom newest stories first
  const sortedStories = [...filteredStories].sort((a, b) => {
    const aTime = a.id.startsWith("story-default") ? 0 : parseInt(a.id.split("-")[1] || 0);
    const bTime = b.id.startsWith("story-default") ? 0 : parseInt(b.id.split("-")[1] || 0);
    
    if (aTime === 0 && bTime === 0) {
      return DEFAULT_STORIES.findIndex(s => s.id === a.id) - DEFAULT_STORIES.findIndex(s => s.id === b.id);
    }
    return bTime - aTime;
  });

  // Render cards
  newsGrid.innerHTML = sortedStories.map(story => {
    const isLiked = likedStories.includes(story.id);
    const badgeClass = `badge-${story.category}`;
    const categoryName = getCategoryName(story.category);
    const imageUrl = story.image || getCategoryPlaceholder(story.category);
    
    return `
      <article class="news-card glass-panel fade-in-on-scroll" data-id="${story.id}">
        <div class="card-image-wrapper">
          <img src="${imageUrl}" alt="${escapeHTML(story.title)}" class="card-image" loading="lazy">
        </div>
        <div class="card-top">
          <div class="card-meta">
            <span class="badge ${badgeClass}">${categoryName}</span>
            <span class="card-date">${story.date}</span>
          </div>
          <h4 class="card-title">${escapeHTML(story.title)}</h4>
          <p class="card-content">${escapeHTML(story.content)}</p>
        </div>
        <div class="card-footer">
          <span class="card-author">Shared by: <strong>${escapeHTML(story.author || 'Anonymous')}</strong></span>
          <div class="card-actions">
            <!-- Upvote Button -->
            <button class="like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${story.id}')" aria-label="Upvote story">
              <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span class="likes-count">${story.likes}</span>
            </button>
            
            <!-- Source Link -->
            ${story.link ? `
              <a href="${escapeHTML(story.link)}" target="_blank" rel="noopener noreferrer" class="link-btn" title="View news source">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Setup scroll animations
  setupScrollAnimations();
}

// 8. UPVOTE FUNCTIONALITY
window.toggleLike = function(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;

  const likeIndex = likedStories.indexOf(storyId);
  const cardElement = document.querySelector(`.news-card[data-id="${storyId}"]`);
  const likeBtn = cardElement ? cardElement.querySelector('.like-btn') : null;
  const likesDisplay = cardElement ? cardElement.querySelector('.likes-count') : null;

  if (likeIndex === -1) {
    // Upvote
    likedStories.push(storyId);
    story.likes++;
    if (likeBtn) {
      likeBtn.classList.add('liked');
      animateHeart(likeBtn.querySelector('svg'));
    }
  } else {
    // Remove upvote
    likedStories.splice(likeIndex, 1);
    story.likes--;
    if (likeBtn) likeBtn.classList.remove('liked');
  }

  if (likesDisplay) {
    likesDisplay.textContent = story.likes;
  }

  saveStories();
  saveLikes();
  updateStats();
};

function animateHeart(svg) {
  if (!svg) return;
  svg.style.transform = 'scale(1.4)';
  setTimeout(() => {
    svg.style.transform = 'scale(1.1)';
    setTimeout(() => {
      svg.style.transform = '';
    }, 150);
  }, 150);
}

// 9. STATS UPDATE
function updateStats() {
  const statsStories = document.getElementById("stats-stories");
  const statsSmiles = document.getElementById("stats-smiles");
  
  if (statsStories) statsStories.textContent = stories.length;

  const totalLikes = stories.reduce((sum, story) => sum + story.likes, 0);
  if (statsSmiles) {
    statsSmiles.textContent = (BASE_SMILES + totalLikes).toLocaleString();
  }
}

// 10. DAILY OPTIMISM GENERATOR (QUOTES)
function setupInteractiveQuote() {
  const quoteText = document.getElementById("quote-text");
  const quoteAuthor = document.getElementById("quote-author");
  const newQuoteBtn = document.getElementById("new-quote-btn");
  const inspirationCard = document.getElementById("inspiration-card");

  setRandomQuote(quoteText, quoteAuthor);

  if (newQuoteBtn) {
    newQuoteBtn.addEventListener("click", () => {
      const icon = newQuoteBtn.querySelector('.spin-icon');
      if (icon) {
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => { icon.style.transform = ''; }, 600);
      }
      
      quoteText.style.opacity = '0';
      quoteAuthor.style.opacity = '0';
      
      setTimeout(() => {
        setRandomQuote(quoteText, quoteAuthor);
        quoteText.style.opacity = '1';
        quoteAuthor.style.opacity = '1';
      }, 300);
    });
  }

  // Mouse spotlight spotlight interaction
  if (inspirationCard) {
    inspirationCard.addEventListener("mousemove", (e) => {
      const rect = inspirationCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      inspirationCard.style.setProperty("--x", `${x}px`);
      inspirationCard.style.setProperty("--y", `${y}px`);
    });
  }
}

function setRandomQuote(textElem, authorElem) {
  const randomIndex = Math.floor(Math.random() * INSPIRATION_QUOTES.length);
  const quote = INSPIRATION_QUOTES[randomIndex];
  if (textElem) textElem.textContent = `"${quote.text}"`;
  if (authorElem) authorElem.textContent = `— ${quote.author}`;
}

// 11. EVENT LISTENERS
function setupEventListeners() {
  const themeToggle = document.getElementById("theme-toggle");
  const addNewsBtn = document.getElementById("add-news-btn");
  const emptyAddBtn = document.getElementById("empty-add-btn");
  const addNewsModal = document.getElementById("add-news-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelModalBtn = document.getElementById("cancel-modal-btn");
  const addNewsForm = document.getElementById("add-news-form");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("search-input");
  
  // Theme Toggle Click
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = document.documentElement.classList.contains('dark-mode');
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  // Modal handlers
  const openModal = () => {
    if (addNewsModal) {
      addNewsModal.classList.add("active");
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        document.getElementById("news-title").focus();
      }, 100);
    }
  };

  const closeModal = () => {
    if (addNewsModal) {
      addNewsModal.classList.remove("active");
      document.body.style.overflow = "";
      addNewsForm.reset();
      clearFormErrors();
    }
  };

  if (addNewsBtn) addNewsBtn.addEventListener("click", openModal);
  if (emptyAddBtn) emptyAddBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

  if (addNewsModal) {
    addNewsModal.addEventListener("click", (e) => {
      if (e.target === addNewsModal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && addNewsModal.classList.contains("active")) {
        closeModal();
      }
    });
  }

  // Filters
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.getAttribute("data-category");
      
      const feedTitle = document.getElementById("feed-title");
      if (feedTitle) {
        if (activeCategory === "all") feedTitle.textContent = "Latest Good News";
        else feedTitle.textContent = `Stories in: ${getCategoryName(activeCategory)}`;
      }

      renderStories();
    });
  });

  // Search input with debounce
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        renderStories();
      }, 150);
    });
  }

  // Submit News Form
  if (addNewsForm) {
    addNewsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      if (validateForm()) {
        const titleVal = document.getElementById("news-title").value.trim();
        const categoryVal = document.getElementById("news-category").value;
        const contentVal = document.getElementById("news-content").value.trim();
        const authorVal = document.getElementById("news-author").value.trim() || "Anonymous";
        const linkVal = document.getElementById("news-link").value.trim();
        const imageVal = document.getElementById("news-image") ? document.getElementById("news-image").value.trim() : "";
        
        const newStory = {
          id: `story-${Date.now()}`,
          title: titleVal,
          category: categoryVal,
          content: contentVal,
          author: authorVal,
          link: linkVal,
          image: imageVal,
          date: getCurrentFormattedDate(),
          likes: 0
        };

        stories.push(newStory);
        saveStories();
        
        renderStories();
        updateStats();
        closeModal();
        
        // Highlight new story animation
        setTimeout(() => {
          const firstCard = document.querySelector(".news-grid > article");
          if (firstCard) {
            firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstCard.style.outline = "2px solid var(--accent-teal)";
            setTimeout(() => { firstCard.style.outline = "none"; }, 1500);
          }
        }, 300);
      }
    });
  }

  // Card click event delegation (Opens detailed story popup)
  const newsGrid = document.getElementById("news-grid");
  if (newsGrid) {
    newsGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".news-card");
      if (!card) return;
      
      // Ignore click if user clicked on action buttons
      if (e.target.closest(".like-btn") || e.target.closest(".link-btn")) {
        return;
      }
      
      const storyId = card.getAttribute("data-id");
      openStoryDetail(storyId);
    });
  }

  // Story detail modal close buttons
  const closeDetailBtn = document.getElementById("close-detail-btn");
  const storyDetailModal = document.getElementById("story-detail-modal");
  
  if (closeDetailBtn) {
    closeDetailBtn.addEventListener("click", () => {
      if (storyDetailModal) {
        storyDetailModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
  
  if (storyDetailModal) {
    storyDetailModal.addEventListener("click", (e) => {
      if (e.target === storyDetailModal) {
        storyDetailModal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
  }
}

// 12. SCROLL DRIVEN ANIMATIONS FALLBACK (IntersectionObserver)
function setupScrollAnimations() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsCssTimeline = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');

  if (!prefersReducedMotion && !supportsCssTimeline) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.05
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const cards = document.querySelectorAll(".news-grid > article");
    cards.forEach(card => {
      observer.observe(card);
    });
  }
}

// 13. HELPERS
function getCategoryName(category) {
  const names = {
    all: "All Stories",
    humanity: "Humanity",
    science: "Science & Tech",
    nature: "Nature & Ecology",
    kindness: "Kindness & Good Deeds",
    culture: "Art & Culture"
  };
  return names[category] || category;
}

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCurrentFormattedDate() {
  const date = new Date();
  const days = date.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthName = months[date.getMonth()];
  const years = date.getFullYear();
  return `${days} ${monthName} ${years}`;
}

// Form validations
function validateForm() {
  let isValid = true;

  const titleInput = document.getElementById("news-title");
  const contentInput = document.getElementById("news-content");
  const linkInput = document.getElementById("news-link");

  clearFormErrors();

  if (titleInput.value.trim().length < 5) {
    titleInput.parentElement.classList.add("invalid");
    isValid = false;
  }

  if (contentInput.value.trim().length < 20) {
    contentInput.parentElement.classList.add("invalid");
    isValid = false;
  }

  if (linkInput.value.trim() !== "") {
    try {
      new URL(linkInput.value.trim());
    } catch (_) {
      linkInput.parentElement.classList.add("invalid");
      isValid = false;
    }
  }

  const imageInput = document.getElementById("news-image");
  if (imageInput && imageInput.value.trim() !== "") {
    try {
      new URL(imageInput.value.trim());
    } catch (_) {
      imageInput.parentElement.classList.add("invalid");
      isValid = false;
    }
  }

  return isValid;
}

function clearFormErrors() {
  const formGroups = document.querySelectorAll(".form-group");
  formGroups.forEach(group => group.classList.remove("invalid"));
}

// 14. DETAILED STORY MODAL LOGIC & IMAGE FALLBACKS
function getCategoryPlaceholder(category) {
  const placeholders = {
    nature: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80",
    science: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
    humanity: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80",
    kindness: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80",
    culture: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80"
  };
  return placeholders[category] || placeholders.kindness;
}

function openStoryDetail(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;

  const modal = document.getElementById("story-detail-modal");
  if (!modal) return;

  const categoryElem = document.getElementById("detail-category");
  const imgElem = document.getElementById("detail-image");
  const titleElem = document.getElementById("detail-title");
  const dateElem = document.getElementById("detail-date");
  const bodyElem = document.getElementById("detail-body");
  const authorElem = document.getElementById("detail-author");
  const likesCountElem = document.getElementById("detail-likes-count");
  const likeBtnElem = document.getElementById("detail-like-btn");
  const linkElem = document.getElementById("detail-link");

  if (categoryElem) {
    categoryElem.textContent = getCategoryName(story.category);
    categoryElem.className = `badge badge-${story.category}`;
  }

  if (imgElem) {
    imgElem.src = story.image || getCategoryPlaceholder(story.category);
    imgElem.alt = story.title;
  }

  if (titleElem) titleElem.textContent = story.title;
  if (dateElem) dateElem.textContent = story.date;
  if (bodyElem) bodyElem.textContent = story.content;
  
  if (authorElem) {
    authorElem.innerHTML = `Shared by: <strong>${escapeHTML(story.author || 'Anonymous')}</strong>`;
  }

  if (likesCountElem) likesCountElem.textContent = story.likes;

  if (likeBtnElem) {
    const isLiked = likedStories.includes(story.id);
    likeBtnElem.className = `like-btn ${isLiked ? 'liked' : ''}`;
    
    // Explicit click listener mapping for the detail modal heart button
    likeBtnElem.onclick = (e) => {
      e.stopPropagation();
      toggleLike(story.id);
      likesCountElem.textContent = story.likes;
      likeBtnElem.className = `like-btn ${likedStories.includes(story.id) ? 'liked' : ''}`;
      
      // Sync the card like display as well by re-rendering feed stats
      const card = document.querySelector(`.news-card[data-id="${story.id}"]`);
      if (card) {
        const cardLikesDisplay = card.querySelector('.likes-count');
        const cardLikeBtn = card.querySelector('.like-btn');
        if (cardLikesDisplay) cardLikesDisplay.textContent = story.likes;
        if (cardLikeBtn) cardLikeBtn.className = `like-btn ${likedStories.includes(story.id) ? 'liked' : ''}`;
      }
    };
  }

  if (linkElem) {
    if (story.link) {
      linkElem.href = story.link;
      linkElem.classList.remove("hidden");
    } else {
      linkElem.href = "#";
      linkElem.classList.add("hidden");
    }
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// 15. HERO FEATURED STORIES SLIDER
let sliderInterval = null;
function initFeaturedSlider() {
  const imgElem = document.getElementById("featured-img");
  const categoryElem = document.getElementById("featured-category");
  const dateElem = document.getElementById("featured-date");
  const titleElem = document.getElementById("featured-title");
  const descElem = document.getElementById("featured-desc");
  const readBtn = document.getElementById("featured-read-btn");
  const prevBtn = document.getElementById("featured-prev-btn");
  const nextBtn = document.getElementById("featured-next-btn");

  if (!imgElem || !titleElem) return;

  // Filter stories that have valid images. Default stories are fine too.
  const sliderStories = stories.filter(s => s.image && !s.image.startsWith("content=")).slice(0, 5);
  
  if (sliderStories.length === 0) {
    // If no stories with image, fall back to default stories
    sliderStories.push(...DEFAULT_STORIES.slice(0, 3));
  }

  let activeIndex = 0;

  function updateSlide(index) {
    const story = sliderStories[index];
    if (!story) return;

    // Fade out effect
    imgElem.style.opacity = '0.3';
    setTimeout(() => {
      imgElem.src = story.image || getCategoryPlaceholder(story.category);
      imgElem.alt = story.title;
      imgElem.style.opacity = '1';
    }, 200);

    if (categoryElem) {
      categoryElem.textContent = getCategoryName(story.category);
      categoryElem.className = `badge badge-${story.category}`;
    }
    if (dateElem) dateElem.textContent = story.date;
    if (titleElem) titleElem.textContent = story.title;
    if (descElem) descElem.textContent = story.content;
    
    if (readBtn) {
      readBtn.onclick = () => {
        openStoryDetail(story.id);
      };
    }
  }

  function nextSlide() {
    activeIndex = (activeIndex + 1) % sliderStories.length;
    updateSlide(activeIndex);
  }

  function prevSlide() {
    activeIndex = (activeIndex - 1 + sliderStories.length) % sliderStories.length;
    updateSlide(activeIndex);
  }

  // Set initial slide
  updateSlide(activeIndex);

  // Setup Event Listeners
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.stopPropagation();
      clearInterval(sliderInterval);
      nextSlide();
      startAutoPlay();
    };
  }

  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.stopPropagation();
      clearInterval(sliderInterval);
      prevSlide();
      startAutoPlay();
    };
  }

  // Auto-play function
  function startAutoPlay() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(nextSlide, 6000); // changes slide every 6 seconds
  }

  startAutoPlay();
}
