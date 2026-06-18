/* ==========================================================================
   Bright Side - Application Logic (English Version - Cloud Firestore)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  projectId: "bright-side-ogn-7e0e7",
  appId: "1:969138195077:web:fccb5442552408d1c4f7ec",
  storageBucket: "bright-side-ogn-7e0e7.firebasestorage.app",
  apiKey: "AIzaSyAAX4MCd9ibSEq3Im-K5G_ukdA7yFFDy6s",
  authDomain: "bright-side-ogn-7e0e7.firebaseapp.com",
  messagingSenderId: "969138195077",
  measurementId: "G-NZG8RC9QJJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
  // Load liked stories list from localStorage
  const savedLikes = localStorage.getItem("likedStories");
  if (savedLikes) {
    likedStories = JSON.parse(savedLikes);
  } else {
    likedStories = [];
    localStorage.setItem("likedStories", JSON.stringify(likedStories));
  }

  // Subscribe to approved stories in Firestore
  const approvedQuery = query(collection(db, "stories"), where("status", "==", "approved"));
  onSnapshot(approvedQuery, async (snapshot) => {
    stories = [];
    snapshot.forEach(doc => {
      stories.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort stories: timestamp descending
    stories.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Auto-seed if empty and logged in as admin
    if (stories.length === 0 && auth.currentUser && auth.currentUser.email === "brightsideogn@gmail.com") {
      await seedDefaultStories();
    }
    
    // Update view
    renderStories();
    initFeaturedSlider(); // Update slider too with latest stories
    updateStats();
  }, (error) => {
    console.error("Approved stories subscription error:", error);
  });
}

async function seedDefaultStories() {
  console.log("Database is empty. Seeding default stories...");
  const colRef = collection(db, "stories");
  for (let i = 0; i < DEFAULT_STORIES.length; i++) {
    const story = DEFAULT_STORIES[i];
    const newStory = {
      title: story.title,
      category: story.category,
      content: story.content,
      author: story.author,
      link: story.link || "",
      image: story.image || "",
      date: story.date,
      timestamp: Date.now() - (DEFAULT_STORIES.length - i) * 60000,
      likes: story.likes,
      status: "approved"
    };
    try {
      await addDoc(colRef, newStory);
    } catch (e) {
      console.error("Error seeding story:", e);
    }
  }
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

  // Sort: newest first by timestamp or fallback to date
  const sortedStories = [...filteredStories].sort((a, b) => {
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  // Render cards
  newsGrid.innerHTML = sortedStories.map(story => {
    const isLiked = likedStories.includes(story.id);
    const badgeClass = `badge-${story.category}`;
    const categoryName = getCategoryName(story.category);
    const imageUrl = (!story.image || isBadImageUrl(story.image)) ? getCategoryPlaceholder(story.category, story.id) : story.image;
    
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
window.toggleLike = async function(storyId) {
  const story = stories.find(s => s.id === storyId);
  if (!story) return;

  const likeIndex = likedStories.indexOf(storyId);
  const cardElement = document.querySelector(`.news-card[data-id="${storyId}"]`);
  const likeBtn = cardElement ? cardElement.querySelector('.like-btn') : null;
  const likesDisplay = cardElement ? cardElement.querySelector('.likes-count') : null;

  let newLikes = story.likes;

  if (likeIndex === -1) {
    // Upvote
    likedStories.push(storyId);
    newLikes++;
    if (likeBtn) {
      likeBtn.classList.add('liked');
      animateHeart(likeBtn.querySelector('svg'));
    }
  } else {
    // Remove upvote
    likedStories.splice(likeIndex, 1);
    newLikes--;
    if (likeBtn) likeBtn.classList.remove('liked');
  }

  if (likesDisplay) {
    likesDisplay.textContent = newLikes;
  }

  saveLikes();
  updateStats();

  try {
    const storyDocRef = doc(db, "stories", storyId);
    await updateDoc(storyDocRef, {
      likes: newLikes
    });
  } catch (error) {
    console.error("Error updating likes in Firestore: ", error);
    // Rollback locally if it fails
    if (likeIndex === -1) {
      likedStories.pop();
    } else {
      likedStories.push(storyId);
    }
    saveLikes();
    updateStats();
  }
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
          title: titleVal,
          category: categoryVal,
          content: contentVal,
          author: authorVal,
          link: linkVal,
          image: imageVal,
          date: getCurrentFormattedDate(),
          timestamp: Date.now(),
          likes: 0,
          status: "pending"
        };

        const submitBtn = addNewsForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        addDoc(collection(db, "stories"), newStory)
          .then(() => {
            closeModal();
            alert("Thank you! Your story has been submitted for moderation and will appear once approved.");
          })
          .catch((error) => {
            console.error("Error submitting story: ", error);
            alert("Error submitting story. Please try again.");
          })
          .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          });
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

  // --- ADMIN & MODERATOR HANDLERS ---
  const adminNavBtn = document.getElementById("admin-nav-btn");
  const adminLoginModal = document.getElementById("admin-login-modal");
  const closeLoginBtn = document.getElementById("close-login-btn");
  const cancelLoginBtn = document.getElementById("cancel-login-btn");
  const adminLoginForm = document.getElementById("admin-login-form");
  const loginErrorMsg = document.getElementById("login-error");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");

  const closeLoginModal = () => {
    if (adminLoginModal) {
      adminLoginModal.classList.remove("active");
      document.body.style.overflow = "";
      if (adminLoginForm) adminLoginForm.reset();
      if (loginErrorMsg) loginErrorMsg.style.display = "none";
    }
  };

  if (adminNavBtn) {
    adminNavBtn.addEventListener("click", () => {
      if (auth.currentUser) {
        const dashboard = document.getElementById("admin-dashboard");
        if (dashboard) dashboard.scrollIntoView({ behavior: 'smooth' });
      } else {
        if (adminLoginModal) {
          adminLoginModal.classList.add("active");
          document.body.style.overflow = "hidden";
          setTimeout(() => {
            const emailInput = document.getElementById("admin-email");
            if (emailInput) emailInput.focus();
          }, 100);
        }
      }
    });
  }

  if (closeLoginBtn) closeLoginBtn.addEventListener("click", closeLoginModal);
  if (cancelLoginBtn) cancelLoginBtn.addEventListener("click", closeLoginModal);
  if (adminLoginModal) {
    adminLoginModal.addEventListener("click", (e) => {
      if (e.target === adminLoginModal) closeLoginModal();
    });
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("admin-email").value.trim();
      const password = document.getElementById("admin-password").value;
      
      const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing In...";
      
      if (loginErrorMsg) loginErrorMsg.style.display = "none";
      
      try {
        await signInWithEmailAndPassword(auth, email, password);
        closeLoginModal();
      } catch (error) {
        console.error("Login error:", error);
        if (loginErrorMsg) {
          loginErrorMsg.style.display = "block";
          loginErrorMsg.textContent = "Invalid email or password.";
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Sign out error:", error);
      }
    });
  }

  // Monitor auth state changes
  onAuthStateChanged(auth, (user) => {
    const dashboard = document.getElementById("admin-dashboard");
    const userDisplay = document.getElementById("admin-user-display");
    
    if (user) {
      if (dashboard) dashboard.classList.remove("hidden");
      if (userDisplay) userDisplay.textContent = user.email;
      
      // Listen to pending stories
      const pendingQuery = query(collection(db, "stories"), where("status", "==", "pending"));
      window.unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const pendingStories = [];
        snapshot.forEach(doc => {
          pendingStories.push({ id: doc.id, ...doc.data() });
        });
        pendingStories.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        renderPendingStories(pendingStories);
      }, (error) => {
        console.error("Pending stories subscription error:", error);
      });
    } else {
      if (dashboard) dashboard.classList.add("hidden");
      if (window.unsubscribePending) {
        window.unsubscribePending();
        window.unsubscribePending = null;
      }
    }
  });
}

// Render and management functions for pending stories
function renderPendingStories(pendingStories) {
  const pendingGrid = document.getElementById("pending-grid");
  const pendingCount = document.getElementById("pending-count");

  if (!pendingGrid || !pendingCount) return;

  pendingCount.textContent = pendingStories.length;

  if (pendingStories.length === 0) {
    pendingGrid.innerHTML = `
      <div class="empty-pending-state" style="grid-column: 1/-1; text-align: center; padding: 30px; opacity: 0.7;">
        <p>No stories waiting for approval. Good job!</p>
      </div>
    `;
    return;
  }

  pendingGrid.innerHTML = pendingStories.map(story => {
    const badgeClass = `badge-${story.category}`;
    const categoryName = getCategoryName(story.category);
    const imageUrl = (!story.image || isBadImageUrl(story.image)) ? getCategoryPlaceholder(story.category, story.id) : story.image;
    
    return `
      <div class="pending-card glass-panel" data-id="${story.id}" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
        <div style="display: flex; gap: 12px; align-items: start;">
          <img src="${imageUrl}" alt="" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
          <div style="flex: 1;">
            <div style="display: flex; gap: 8px; margin-bottom: 4px; align-items: center; flex-wrap: wrap;">
              <span class="badge ${badgeClass}">${categoryName}</span>
              <span style="font-size: 0.8rem; opacity: 0.6;">${story.date}</span>
            </div>
            <h5 style="margin: 0 0 6px 0; font-size: 1.05rem; font-weight: 600;">${escapeHTML(story.title)}</h5>
            <p style="margin: 0; font-size: 0.85rem; opacity: 0.8; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(story.content)}</p>
          </div>
        </div>
        <div style="font-size: 0.8rem; opacity: 0.7;">
          Shared by: <strong>${escapeHTML(story.author || 'Anonymous')}</strong>
          ${story.link ? ` | <a href="${escapeHTML(story.link)}" target="_blank" style="color: var(--accent-teal);">Source Link</a>` : ''}
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: auto;">
          <button class="secondary-btn sm-btn" onclick="deletePendingStory('${story.id}')" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171;">Delete</button>
          <button class="primary-btn sm-btn" onclick="approvePendingStory('${story.id}')">Approve</button>
        </div>
      </div>
    `;
  }).join("");
}

window.approvePendingStory = async function(storyId) {
  try {
    const storyDocRef = doc(db, "stories", storyId);
    await updateDoc(storyDocRef, {
      status: "approved"
    });
  } catch (error) {
    console.error("Error approving story: ", error);
    alert("Error approving story. Make sure you are logged in.");
  }
};

window.deletePendingStory = async function(storyId) {
  if (confirm("Are you sure you want to delete this pending story?")) {
    try {
      const storyDocRef = doc(db, "stories", storyId);
      await deleteDoc(storyDocRef);
    } catch (error) {
      console.error("Error deleting story: ", error);
      alert("Error deleting story. Make sure you are logged in.");
    }
  }
};

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
function getCategoryPlaceholder(category, seed) {
  const placeholders = {
    nature: [
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&auto=format&fit=crop&q=80"
    ],
    science: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1614728263952-84ea256f9d1d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80"
    ],
    humanity: [
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=600&auto=format&fit=crop&q=80"
    ],
    kindness: [
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1608555855762-2b657eb1c348?w=600&auto=format&fit=crop&q=80"
    ],
    culture: [
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=80"
    ]
  };
  const pool = placeholders[category] || placeholders.kindness;
  // Use seed (story id) to pick consistently but vary across stories
  const idx = seed ? Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length : 0;
  return pool[idx];
}

// Returns true if the image URL is a known bad/placeholder URL (e.g. Google logo)
function isBadImageUrl(url) {
  if (!url) return true;
  const badPatterns = [
    "google.com/images/branding",
    "gstatic.com/images",
    "googlelogo",
    "1x1.gif",
    "blank.gif",
    "placeholder",
    "data:image"
  ];
  return badPatterns.some(p => url.toLowerCase().includes(p));
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
    imgElem.src = (!story.image || isBadImageUrl(story.image)) ? getCategoryPlaceholder(story.category, story.id) : story.image;
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
      imgElem.src = (!story.image || isBadImageUrl(story.image)) ? getCategoryPlaceholder(story.category, story.id) : story.image;
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
