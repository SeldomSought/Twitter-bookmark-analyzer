// content/scraper.js - Service worker driven scraper

(function() {
  'use strict';

  if (window.__consciousnessScraper) {
    console.log('[Scraper] Already exists');
    return;
  }

  class BookmarkScraper {
    constructor() {
      this.seen = new Set();
      this.buffer = [];
      this.batchSize = 20;
      this.isRunning = false;
      this.startTime = null;
      this.lastNewFoundTime = null;
    }

    async initialize() {
      console.log('[Scraper] ====== INITIALIZING ======');
      this.startTime = Date.now();
      this.lastNewFoundTime = Date.now();
      this.isRunning = true;

      // Verify we're on the right page
      if (!window.location.href.includes('bookmark')) {
        throw new Error('NOT_ON_BOOKMARKS');
      }

      // Wait for initial tweets
      const found = await this.waitForTweets();
      if (!found) {
        throw new Error('TIMEOUT: Could not find tweets');
      }

      console.log('[Scraper] Ready for commands');
      return { success: true };
    }

    async waitForTweets() {
      const maxWait = 20000;
      const start = Date.now();

      while (Date.now() - start < maxWait) {
        if (window.location.href.includes('/login')) {
          throw new Error('NOT_LOGGED_IN');
        }

        const tweets = this.findTweets();
        if (tweets.length > 0) {
          console.log(`[Scraper] Found ${tweets.length} initial tweets`);
          return true;
        }

        const pageText = document.body?.innerText || '';
        if ((pageText.includes("Save posts") || pageText.includes("haven't added")) && Date.now() - start > 8000) {
          throw new Error('NO_BOOKMARKS');
        }

        await this.sleep(500);
      }
      return false;
    }

    findTweets() {
      const articles = document.querySelectorAll('article[data-testid="tweet"], article');
      return Array.from(articles).filter(el => {
        const hasStatusLink = el.querySelector('a[href*="/status/"]');
        const hasText = el.querySelector('[data-testid="tweetText"]');
        return hasStatusLink && hasText;
      });
    }

    // Called by service worker
    tick() {
      if (!this.isRunning) return { done: true };

      // Expand "Show more" buttons
      this.expandShowMore();

      // Capture visible tweets
      const tweets = this.findTweets();
      let newCount = 0;

      for (const el of tweets) {
        const data = this.extractTweet(el);
        if (data && !this.seen.has(data.id)) {
          this.seen.add(data.id);
          this.buffer.push(data);
          newCount++;
        }
      }

      if (newCount > 0) {
        this.lastNewFoundTime = Date.now();
      }

      // Scroll down
      window.scrollBy({ top: 500, behavior: 'auto' });

      // Send batch if ready
      let sentBatch = null;
      if (this.buffer.length >= this.batchSize) {
        sentBatch = [...this.buffer];
        this.buffer = [];
      }

      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const timeSinceNew = Date.now() - this.lastNewFoundTime;

      return {
        done: false,
        total: this.seen.size,
        newCount,
        elapsed,
        timeSinceNew,
        batch: sentBatch
      };
    }

    expandShowMore() {
      // Find and click "Show more" buttons within tweets
      const showMoreButtons = document.querySelectorAll('[data-testid="tweet-text-show-more-link"], [role="button"]');
      for (const btn of showMoreButtons) {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('show more') || text.includes('show')) {
          // Only click if it's inside a tweet article
          const article = btn.closest('article');
          if (article && !btn.dataset.clicked) {
            btn.dataset.clicked = 'true';
            try {
              btn.click();
            } catch (e) {}
          }
        }
      }
    }

    finish() {
      this.isRunning = false;
      const remaining = [...this.buffer];
      this.buffer = [];
      
      return {
        total: this.seen.size,
        remaining,
        duration: Date.now() - this.startTime
      };
    }

    extractTweet(el) {
      try {
        const statusLink = el.querySelector('a[href*="/status/"]');
        if (!statusLink) return null;
        
        const match = statusLink.href.match(/\/status\/(\d+)/);
        if (!match) return null;
        const id = match[1];

        const textEl = el.querySelector('[data-testid="tweetText"]');
        const text = textEl?.innerText?.trim() || '';

        const contentAnalysis = this.analyzeContent(text);
        const author = this.extractAuthor(el);
        const timeEl = el.querySelector('time');
        const timestamp = timeEl?.getAttribute('datetime') || null;
        const media = this.extractMedia(el);
        const metrics = this.extractMetrics(el);
        const links = this.extractLinks(el);

        return {
          id, text, author, timestamp, media, metrics, links, contentAnalysis,
          isThread: !!el.querySelector('[data-testid="Tweet-thread-line"]'),
          isQuote: el.querySelectorAll('article').length > 1,
          isReply: text.startsWith('@'),
          textLength: text.length,
          wordCount: text.split(/\s+/).filter(w => w).length,
          capturedAt: new Date().toISOString()
        };
      } catch (e) {
        return null;
      }
    }

    analyzeContent(text) {
      if (!text) return {};
      const lower = text.toLowerCase();
      
      return {
        hasExcitement: /!{2,}|amazing|incredible|wow|omg|insane/i.test(text),
        hasSkepticism: /but |however|although|skeptic|doubt|questionable/i.test(lower),
        hasAgreement: /this\.|exactly|100%|so true|facts|real talk/i.test(lower),
        hasDisagreement: /disagree|wrong|actually,|no,|nope|bad take/i.test(lower),
        hasCuriosity: /\?|wonder|curious|interesting|hmm|why do|how does/i.test(lower),
        hasAdvice: /should|must|need to|have to|tip:|pro tip/i.test(lower),
        hasPersonal: /\bi\b|\bmy\b|\bme\b|myself|personally/i.test(lower),
        hasVulnerability: /struggle|hard|difficult|anxiety|depress|fail|mistake|afraid/i.test(lower),
        hasAmbition: /goal|dream|vision|build|create|start|launch|ship|grow/i.test(lower),
        hasGratitude: /thank|grateful|blessed|appreciate|lucky/i.test(lower),
        hasFrustration: /frustrated|annoying|hate|sick of|tired of|ugh/i.test(lower),
        hasHumor: /lol|lmao|😂|🤣|haha|funny|joke/i.test(lower),
        hasWisdom: /realize|learn|understand|truth|life|wisdom|lesson/i.test(lower),
        isInstructional: /how to|step|guide|tutorial|thread|tips|ways to/i.test(lower),
        isOpinion: /think|believe|feel|opinion|hot take|unpopular/i.test(lower),
        isNews: /breaking|announce|just|new:|update|report/i.test(lower),
        isPromotion: /check out|subscribe|follow|join|sign up|link in/i.test(lower),
        isQuestion: (text.match(/\?/g) || []).length > 0,
        isDeclarative: text.length > 50 && (text.match(/\?/g) || []).length === 0,
        hasTechnicalTerms: /algorithm|system|framework|protocol|infrastructure|architecture/i.test(lower),
        hasAbstraction: /concept|theory|philosophy|principle|fundamental|paradigm/i.test(lower),
        hasData: /\d+%|data|study|research|survey|statistic|evidence/i.test(lower),
        hasNuance: /nuance|complex|tradeoff|depends|context|spectrum/i.test(lower),
        mentionsList: (text.match(/@\w+/g) || []).map(m => m.slice(1).toLowerCase()),
        hashtagsList: (text.match(/#\w+/g) || []).map(h => h.slice(1).toLowerCase()),
        emojiCount: (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length
      };
    }

    extractAuthor(el) {
      const result = { handle: 'unknown', displayName: '', verified: false };
      const links = el.querySelectorAll('a[role="link"]');
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        if (href.match(/^\/[A-Za-z0-9_]{1,15}$/) && !href.includes('/status')) {
          const handle = href.slice(1).toLowerCase();
          if (!['home', 'explore', 'search', 'notifications', 'messages', 'i', 'settings', 'compose', 'lists'].includes(handle)) {
            result.handle = handle;
            const spans = link.querySelectorAll('span');
            for (const span of spans) {
              const txt = span.textContent?.trim();
              if (txt && txt.length > 0 && txt.length < 50 && !txt.startsWith('@')) {
                result.displayName = txt;
                break;
              }
            }
            break;
          }
        }
      }
      result.verified = !!el.querySelector('svg[aria-label*="Verified"], svg[aria-label*="verified"]');
      return result;
    }

    extractMedia(el) {
      const media = [];
      const images = el.querySelectorAll('img[src*="pbs.twimg.com/media"]');
      for (const img of images) {
        media.push({ type: 'image', altText: img.alt || '' });
      }
      if (el.querySelector('video, [data-testid="videoPlayer"]')) {
        media.push({ type: 'video' });
      }
      return media;
    }

    extractMetrics(el) {
      const metrics = { replies: 0, reposts: 0, likes: 0, views: 0 };
      const ariaLabels = el.querySelectorAll('[aria-label]');
      for (const elem of ariaLabels) {
        const label = (elem.getAttribute('aria-label') || '').toLowerCase();
        const replyMatch = label.match(/(\d[\d,.]*[km]?)\s*repl/i);
        const repostMatch = label.match(/(\d[\d,.]*[km]?)\s*(repost|retweet)/i);
        const likeMatch = label.match(/(\d[\d,.]*[km]?)\s*like/i);
        const viewMatch = label.match(/(\d[\d,.]*[km]?)\s*view/i);
        if (replyMatch) metrics.replies = this.parseNum(replyMatch[1]);
        if (repostMatch) metrics.reposts = this.parseNum(repostMatch[1]);
        if (likeMatch) metrics.likes = this.parseNum(likeMatch[1]);
        if (viewMatch) metrics.views = this.parseNum(viewMatch[1]);
      }
      return metrics;
    }

    parseNum(str) {
      if (!str) return 0;
      str = str.toLowerCase().replace(/,/g, '');
      const num = parseFloat(str);
      if (str.includes('k')) return Math.round(num * 1000);
      if (str.includes('m')) return Math.round(num * 1000000);
      return Math.round(num) || 0;
    }

    extractLinks(el) {
      const links = [];
      const anchors = el.querySelectorAll('a[href^="http"]');
      for (const a of anchors) {
        const href = a.href;
        if (href.includes('twitter.com') || href.includes('x.com') || href.includes('t.co')) continue;
        try {
          links.push({ domain: new URL(href).hostname.replace('www.', '') });
        } catch {}
      }
      return links;
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // Create scraper instance
  const scraper = new BookmarkScraper();
  window.__consciousnessScraper = scraper;

  // Listen for commands from service worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCRAPER_INIT') {
      scraper.initialize()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    
    if (message.type === 'SCRAPER_TICK') {
      const result = scraper.tick();
      sendResponse(result);
      return true;
    }
    
    if (message.type === 'SCRAPER_FINISH') {
      const result = scraper.finish();
      sendResponse(result);
      return true;
    }
    
    return false;
  });

  // Notify ready
  console.log('[Scraper] Script loaded, waiting for commands');
  chrome.runtime.sendMessage({ type: 'SCRAPER_READY' }).catch(() => {});

})();
