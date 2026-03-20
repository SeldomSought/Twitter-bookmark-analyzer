// content/scraper.js — Self-driving Twitter/X Bookmark Scraper v4
// Improvements: tweet URL/ID extraction, view counts, better dedup (hash), quote content, pronouns
(function () {
  'use strict';

  if (window.__bmScraperV4) return;
  window.__bmScraperV4 = true;

  console.log('[Scraper] v4 loaded on', location.href);

  // ─── Selectors ───
  const SELS = {
    tweet: 'article[data-testid="tweet"], article[role="article"]',
    tweetText: '[data-testid="tweetText"]',
    handle: '[data-testid="User-Name"] a[tabindex="-1"]',
    displayName: '[data-testid="User-Name"] > div:first-child span',
    time: 'time[datetime]',
    showMore: '[data-testid="tweet-text-show-more-link"]',
    photo: '[data-testid="tweetPhoto"] img, img[src*="pbs.twimg.com/media"]',
    video: 'video, [data-testid="videoPlayer"]',
    link: 'a[href*="t.co"], [data-testid="card.wrapper"] a',
    quoteTweet: '[data-testid="quoteTweet"]',
    loadingSpinner: '[role="progressbar"]',
    emptyState: '[data-testid="emptyState"]'
  };

  // ─── State ───
  const seen = new Set();
  let totalCaptured = 0;
  let consecutiveEmpty = 0;
  let running = false;
  let port = null;
  const MAX_EMPTY = 35;
  const MAX_BOOKMARKS = 2000;
  const MAX_TIME_MS = 15 * 60 * 1000;
  let startTime = 0;

  // ─── djb2 hash for robust deduplication ───
  function hashText(str) {
    let h = 5381;
    for (let i = 0; i < Math.min(str.length, 500); i++) {
      h = ((h << 5) + h) ^ str.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
  }

  // ─── Extract tweet permalink URL ───
  function extractTweetUrl(article) {
    const timeEl = article.querySelector(SELS.time);
    if (timeEl) {
      const parent = timeEl.closest('a');
      if (parent && parent.href && parent.href.includes('/status/')) return parent.href;
    }
    const links = article.querySelectorAll('a[href*="/status/"]');
    for (const a of links) {
      if (a.href && !a.href.includes('analytics')) return a.href;
    }
    return null;
  }

  // ─── Extract tweet ID from status URL ───
  function extractTweetId(url) {
    if (!url) return null;
    const m = url.match(/\/status\/(\d+)/);
    return m ? m[1] : null;
  }

  // ─── Extract view count (Twitter shows "X views" in analytics area) ───
  function extractViewCount(article) {
    const analyticsLink = article.querySelector('a[href*="/analytics"]');
    if (analyticsLink) {
      const label = analyticsLink.getAttribute('aria-label') || '';
      const m = label.match(/([\d,]+)\s*view/i);
      if (m) return parseMetric(m[1].replace(/,/g, ''));
    }
    return 0;
  }

  // ─── Extract first-person / social pronoun counts ───
  function extractPronouns(words) {
    const firstSingular = new Set(['i', 'me', 'my', 'mine', 'myself']);
    const firstPlural = new Set(['we', 'us', 'our', 'ours', 'ourselves']);
    const second = new Set(['you', 'your', 'yours', 'yourself', 'yourselves']);
    const thirdPlural = new Set(['they', 'them', 'their', 'theirs', 'themselves']);
    const counts = { i: 0, we: 0, you: 0, they: 0 };
    for (const w of words) {
      const c = w.replace(/[^a-z]/g, '');
      if (firstSingular.has(c)) counts.i++;
      else if (firstPlural.has(c)) counts.we++;
      else if (second.has(c)) counts.you++;
      else if (thirdPlural.has(c)) counts.they++;
    }
    return counts;
  }

  // ─── Extract a tweet ───
  function extractTweet(article) {
    try {
      const textEl = article.querySelector(SELS.tweetText);
      const text = textEl ? textEl.innerText.trim() : '';
      if (!text || text.length < 5) return null;

      // Hash-based dedup on normalized text (more robust than first-120-chars)
      const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
      const fp = hashText(normalized);
      if (seen.has(fp)) return null;
      seen.add(fp);

      let handle = '';
      const handleEl = article.querySelector(SELS.handle);
      if (handleEl) {
        const href = handleEl.getAttribute('href') || '';
        handle = href.replace(/^\//, '').split('/')[0].split('?')[0];
      }

      let displayName = '';
      const nameEl = article.querySelector(SELS.displayName);
      if (nameEl) displayName = nameEl.textContent.trim();

      let timestamp = null;
      const timeEl = article.querySelector(SELS.time);
      if (timeEl) timestamp = timeEl.getAttribute('datetime');

      const tweetUrl = extractTweetUrl(article);
      const tweetId = extractTweetId(tweetUrl);

      const metrics = { replies: 0, retweets: 0, likes: 0, views: 0 };
      ['reply', 'retweet', 'like'].forEach(key => {
        const btn = article.querySelector(`button[data-testid="${key}"]`);
        if (btn) {
          const allSpans = btn.querySelectorAll('span');
          for (const sp of allSpans) {
            const val = parseMetric(sp.textContent);
            if (val > 0) { metrics[key === 'reply' ? 'replies' : key + 's'] = val; break; }
          }
        }
      });
      metrics.views = extractViewCount(article);

      const media = [];
      article.querySelectorAll(SELS.photo).forEach(img => {
        const src = img.src || '';
        if (src && !src.includes('emoji') && !src.includes('profile_images'))
          media.push({ type: 'image', alt: img.alt || '', src: src.split('?')[0] });
      });
      if (article.querySelector(SELS.video)) media.push({ type: 'video' });

      const links = [];
      article.querySelectorAll(SELS.link).forEach(a => {
        const href = a.href || '';
        if (href && !href.includes('twitter.com') && !href.includes('x.com')) links.push(href);
      });

      const hashtags = (text.match(/#[\w\u0080-\uffff]+/g) || []).map(h => h.slice(1).toLowerCase());
      const mentions = (text.match(/@[\w]+/g) || []).map(m => m.slice(1).toLowerCase());

      // Quote tweet: extract author + text of quoted content
      let quotedTweet = null;
      const quoteContainer = article.querySelector(SELS.quoteTweet);
      if (quoteContainer) {
        const qTextEl = quoteContainer.querySelector('[data-testid="tweetText"]');
        const qHandleEl = quoteContainer.querySelector('[data-testid="User-Name"] a[tabindex="-1"]');
        if (qTextEl) {
          quotedTweet = {
            text: qTextEl.innerText.trim().slice(0, 280),
            handle: qHandleEl ? (qHandleEl.getAttribute('href') || '').replace(/^\//, '').split('/')[0] : ''
          };
        }
      }

      // Thread detection: reply context div or very long multi-paragraph text
      const isThread = !!article.querySelector('[data-testid="tweet_reply_context"]') ||
        (text.split('\n\n').length >= 3 && text.length > 400);

      const words = normalized.split(/\s+/).filter(Boolean);
      const sentenceCount = Math.max(1, (text.match(/[.!?]+(?:\s|$)/g) || []).length);
      const pronouns = extractPronouns(words);

      return {
        id: tweetId || `${handle}-${fp}`,
        tweetId,
        tweetUrl,
        text,
        author: { handle, displayName },
        timestamp,
        metrics,
        media,
        links,
        hashtags,
        mentions,
        quotedTweet,
        isQuote: !!quoteContainer,
        isThread,
        textLength: text.length,
        wordCount: words.length,
        sentenceCount,
        avgWordsPerSentence: Math.round(words.length / sentenceCount),
        pronouns
      };
    } catch (e) {
      return null;
    }
  }

  function parseMetric(str) {
    if (!str) return 0;
    str = str.trim().replace(/,/g, '');
    if (!str) return 0;
    if (/k$/i.test(str)) return Math.round(parseFloat(str) * 1000);
    if (/m$/i.test(str)) return Math.round(parseFloat(str) * 1000000);
    return parseInt(str) || 0;
  }

  // ─── Expand "Show more" ───
  function expandTruncated() {
    document.querySelectorAll(SELS.showMore).forEach(el => {
      try { el.click(); } catch (e) {}
    });
  }

  function forceScroll() {
    const el = document.scrollingElement || document.documentElement;
    const before = el.scrollTop;
    el.scrollTop += 900 + Math.floor(Math.random() * 500);
    return el.scrollTop !== before;
  }

  function isLoading() {
    return !!document.querySelector(SELS.loadingSpinner);
  }

  function isAtAbsoluteEnd() {
    if (document.querySelector(SELS.emptyState)) return true;
    const el = document.scrollingElement || document.documentElement;
    return el.scrollTop + window.innerHeight >= el.scrollHeight - 100;
  }

  function capture() {
    expandTruncated();
    const articles = document.querySelectorAll(SELS.tweet);
    const batch = [];
    articles.forEach(article => {
      const item = extractTweet(article);
      if (item) { batch.push(item); totalCaptured++; }
    });
    if (batch.length === 0) consecutiveEmpty++;
    else consecutiveEmpty = 0;
    if (batch.length > 0) {
      try {
        chrome.runtime.sendMessage({ type: 'SCRAPER_BATCH', data: batch, totalCaptured, consecutiveEmpty });
      } catch (e) {
        console.warn('[Scraper] Send failed:', e.message);
      }
    }
    return batch.length;
  }

  async function runLoop() {
    running = true;
    startTime = Date.now();
    consecutiveEmpty = 0;
    console.log('[Scraper] === CAPTURE LOOP STARTING ===');
    await sleep(2500);
    (document.scrollingElement || document.documentElement).scrollTop = 0;
    await sleep(1000);

    while (running) {
      if (Date.now() - startTime > MAX_TIME_MS) { console.log('[Scraper] Time limit'); break; }
      if (totalCaptured >= MAX_BOOKMARKS) { console.log('[Scraper] Max bookmarks'); break; }

      const found = capture();
      const didScroll = forceScroll();

      if (isLoading()) {
        consecutiveEmpty = Math.max(0, consecutiveEmpty - 3);
        await sleep(1800);
        continue;
      }

      if (isAtAbsoluteEnd() && consecutiveEmpty >= 10 && !isLoading()) {
        const el = document.scrollingElement || document.documentElement;
        el.scrollTop = el.scrollHeight;
        await sleep(3000);
        capture();
        if (consecutiveEmpty >= 12) { console.log('[Scraper] End of bookmarks'); break; }
      }

      if (consecutiveEmpty >= MAX_EMPTY) { console.log('[Scraper] No new content'); break; }

      if (!didScroll && consecutiveEmpty >= 8) {
        const el = document.scrollingElement || document.documentElement;
        el.scrollTop = el.scrollHeight;
        await sleep(2500);
        const retry = capture();
        if (retry === 0 && !isLoading()) { console.log('[Scraper] Cannot scroll'); break; }
      }

      const waitMs = found > 0 ? 500 : consecutiveEmpty < 5 ? 800 : consecutiveEmpty < 15 ? 1200 : 2000;
      await sleep(waitMs);
    }

    running = false;
    console.log('[Scraper] === LOOP ENDED === Total:', totalCaptured);
    try { chrome.runtime.sendMessage({ type: 'SCRAPER_COMPLETE', totalCaptured, duration: Date.now() - startTime }); } catch (e) {}
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function connectPort() {
    try {
      port = chrome.runtime.connect({ name: 'scraper-keepalive' });
      port.onDisconnect.addListener(() => {
        port = null;
        if (running) setTimeout(connectPort, 500);
      });
      const pingInterval = setInterval(() => {
        if (!running || !port) { clearInterval(pingInterval); return; }
        try { port.postMessage({ type: 'PING', totalCaptured, running }); } catch (e) { clearInterval(pingInterval); }
      }, 5000);
    } catch (e) {
      if (running) setTimeout(connectPort, 1000);
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPER_INIT') {
      if (!location.href.includes('/i/bookmarks')) { sendResponse({ success: false, error: 'Not on bookmarks page' }); return true; }
      if (!document.querySelector('[data-testid="primaryColumn"]')) { sendResponse({ success: false, error: 'Page not loaded' }); return true; }
      sendResponse({ success: true });
      return true;
    }
    if (msg.type === 'SCRAPER_START') {
      if (!running) { connectPort(); runLoop(); }
      sendResponse({ started: true });
      return true;
    }
    if (msg.type === 'SCRAPER_STOP') {
      running = false;
      sendResponse({ stopped: true, totalCaptured });
      return true;
    }
    if (msg.type === 'PING') {
      sendResponse({ alive: true, running, totalCaptured });
      return true;
    }
    return false;
  });

  chrome.runtime.sendMessage({ type: 'SCRAPER_READY' }).catch(() => {});
  console.log('[Scraper] v4 ready');
})();
