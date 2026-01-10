// background/service-worker.js - Orchestrates scraping and inference
// Self-contained - no ES module imports for compatibility

// ============================================
// STORAGE MANAGER
// ============================================

class StorageManager {
  constructor() {
    this.dbName = 'ConsciousnessAnalyzer';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('analyses')) {
          const analysesStore = db.createObjectStore('analyses', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          analysesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarksStore = db.createObjectStore('bookmarks', { 
            keyPath: 'id' 
          });
          bookmarksStore.createIndex('analysisId', 'analysisId', { unique: false });
          bookmarksStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async getDb() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  async saveAnalysis(analysisData) {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['analyses', 'bookmarks'], 'readwrite');
      const analysesStore = transaction.objectStore('analyses');
      const bookmarksStore = transaction.objectStore('bookmarks');

      const analysisRecord = {
        timestamp: analysisData.timestamp,
        bookmarkCount: analysisData.bookmarkCount,
        results: analysisData.results,
        duration: analysisData.duration
      };

      const analysisRequest = analysesStore.add(analysisRecord);

      analysisRequest.onsuccess = () => {
        const analysisId = analysisRequest.result;

        const bookmarkPromises = analysisData.bookmarks.map(bookmark => {
          return new Promise((res, rej) => {
            const bookmarkRecord = {
              ...bookmark,
              analysisId,
              id: `${analysisId}_${bookmark.id}`
            };
            const req = bookmarksStore.put(bookmarkRecord);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
          });
        });

        Promise.all(bookmarkPromises)
          .then(() => resolve(analysisId))
          .catch(reject);
      };

      analysisRequest.onerror = () => reject(analysisRequest.error);
    });
  }

  async getLastAnalysis() {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['analyses'], 'readonly');
      const store = transaction.objectStore('analyses');
      const index = store.index('timestamp');
      
      const request = index.openCursor(null, 'prev');
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          resolve({ ...cursor.value, id: cursor.primaryKey });
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getAnalysis(id) {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['analyses'], 'readonly');
      const store = transaction.objectStore('analyses');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllAnalyses() {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['analyses'], 'readonly');
      const store = transaction.objectStore('analyses');
      const index = store.index('timestamp');
      const results = [];
      
      const request = index.openCursor(null, 'prev');
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push({ ...cursor.value, id: cursor.primaryKey });
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================
// TOPIC TAXONOMY
// ============================================

class TopicTaxonomy {
  constructor() {
    this.taxonomy = {
      // Technology
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'gpt', 'chatgpt', 'llm', 'neural', 'deep learning', 'claude', 'gemini', 'openai', 'anthropic'],
      'programming': ['code', 'coding', 'programming', 'developer', 'software', 'javascript', 'python', 'rust', 'typescript', 'react', 'node', 'api', 'backend', 'frontend', 'fullstack', 'github', 'git'],
      'technology': ['tech', 'technology', 'digital', 'app', 'startup', 'saas', 'cloud', 'aws', 'infrastructure'],
      'crypto': ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'web3', 'defi', 'nft', 'solana', 'token'],
      'data': ['data', 'analytics', 'database', 'sql', 'visualization', 'dashboard', 'metrics'],
      
      // Business & Career
      'business': ['business', 'company', 'enterprise', 'corporate', 'b2b', 'revenue', 'profit'],
      'startup': ['startup', 'founder', 'vc', 'venture', 'fundraising', 'seed', 'series', 'yc', 'accelerator'],
      'marketing': ['marketing', 'growth', 'seo', 'content', 'brand', 'advertising', 'audience', 'conversion'],
      'finance': ['finance', 'investing', 'stocks', 'market', 'trading', 'portfolio', 'wealth', 'money'],
      'productivity': ['productivity', 'focus', 'habits', 'routine', 'efficiency', 'gtd', 'notion', 'obsidian'],
      'career': ['career', 'job', 'hiring', 'interview', 'resume', 'promotion', 'salary', 'remote work'],
      'leadership': ['leadership', 'management', 'team', 'culture', 'ceo', 'executive', 'coaching'],
      
      // Ideas & Knowledge
      'philosophy': ['philosophy', 'meaning', 'existence', 'ethics', 'morality', 'wisdom', 'stoic', 'consciousness'],
      'psychology': ['psychology', 'mental', 'cognitive', 'behavior', 'mind', 'therapy', 'anxiety', 'depression', 'trauma', 'adhd'],
      'science': ['science', 'research', 'study', 'experiment', 'discovery', 'physics', 'biology', 'chemistry', 'neuroscience'],
      'writing': ['writing', 'writer', 'essay', 'book', 'author', 'storytelling', 'newsletter', 'substack', 'blog'],
      'education': ['education', 'learning', 'school', 'university', 'course', 'tutorial', 'teaching'],
      
      // Lifestyle
      'health': ['health', 'fitness', 'exercise', 'nutrition', 'diet', 'sleep', 'wellness', 'workout', 'gym', 'running'],
      'relationships': ['relationship', 'dating', 'marriage', 'family', 'friendship', 'love', 'parenting', 'kids'],
      'creativity': ['creative', 'creativity', 'art', 'design', 'aesthetic', 'beauty', 'photography', 'illustration'],
      'food': ['food', 'cooking', 'recipe', 'restaurant', 'cuisine', 'chef', 'meal'],
      'travel': ['travel', 'trip', 'vacation', 'destination', 'adventure', 'explore', 'nomad'],
      
      // Society & Culture
      'politics': ['politics', 'political', 'government', 'policy', 'election', 'democracy', 'vote', 'congress'],
      'culture': ['culture', 'society', 'social', 'cultural', 'trend', 'generation', 'millennial', 'gen z'],
      'economics': ['economics', 'economy', 'inflation', 'gdp', 'recession', 'federal reserve', 'interest rate'],
      'media': ['media', 'news', 'journalism', 'press', 'podcast', 'youtube', 'twitter', 'social media'],
      
      // Entertainment
      'entertainment': ['movie', 'film', 'tv', 'show', 'series', 'netflix', 'streaming', 'cinema'],
      'gaming': ['game', 'gaming', 'video game', 'esports', 'playstation', 'xbox', 'nintendo', 'steam'],
      'music': ['music', 'song', 'album', 'artist', 'concert', 'spotify', 'playlist'],
      'sports': ['sports', 'football', 'basketball', 'soccer', 'nba', 'nfl', 'athlete', 'championship'],
      
      // Other
      'humor': ['funny', 'humor', 'joke', 'meme', 'comedy', 'lol', 'hilarious'],
      'motivation': ['motivation', 'inspire', 'inspiring', 'mindset', 'success', 'goals', 'discipline'],
      'environment': ['climate', 'environment', 'sustainability', 'green', 'carbon', 'renewable', 'nature']
    };

    this.categoryMap = {
      'ai': 'technology', 'programming': 'technology', 'technology': 'technology', 'crypto': 'technology', 'data': 'technology',
      'business': 'business', 'startup': 'business', 'marketing': 'business', 'finance': 'business',
      'productivity': 'personal', 'career': 'personal', 'leadership': 'personal', 'motivation': 'personal',
      'philosophy': 'ideas', 'psychology': 'ideas', 'science': 'ideas', 'writing': 'ideas', 'education': 'ideas',
      'health': 'lifestyle', 'relationships': 'lifestyle', 'creativity': 'lifestyle', 'food': 'lifestyle', 'travel': 'lifestyle',
      'politics': 'society', 'culture': 'society', 'economics': 'society', 'media': 'society', 'environment': 'society',
      'entertainment': 'entertainment', 'gaming': 'entertainment', 'music': 'entertainment', 'sports': 'entertainment', 'humor': 'entertainment'
    };
  }

  extract(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found = [];

    for (const [topic, keywords] of Object.entries(this.taxonomy)) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          found.push(topic);
          break;
        }
      }
    }

    return [...new Set(found)];
  }

  getCategory(topic) {
    return this.categoryMap[topic] || 'other';
  }
}

// ============================================
// INFERENCE ENGINE
// ============================================

// ============================================
// ENHANCED INFERENCE ENGINE
// ============================================

// ============================================
// DEEP PSYCHOLOGICAL INFERENCE ENGINE
// ============================================

// ============================================
// DEEP PSYCHOLOGICAL INFERENCE ENGINE
// Derives meaning from patterns, not just categories
// ============================================

class InferenceEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.bookmarks = [];
    
    // Raw aggregations
    this.authorEngagement = {};
    this.domainCounts = {};
    this.hourlyActivity = new Array(24).fill(0);
    this.dayActivity = new Array(7).fill(0);
    
    // Deep pattern tracking
    this.emotionalPatterns = {
      excitement: 0, skepticism: 0, agreement: 0, disagreement: 0,
      curiosity: 0, advice: 0, personal: 0, vulnerability: 0,
      ambition: 0, gratitude: 0, frustration: 0, humor: 0, wisdom: 0
    };
    
    this.contentPatterns = {
      instructional: 0, opinion: 0, news: 0, promotion: 0,
      questions: 0, declarations: 0
    };
    
    this.intellectualPatterns = {
      technical: 0, abstract: 0, dataOriented: 0, nuanced: 0
    };
    
    this.engagementBehavior = {
      totalLikes: 0, totalReposts: 0, viralContent: 0, nicheContent: 0,
      verifiedAuthors: 0, regularAuthors: 0
    };
    
    this.contentCharacteristics = {
      threads: 0, quotes: 0, replies: 0, withMedia: 0, withLinks: 0,
      longForm: 0, shortForm: 0
    };
    
    // Word and theme tracking
    this.significantWords = {};
    this.mentionedPeople = {};
    this.hashtagThemes = {};
    this.linkedDomains = {};
    
    // For psychological derivation
    this.narrativeElements = [];
    this.contradictions = [];
    this.obsessions = [];
  }

  processBatch(batch) {
    for (const item of batch) {
      this.bookmarks.push(item);
      this.processItem(item);
    }
    return this.getIntermediateResults();
  }

  processItem(item) {
    // Track author relationships
    const handle = item.author?.handle || 'unknown';
    if (!this.authorEngagement[handle]) {
      this.authorEngagement[handle] = {
        count: 0, verified: false, displayName: '',
        emotionalTone: [], contentTypes: [], totalLikes: 0
      };
    }
    this.authorEngagement[handle].count++;
    if (item.author?.verified) this.authorEngagement[handle].verified = true;
    if (item.author?.displayName) this.authorEngagement[handle].displayName = item.author.displayName;
    if (item.metrics?.likes) this.authorEngagement[handle].totalLikes += item.metrics.likes;

    // Track temporal patterns
    if (item.timestamp) {
      try {
        const date = new Date(item.timestamp);
        if (!isNaN(date)) {
          this.hourlyActivity[date.getHours()]++;
          this.dayActivity[date.getDay()]++;
        }
      } catch (e) {}
    }

    // Process deep content analysis
    const ca = item.contentAnalysis || {};
    
    // Emotional patterns
    if (ca.hasExcitement) this.emotionalPatterns.excitement++;
    if (ca.hasSkepticism) this.emotionalPatterns.skepticism++;
    if (ca.hasAgreement) this.emotionalPatterns.agreement++;
    if (ca.hasDisagreement) this.emotionalPatterns.disagreement++;
    if (ca.hasCuriosity) this.emotionalPatterns.curiosity++;
    if (ca.hasAdvice) this.emotionalPatterns.advice++;
    if (ca.hasPersonal) this.emotionalPatterns.personal++;
    if (ca.hasVulnerability) this.emotionalPatterns.vulnerability++;
    if (ca.hasAmbition) this.emotionalPatterns.ambition++;
    if (ca.hasGratitude) this.emotionalPatterns.gratitude++;
    if (ca.hasFrustration) this.emotionalPatterns.frustration++;
    if (ca.hasHumor) this.emotionalPatterns.humor++;
    if (ca.hasWisdom) this.emotionalPatterns.wisdom++;

    // Content patterns
    if (ca.isInstructional) this.contentPatterns.instructional++;
    if (ca.isOpinion) this.contentPatterns.opinion++;
    if (ca.isNews) this.contentPatterns.news++;
    if (ca.isPromotion) this.contentPatterns.promotion++;
    if (ca.isQuestion) this.contentPatterns.questions++;
    if (ca.isDeclarative) this.contentPatterns.declarations++;

    // Intellectual patterns
    if (ca.hasTechnicalTerms) this.intellectualPatterns.technical++;
    if (ca.hasAbstraction) this.intellectualPatterns.abstract++;
    if (ca.hasData) this.intellectualPatterns.dataOriented++;
    if (ca.hasNuance) this.intellectualPatterns.nuanced++;

    // Track mentions and hashtags
    if (ca.mentionsList) {
      for (const m of ca.mentionsList) {
        this.mentionedPeople[m] = (this.mentionedPeople[m] || 0) + 1;
      }
    }
    if (ca.hashtagsList) {
      for (const h of ca.hashtagsList) {
        this.hashtagThemes[h] = (this.hashtagThemes[h] || 0) + 1;
      }
    }

    // Engagement behavior
    if (item.metrics) {
      this.engagementBehavior.totalLikes += item.metrics.likes || 0;
      this.engagementBehavior.totalReposts += item.metrics.reposts || 0;
      if (item.metrics.likes > 5000) this.engagementBehavior.viralContent++;
      if (item.metrics.likes < 100) this.engagementBehavior.nicheContent++;
    }
    
    if (item.author?.verified) {
      this.engagementBehavior.verifiedAuthors++;
    } else {
      this.engagementBehavior.regularAuthors++;
    }

    // Content characteristics
    if (item.isThread) this.contentCharacteristics.threads++;
    if (item.isQuote) this.contentCharacteristics.quotes++;
    if (item.isReply) this.contentCharacteristics.replies++;
    if (item.media?.length > 0) this.contentCharacteristics.withMedia++;
    if (item.links?.length > 0) this.contentCharacteristics.withLinks++;
    if (item.textLength > 400) this.contentCharacteristics.longForm++;
    if (item.textLength < 100) this.contentCharacteristics.shortForm++;

    // Track domains
    if (item.links) {
      for (const link of item.links) {
        if (link.domain) {
          this.linkedDomains[link.domain] = (this.linkedDomains[link.domain] || 0) + 1;
        }
      }
    }

    // Extract significant words for theme detection
    this.extractSignificantWords(item.text);
  }

  extractSignificantWords(text) {
    if (!text) return;
    
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
      'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
      'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some',
      'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look',
      'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after',
      'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
      'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
      'is', 'are', 'was', 'been', 'being', 'has', 'had', 'does', 'did',
      'https', 'http', 'www', 'com', 'rt', 'via', 'amp', 'really', 'very',
      'dont', 'cant', 'wont', 'didnt', 'youre', 'thats', 'its', 'ive',
      'much', 'many', 'more', 'still', 'got', 'going', 'thing', 'things'
    ]);

    const words = text.toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w));

    for (const word of words) {
      this.significantWords[word] = (this.significantWords[word] || 0) + 1;
    }
  }

  getIntermediateResults() {
    const topWords = Object.entries(this.significantWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    const topAuthors = Object.entries(this.authorEngagement)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([handle, data]) => [handle, data.count]);

    return {
      itemCount: this.bookmarks.length,
      topTopics: topWords,
      topAuthors,
      confidence: Math.min(this.bookmarks.length / 150, 1)
    };
  }

  async finalize() {
    console.log('[Inference] Building deep psychological profile from', this.bookmarks.length, 'bookmarks');

    try {
      // Generate all analyses
      const psychProfile = this.buildPsychologicalProfile();
      const cognitiveStyle = this.analyzeCognitiveStyle();
      const emotionalLandscape = this.analyzeEmotionalLandscape();
      const socialOrientation = this.analyzeSocialOrientation();
      const intellectualCharacter = this.analyzeIntellectualCharacter();
      const informationDiet = this.analyzeInformationDiet();
      const hiddenPatterns = this.findHiddenPatterns();
      const blindSpots = this.identifyBlindSpots();
      const coreNarrative = this.constructCoreNarrative();
      const authors = this.analyzeAuthorRelationships();
      const temporal = this.analyzeTemporalPatterns();
      const vocabulary = this.analyzeVocabulary();

      return {
        summary: {
          totalBookmarks: this.bookmarks.length,
          uniqueAuthors: Object.keys(this.authorEngagement).length,
          timeSpan: this.calculateTimeSpan()
        },
        psychProfile,
        cognitiveStyle,
        emotionalLandscape,
        socialOrientation,
        intellectualCharacter,
        informationDiet,
        hiddenPatterns,
        blindSpots,
        coreNarrative,
        authors,
        temporal,
        vocabulary,
        // Keep some raw data for display
        raw: {
          emotionalPatterns: this.emotionalPatterns,
          contentPatterns: this.contentPatterns,
          intellectualPatterns: this.intellectualPatterns,
          engagementBehavior: this.engagementBehavior
        }
      };
    } catch (error) {
      console.error('[Inference] Error in finalize:', error);
      return this.getMinimalResults();
    }
  }

  buildPsychologicalProfile() {
    const n = this.bookmarks.length || 1;
    const ep = this.emotionalPatterns;
    const cp = this.contentPatterns;
    const ip = this.intellectualPatterns;

    // Calculate psychological dimensions
    const openness = (ep.curiosity + ip.abstract + ip.nuanced + ep.wisdom) / n;
    const conscientiousness = (cp.instructional + ep.advice + ip.dataOriented) / n;
    const extraversion = (ep.excitement + ep.humor + ep.agreement) / n;
    const agreeableness = (ep.gratitude + ep.agreement - ep.disagreement - ep.frustration) / n;
    const neuroticism = (ep.vulnerability + ep.frustration + ep.skepticism) / n;

    // Determine primary drives
    const drives = [];
    if (ep.ambition > n * 0.1) drives.push('Achievement and growth');
    if (ep.curiosity > n * 0.15) drives.push('Understanding and discovery');
    if (ep.wisdom > n * 0.08) drives.push('Meaning and truth-seeking');
    if (cp.instructional > n * 0.1) drives.push('Mastery and competence');
    if (ep.personal > n * 0.1) drives.push('Self-expression and authenticity');

    // Determine core fears/anxieties (from what they seek reassurance in)
    const anxieties = [];
    if (ep.advice > n * 0.15) anxieties.push('Fear of making wrong decisions');
    if (ep.vulnerability > n * 0.05) anxieties.push('Comfort with imperfection');
    if (this.engagementBehavior.viralContent > n * 0.3) anxieties.push('Need for social validation');
    if (ep.skepticism > n * 0.1) anxieties.push('Distrust of easy answers');

    // Determine archetype
    const archetype = this.determineArchetype(ep, cp, ip, n);

    return {
      archetype,
      dimensions: {
        openness: Math.min(Math.max(openness * 10, 0), 10),
        conscientiousness: Math.min(Math.max(conscientiousness * 10, 0), 10),
        extraversion: Math.min(Math.max(extraversion * 10, 0), 10),
        agreeableness: Math.min(Math.max((agreeableness + 0.5) * 10, 0), 10),
        neuroticism: Math.min(Math.max(neuroticism * 10, 0), 10)
      },
      drives: drives.slice(0, 4),
      anxieties: anxieties.slice(0, 3),
      coreMotivation: this.deriveCoreMotivation(ep, cp, ip, n)
    };
  }

  determineArchetype(ep, cp, ip, n) {
    const scores = {
      'The Seeker': ep.curiosity + ep.wisdom + ip.abstract,
      'The Builder': ep.ambition + cp.instructional + ip.technical,
      'The Analyst': ip.dataOriented + ip.nuanced + ep.skepticism,
      'The Philosopher': ip.abstract + ep.wisdom + ep.personal,
      'The Strategist': ep.ambition + cp.opinion + ip.nuanced,
      'The Creator': ep.personal + ep.humor + this.contentCharacteristics.withMedia,
      'The Scholar': cp.instructional + ip.dataOriented + this.contentCharacteristics.longForm,
      'The Connector': ep.agreement + ep.gratitude + this.engagementBehavior.regularAuthors / 10,
      'The Rebel': ep.disagreement + ep.frustration + ep.skepticism,
      'The Sage': ep.wisdom + ep.advice + ip.nuanced
    };

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    const archetypeDescriptions = {
      'The Seeker': 'Driven by an insatiable curiosity, thou art drawn to the edges of knowledge where questions outnumber answers. Thy bookmarks reveal a mind that finds comfort in uncertainty and joy in discovery.',
      'The Builder': 'Thy collection speaks of one who sees the world as raw material for creation. Where others see problems, thou seest projects. Thy mind naturally architects solutions.',
      'The Analyst': 'Numbers and nuance are thy native tongue. Thy bookmarks reveal a mind that distrusts surface explanations, always seeking the data beneath the narrative.',
      'The Philosopher': 'Meaning-maker and pattern-finder, thy collection reveals a mind drawn to the deeper questions. Thou art less interested in how than in why.',
      'The Strategist': 'Thy bookmarks map a mind that thinks in systems and leverage. Every piece of information is evaluated for its strategic utility.',
      'The Creator': 'Expression flows through thee like water. Thy collection reveals an aesthetic sensibility and a need to manifest inner vision in tangible form.',
      'The Scholar': 'Knowledge is thy currency, and thy collection is a library of the mind. Depth over breadth, mastery over familiarity.',
      'The Connector': 'Thy bookmarks reveal a mind attuned to the human element. Relationships and community form the fabric of thy intellectual world.',
      'The Rebel': 'Thou savest what challenges, what disrupts, what questions the accepted order. Thy collection is a armory of alternative perspectives.',
      'The Sage': 'Wisdom-keeper and truth-teller, thy bookmarks reveal a mind that distills complexity into clarity for others to learn.'
    };

    return {
      primary: sorted[0][0],
      secondary: sorted[1][0],
      description: archetypeDescriptions[sorted[0][0]],
      confidence: sorted[0][1] / Math.max(sorted[1][1], 1)
    };
  }

  deriveCoreMotivation(ep, cp, ip, n) {
    // What fundamental need does this person's bookmark behavior reveal?
    const motivations = [];

    if (ep.ambition + cp.instructional > n * 0.2) {
      motivations.push({
        drive: 'Self-Improvement',
        insight: 'Thy collection reveals a deep commitment to becoming. Each bookmark is a stepping stone on a path of deliberate growth.'
      });
    }

    if (ep.curiosity + ip.abstract > n * 0.15) {
      motivations.push({
        drive: 'Understanding',
        insight: 'The mind hungers to comprehend. Thy bookmarks trace the outline of a world-model under constant construction.'
      });
    }

    if (ep.personal + ep.vulnerability > n * 0.08) {
      motivations.push({
        drive: 'Authenticity',
        insight: 'Beneath the surface lies a search for the genuine. Thou art drawn to voices that speak uncomfortable truths.'
      });
    }

    if (this.engagementBehavior.viralContent > n * 0.25) {
      motivations.push({
        drive: 'Relevance',
        insight: 'Staying current matters deeply. Thy bookmarks ensure thou remainest connected to the collective conversation.'
      });
    }

    if (ep.wisdom + ep.advice > n * 0.15) {
      motivations.push({
        drive: 'Wisdom',
        insight: 'Not mere knowledge but applied understanding. Thy collection is curated for actionable insight.'
      });
    }

    return motivations.slice(0, 3);
  }

  analyzeCognitiveStyle() {
    const n = this.bookmarks.length || 1;
    const ip = this.intellectualPatterns;
    const cp = this.contentPatterns;
    const cc = this.contentCharacteristics;

    // Determine thinking style
    const analytical = (ip.dataOriented + ip.technical + cp.instructional) / n;
    const intuitive = (ip.abstract + ip.nuanced + this.emotionalPatterns.wisdom) / n;
    const practical = (this.emotionalPatterns.advice + cp.instructional) / n;
    const creative = (this.emotionalPatterns.humor + cc.withMedia / Math.max(n, 1)) / n;

    const styles = [
      { name: 'Analytical', score: analytical },
      { name: 'Intuitive', score: intuitive },
      { name: 'Practical', score: practical },
      { name: 'Creative', score: creative }
    ].sort((a, b) => b.score - a.score);

    // Information processing style
    const depthVsBreadth = cc.longForm > cc.shortForm ? 'depth' : 'breadth';
    const consumptionStyle = cc.threads > n * 0.1 ? 'sequential' : 'atomic';

    return {
      primaryMode: styles[0].name,
      secondaryMode: styles[1].name,
      scores: {
        analytical: Math.round(analytical * 100),
        intuitive: Math.round(intuitive * 100),
        practical: Math.round(practical * 100),
        creative: Math.round(creative * 100)
      },
      processingStyle: {
        depthVsBreadth,
        consumptionStyle,
        description: this.describeCognitiveStyle(styles[0].name, depthVsBreadth, consumptionStyle)
      }
    };
  }

  describeCognitiveStyle(primary, depth, consumption) {
    const descriptions = {
      'Analytical-depth-sequential': 'Thy mind is a precision instrument, dissecting complex systems layer by layer. Thou preferest thorough understanding to quick summaries.',
      'Analytical-breadth-atomic': 'A collector of facts and figures, thy mind catalogues information efficiently, building understanding through accumulation.',
      'Intuitive-depth-sequential': 'Meaning emerges for thee through contemplation. Thou followest threads of thought to their philosophical conclusions.',
      'Intuitive-breadth-atomic': 'Pattern-recognition defines thy cognition. Thou absorbest diverse inputs and synthesizest unexpected connections.',
      'Practical-depth-sequential': 'Mastery through method. Thy mind seeks proven frameworks and follows them to competence.',
      'Practical-breadth-atomic': 'A pragmatic scanner of solutions. Thou collectest tools and tactics for deployment when needed.',
      'Creative-depth-sequential': 'The artist\'s mind, dwelling in ideas until they crystallize into vision.',
      'Creative-breadth-atomic': 'Inspiration strikes from all directions. Thy collection is a mood board for the imagination.'
    };

    return descriptions[`${primary}-${depth}-${consumption}`] || 
           `Thy mind blends ${primary.toLowerCase()} thinking with a preference for ${depth} and ${consumption} processing.`;
  }

  analyzeEmotionalLandscape() {
    const ep = this.emotionalPatterns;
    const n = this.bookmarks.length || 1;

    // Calculate emotional ratios
    const positiveEmotions = ep.excitement + ep.gratitude + ep.humor + ep.agreement;
    const negativeEmotions = ep.frustration + ep.skepticism + ep.disagreement;
    const vulnerableEmotions = ep.vulnerability + ep.personal;
    const intellectualEmotions = ep.curiosity + ep.wisdom;

    const valence = (positiveEmotions - negativeEmotions) / Math.max(positiveEmotions + negativeEmotions, 1);

    // Emotional themes
    const themes = [];
    if (ep.curiosity > n * 0.15) themes.push('Intellectual wonder');
    if (ep.ambition > n * 0.1) themes.push('Aspirational energy');
    if (ep.humor > n * 0.1) themes.push('Levity and play');
    if (ep.vulnerability > n * 0.05) themes.push('Authentic struggle');
    if (ep.skepticism > n * 0.1) themes.push('Critical discernment');
    if (ep.gratitude > n * 0.05) themes.push('Appreciation');

    return {
      valence: valence > 0.2 ? 'predominantly positive' : valence < -0.2 ? 'critically engaged' : 'balanced',
      themes: themes.slice(0, 4),
      insight: this.deriveEmotionalInsight(ep, n),
      dominantEmotion: this.getDominantEmotion(ep),
      emotionalRange: Object.values(ep).filter(v => v > 0).length
    };
  }

  getDominantEmotion(ep) {
    const sorted = Object.entries(ep).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  deriveEmotionalInsight(ep, n) {
    if (ep.curiosity > ep.excitement && ep.curiosity > n * 0.15) {
      return 'Thy emotional life is animated primarily by intellectual curiosity—the thrill of understanding exceeds the pleasure of entertainment.';
    }
    if (ep.ambition > n * 0.12) {
      return 'A restless energy pervades thy collection. Contentment comes not from arrival but from progress along the path.';
    }
    if (ep.vulnerability + ep.personal > n * 0.1) {
      return 'Thou art drawn to authentic expression, saving content that dares to be imperfect and human.';
    }
    if (ep.skepticism > n * 0.1) {
      return 'A critical eye guards thy attention. Thy bookmarks reveal a mind that questions before it accepts.';
    }
    if (ep.humor > n * 0.12) {
      return 'Joy and levity leaven thy collection. Thou understandest that wisdom need not be solemn.';
    }
    return 'Thy emotional engagement with content is measured and balanced, neither detached nor overwhelmed.';
  }

  analyzeSocialOrientation() {
    const eb = this.engagementBehavior;
    const n = this.bookmarks.length || 1;
    const ep = this.emotionalPatterns;

    // Authority orientation
    const authorityBalance = eb.verifiedAuthors / Math.max(eb.regularAuthors, 1);
    
    // Viral vs niche preference
    const mainstreamVsNiche = eb.viralContent / Math.max(eb.nicheContent, 1);

    // Agreement patterns
    const conformityIndex = ep.agreement / Math.max(ep.disagreement, 1);

    // Determine social stance
    let socialStance;
    if (authorityBalance > 2 && mainstreamVsNiche > 1.5) {
      socialStance = 'Establishment-aligned';
    } else if (authorityBalance < 0.5 && mainstreamVsNiche < 0.7) {
      socialStance = 'Counter-cultural';
    } else if (eb.nicheContent > n * 0.4) {
      socialStance = 'Niche explorer';
    } else {
      socialStance = 'Eclectic curator';
    }

    return {
      socialStance,
      authorityOrientation: authorityBalance > 1.5 ? 'Defers to established voices' : 
                          authorityBalance < 0.5 ? 'Seeks emerging voices' : 'Balanced across sources',
      contentDiscovery: mainstreamVsNiche > 1.5 ? 'Mainstream-focused' :
                       mainstreamVsNiche < 0.7 ? 'Off-the-beaten-path' : 'Mixed discovery',
      insight: this.deriveSocialInsight(authorityBalance, mainstreamVsNiche, conformityIndex)
    };
  }

  deriveSocialInsight(authority, mainstream, conformity) {
    if (authority < 0.5 && mainstream < 0.7) {
      return 'Thy bookmarks reveal a mind that seeks signal in the noise, valuing insight over influence. Thou findest truth in unexpected places.';
    }
    if (authority > 2 && conformity > 2) {
      return 'Thou drawest from established wells of wisdom, preferring proven voices to untested ones. There is wisdom in trusting expertise.';
    }
    if (mainstream > 2) {
      return 'Thy collection mirrors the zeitgeist. Thou stayest connected to the collective conversation, ensuring relevance and shared context.';
    }
    return 'Thy social orientation is balanced—neither contrarian nor conformist, but discerning.';
  }

  analyzeIntellectualCharacter() {
    const ip = this.intellectualPatterns;
    const cp = this.contentPatterns;
    const n = this.bookmarks.length || 1;

    // Determine intellectual identity
    const theoretical = ip.abstract + ip.nuanced;
    const empirical = ip.dataOriented + ip.technical;
    const applied = cp.instructional + this.emotionalPatterns.advice;

    const identity = theoretical > empirical && theoretical > applied ? 'Theoretical' :
                    empirical > applied ? 'Empirical' : 'Applied';

    // Rigor level
    const rigorScore = (ip.nuanced + ip.dataOriented) / n;
    const rigor = rigorScore > 0.15 ? 'High' : rigorScore > 0.08 ? 'Moderate' : 'Accessible';

    // Learning orientation
    const learningStyle = cp.instructional > cp.opinion ? 'How-focused' : 'Why-focused';

    return {
      identity,
      rigor,
      learningStyle,
      scores: {
        theoretical: Math.round((theoretical / n) * 100),
        empirical: Math.round((empirical / n) * 100),
        applied: Math.round((applied / n) * 100)
      },
      insight: this.deriveIntellectualInsight(identity, rigor, learningStyle)
    };
  }

  deriveIntellectualInsight(identity, rigor, learning) {
    const insights = {
      'Theoretical-High-Why-focused': 'Thy mind dwells in the realm of ideas and principles. Thou seekest not merely to know, but to understand at the deepest level.',
      'Empirical-High-How-focused': 'Evidence is thy foundation. Thy collection reveals a mind that builds understanding on verified ground.',
      'Applied-Moderate-How-focused': 'Knowledge finds its worth in application. Thy bookmarks are tools waiting to be wielded.',
      'Theoretical-Moderate-Why-focused': 'Philosophy and practice intermingle in thy collection. Thou art building a worldview, piece by piece.'
    };
    
    return insights[`${identity}-${rigor}-${learning}`] || 
           `Thy intellectual character blends ${identity.toLowerCase()} orientation with ${rigor.toLowerCase()} rigor and a ${learning.toLowerCase()} approach.`;
  }

  analyzeInformationDiet() {
    const cc = this.contentCharacteristics;
    const n = this.bookmarks.length || 1;
    const domains = Object.entries(this.linkedDomains).sort((a, b) => b[1] - a[1]);

    // Content format preferences
    const formatProfile = {
      longForm: cc.longForm / n,
      shortForm: cc.shortForm / n,
      visual: cc.withMedia / n,
      threaded: cc.threads / n
    };

    // Source diversity
    const sourceDiversity = domains.length;
    const topSourceConcentration = domains.slice(0, 3).reduce((s, [, c]) => s + c, 0) / 
                                   Math.max(domains.reduce((s, [, c]) => s + c, 0), 1);

    // Categorize domains
    const domainCategories = this.categorizeDomains(domains.slice(0, 20));

    return {
      formatPreference: formatProfile.longForm > formatProfile.shortForm ? 'Long-form thinker' : 'Quick-hit consumer',
      visualOrientation: formatProfile.visual > 0.4 ? 'Highly visual' : formatProfile.visual > 0.2 ? 'Balanced' : 'Text-primary',
      sourceDiversity: sourceDiversity > 30 ? 'Broad' : sourceDiversity > 15 ? 'Moderate' : 'Focused',
      topDomains: domains.slice(0, 10),
      domainCategories,
      insight: this.deriveDietInsight(formatProfile, sourceDiversity, topSourceConcentration)
    };
  }

  categorizeDomains(domains) {
    const categories = {
      tech: ['github', 'stackoverflow', 'hackernews', 'techcrunch', 'verge', 'wired', 'dev.to'],
      news: ['nytimes', 'bbc', 'cnn', 'reuters', 'wsj', 'guardian', 'bloomberg'],
      learning: ['medium', 'substack', 'youtube', 'coursera', 'udemy'],
      social: ['reddit', 'linkedin', 'instagram'],
      research: ['arxiv', 'nature', 'science', 'pubmed', 'scholar']
    };

    const counts = { tech: 0, news: 0, learning: 0, social: 0, research: 0, other: 0 };
    
    for (const [domain, count] of domains) {
      let found = false;
      for (const [cat, patterns] of Object.entries(categories)) {
        if (patterns.some(p => domain.includes(p))) {
          counts[cat] += count;
          found = true;
          break;
        }
      }
      if (!found) counts.other += count;
    }

    return counts;
  }

  deriveDietInsight(format, diversity, concentration) {
    if (format.longForm > 0.3 && diversity > 25) {
      return 'Thy information diet is that of a scholar—deep, varied, and thoughtfully curated. Thou feedest thy mind with substance.';
    }
    if (format.visual > 0.5) {
      return 'The visual cortex dominates thy consumption. Images, charts, and screenshots speak to thee more directly than walls of text.';
    }
    if (concentration > 0.6) {
      return 'Thy sources are trusted and few. Depth of relationship with select voices matters more than breadth of exposure.';
    }
    return 'Thy information diet is balanced across formats and sources, suggesting an adaptive consumption style.';
  }

  findHiddenPatterns() {
    const patterns = [];
    const n = this.bookmarks.length || 1;
    const ep = this.emotionalPatterns;
    const cp = this.contentPatterns;

    // Contradiction detection
    if (ep.ambition > n * 0.1 && ep.vulnerability > n * 0.05) {
      patterns.push({
        pattern: 'The Ambitious Vulnerable',
        insight: 'Thy bookmarks reveal both fierce ambition and willingness to acknowledge struggle. This combination suggests authentic growth-orientation rather than performative success-seeking.'
      });
    }

    if (ep.skepticism > n * 0.08 && ep.agreement > n * 0.1) {
      patterns.push({
        pattern: 'The Selective Believer',
        insight: 'Critical of much, yet capable of wholehearted agreement when conviction strikes. Thy skepticism is not cynicism but discernment.'
      });
    }

    if (cp.instructional > n * 0.1 && ep.curiosity > n * 0.1) {
      patterns.push({
        pattern: 'The Learning Loop',
        insight: 'Thou savest both questions and answers, how-tos and whys. Thy mind operates in a continuous cycle of wonder and resolution.'
      });
    }

    // Engagement patterns
    if (this.engagementBehavior.nicheContent > this.engagementBehavior.viralContent * 1.5) {
      patterns.push({
        pattern: 'The Signal Seeker',
        insight: 'While others chase viral content, thy bookmarks favor the overlooked gem. Thou valuest insight over popularity.'
      });
    }

    // Temporal patterns
    const nightActivity = this.hourlyActivity.slice(22, 24).reduce((a, b) => a + b, 0) + 
                         this.hourlyActivity.slice(0, 5).reduce((a, b) => a + b, 0);
    if (nightActivity > n * 0.3) {
      patterns.push({
        pattern: 'The Night Mind',
        insight: 'Thy bookmarking peaks in the quiet hours. The night offers space for deeper engagement, away from the day\'s demands.'
      });
    }

    return patterns.slice(0, 5);
  }

  identifyBlindSpots() {
    const ep = this.emotionalPatterns;
    const ip = this.intellectualPatterns;
    const n = this.bookmarks.length || 1;
    const blindSpots = [];

    // Check for missing elements
    if (ep.humor < n * 0.05) {
      blindSpots.push({
        area: 'Levity',
        insight: 'Thy collection is earnest and serious. Consider: wisdom sometimes wears the mask of humor.'
      });
    }

    if (ep.vulnerability < n * 0.02) {
      blindSpots.push({
        area: 'Vulnerability',
        insight: 'Success stories dominate, struggles are rare. The full human experience includes the difficult chapters.'
      });
    }

    if (ip.abstract < n * 0.05 && ip.technical > n * 0.1) {
      blindSpots.push({
        area: 'Philosophy',
        insight: 'The how eclipses the why. Technique without theory may limit depth of understanding.'
      });
    }

    if (this.engagementBehavior.regularAuthors < this.engagementBehavior.verifiedAuthors * 0.3) {
      blindSpots.push({
        area: 'Emerging Voices',
        insight: 'Established authorities dominate thy feed. Fresh perspectives often come from unexpected sources.'
      });
    }

    if (ep.disagreement < n * 0.02) {
      blindSpots.push({
        area: 'Dissent',
        insight: 'Thy bookmarks largely agree with thee. Intellectual growth requires engaging with challenging perspectives.'
      });
    }

    return blindSpots.slice(0, 4);
  }

  constructCoreNarrative() {
    const archetype = this.buildPsychologicalProfile().archetype;
    const cognitive = this.analyzeCognitiveStyle();
    const emotional = this.analyzeEmotionalLandscape();
    const n = this.bookmarks.length;

    // Build a narrative paragraph
    const narratives = [];

    narratives.push(`Through ${n} saved moments, a portrait emerges: ${archetype.description}`);

    narratives.push(`Thy ${cognitive.primaryMode.toLowerCase()} mind processes the world through ${cognitive.processingStyle.depthVsBreadth}, preferring ${cognitive.processingStyle.consumptionStyle} engagement with ideas.`);

    narratives.push(emotional.insight);

    // Add a forward-looking element
    const growth = this.suggestGrowthAreas();
    if (growth) {
      narratives.push(`For continued growth: ${growth}`);
    }

    return {
      summary: narratives.join(' '),
      archetype: archetype.primary,
      secondaryArchetype: archetype.secondary
    };
  }

  suggestGrowthAreas() {
    const ep = this.emotionalPatterns;
    const ip = this.intellectualPatterns;
    const n = this.bookmarks.length || 1;

    if (ip.technical > n * 0.15 && ip.abstract < n * 0.05) {
      return 'Consider dwelling longer in the realm of why, not just how. Philosophy enriches technique.';
    }
    if (ep.agreement > ep.disagreement * 3) {
      return 'Seek out perspectives that challenge thy current views. Growth lives at the edge of discomfort.';
    }
    if (this.engagementBehavior.viralContent > n * 0.4) {
      return 'Venture beyond the popular into the overlooked. Original insight often hides in plain sight.';
    }
    if (ep.ambition > n * 0.15 && ep.gratitude < n * 0.03) {
      return 'The climb is noble, but pause sometimes to appreciate the view. Gratitude and ambition need not conflict.';
    }
    return null;
  }

  analyzeAuthorRelationships() {
    const authors = Object.entries(this.authorEngagement)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20);

    return authors.map(([handle, data]) => ({
      handle,
      displayName: data.displayName || handle,
      count: data.count,
      verified: data.verified,
      influence: data.count > 15 ? 'Major influence' : data.count > 7 ? 'Regular source' : 'Occasional',
      avgEngagement: data.count > 0 ? Math.round(data.totalLikes / data.count) : 0
    }));
  }

  analyzeTemporalPatterns() {
    const peakHour = this.hourlyActivity.indexOf(Math.max(...this.hourlyActivity));
    const peakDay = this.dayActivity.indexOf(Math.max(...this.dayActivity));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const nightOwl = (this.hourlyActivity.slice(22, 24).reduce((a, b) => a + b, 0) + 
                     this.hourlyActivity.slice(0, 4).reduce((a, b) => a + b, 0)) / this.bookmarks.length;

    return {
      peakHour,
      peakDay: dayNames[peakDay],
      hourlyDistribution: this.hourlyActivity,
      pattern: peakHour >= 22 || peakHour <= 4 ? 'Night Owl' :
              peakHour >= 5 && peakHour <= 8 ? 'Early Bird' :
              peakHour >= 9 && peakHour <= 12 ? 'Morning Mind' :
              peakHour >= 13 && peakHour <= 17 ? 'Afternoon Scholar' : 'Evening Philosopher',
      insight: nightOwl > 0.25 ? 
        'The quiet hours call to thee. Night offers sanctuary for deeper thought.' :
        'Thy engagement follows the sun, suggesting integration of learning into daily rhythm.'
    };
  }

  analyzeVocabulary() {
    const sorted = Object.entries(this.significantWords).sort((a, b) => b[1] - a[1]);
    const topWords = sorted.slice(0, 50);
    const hashtags = Object.entries(this.hashtagThemes).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const mentions = Object.entries(this.mentionedPeople).sort((a, b) => b[1] - a[1]).slice(0, 15);

    return {
      topWords,
      hashtags,
      mentions,
      uniqueWordCount: Object.keys(this.significantWords).length,
      vocabularyRichness: Object.keys(this.significantWords).length / Math.sqrt(this.bookmarks.length)
    };
  }

  calculateTimeSpan() {
    const timestamps = this.bookmarks
      .map(b => b.timestamp ? new Date(b.timestamp) : null)
      .filter(d => d && !isNaN(d))
      .sort((a, b) => a - b);
    
    if (timestamps.length < 2) return null;
    
    const days = Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60 * 24));
    return { days, months: Math.round(days / 30) };
  }

  getMinimalResults() {
    return {
      summary: { totalBookmarks: this.bookmarks.length, uniqueAuthors: 0 },
      psychProfile: { archetype: { primary: 'The Seeker', description: 'Analysis incomplete' }, dimensions: {}, drives: [], anxieties: [] },
      cognitiveStyle: { primaryMode: 'Unknown', scores: {} },
      emotionalLandscape: { themes: [], insight: 'Insufficient data' },
      socialOrientation: { socialStance: 'Unknown' },
      intellectualCharacter: { identity: 'Unknown', rigor: 'Unknown' },
      informationDiet: { formatPreference: 'Unknown', topDomains: [] },
      hiddenPatterns: [],
      blindSpots: [],
      coreNarrative: { summary: 'More bookmarks needed for deep analysis', archetype: 'The Seeker' },
      authors: [],
      temporal: { pattern: 'Unknown', hourlyDistribution: new Array(24).fill(0) },
      vocabulary: { topWords: [], hashtags: [], mentions: [] }
    };
  }
}
class AnalysisController {
  constructor() {
    this.status = 'idle';
    this.scraperTabId = null;
    this.currentAnalysis = null;
    this.inference = new InferenceEngine();
    this.storage = new StorageManager();
    this.tabUpdateListener = null;
    this.tabRemovedListener = null;
    this.alarmListener = null;
    this.tickCount = 0;
    this.noNewCount = 0;
    
    this.setupMessageListeners();
    console.log('[Controller] Consciousness Analyzer service worker initialized');
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'GET_STATUS':
          sendResponse(await this.getStatus());
          break;
          
        case 'START_ANALYSIS':
          sendResponse(await this.startAnalysis());
          break;
          
        case 'CANCEL_ANALYSIS':
          sendResponse(await this.cancelAnalysis());
          break;

        case 'STOP_AND_GENERATE':
          sendResponse(await this.stopAndGenerate());
          break;
          
        case 'OPEN_RESULTS':
          await this.openResultsPage();
          sendResponse({ success: true });
          break;

        case 'OPEN_HISTORY':
          await this.openHistoryPage();
          sendResponse({ success: true });
          break;

        case 'GET_HISTORY':
          const analyses = await this.storage.getAllAnalyses();
          sendResponse({ analyses: analyses || [] });
          break;

        case 'SCRAPER_READY':
          // Just acknowledge - initialization happens via SCRAPER_INIT
          console.log('[Controller] Scraper ready in tab:', sender.tab?.id);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Controller] Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async getStatus() {
    const lastAnalysis = await this.storage.getLastAnalysis();
    
    const response = {
      status: this.status,
      isRunning: this.status === 'running',
      startTime: this.currentAnalysis?.startTime || null,
      hasResults: lastAnalysis !== null,
      lastAnalysis: lastAnalysis ? {
        bookmarkCount: lastAnalysis.bookmarkCount,
        timestamp: lastAnalysis.timestamp,
        id: lastAnalysis.id
      } : null
    };
    
    // Add current progress if running
    if (this.status === 'running' && this.currentAnalysis) {
      response.progress = {
        bookmarks: this.currentAnalysis.bookmarks?.length || 0,
        bookmarkCount: this.currentAnalysis.bookmarks?.length || 0,
        status: 'Capturing scrolls...'
      };
      
      // Include top topics if available
      if (this.currentAnalysis.progress?.topTopics) {
        response.progress.topTopics = this.currentAnalysis.progress.topTopics;
      }
    }
    
    return response;
  }

  async stopAndGenerate() {
    console.log('[Controller] Stop and generate requested');
    console.log('[Controller] Current bookmarks:', this.currentAnalysis?.bookmarks?.length || 0);
    
    if (this.status !== 'running') {
      return { success: false, error: 'No analysis running' };
    }

    // Stop the tick loop first
    this.cleanupTickLoop();

    // Get final data from scraper
    if (this.scraperTabId) {
      try {
        const response = await chrome.tabs.sendMessage(this.scraperTabId, { type: 'SCRAPER_FINISH' });
        if (response?.remaining?.length > 0) {
          await this.processBatch(response.remaining);
        }
      } catch (e) {
        console.log('[Controller] Could not get final data:', e.message);
      }

      // Close the tab
      try {
        await chrome.tabs.remove(this.scraperTabId);
        console.log('[Controller] Closed scraper tab');
      } catch (e) {
        console.log('[Controller] Tab already closed');
      }
      this.scraperTabId = null;
    }

    // Clean up listeners
    if (this.tabUpdateListener) {
      chrome.tabs.onUpdated.removeListener(this.tabUpdateListener);
      this.tabUpdateListener = null;
    }
    if (this.tabRemovedListener) {
      chrome.tabs.onRemoved.removeListener(this.tabRemovedListener);
      this.tabRemovedListener = null;
    }

    // Generate results with whatever we have
    const bookmarkCount = this.currentAnalysis?.bookmarks?.length || 0;
    
    if (bookmarkCount === 0) {
      this.status = 'idle';
      this.currentAnalysis = null;
      return { success: false, error: 'No bookmarks captured yet' };
    }

    await this.finishAnalysis({ 
      totalCaptured: bookmarkCount,
      stoppedEarly: true 
    });

    return { success: true, bookmarkCount };
  }

  async startAnalysis() {
    if (this.status === 'running') {
      return { success: false, error: 'Analysis already in progress' };
    }

    try {
      this.status = 'running';
      this.currentAnalysis = {
        startTime: Date.now(),
        bookmarks: [],
        progress: { bookmarks: 0, progress: 0, status: 'Opening Twitter...' }
      };
      this.inference.reset();

      // Create tab for scraping
      console.log('[Controller] Creating scraper tab...');
      const tab = await chrome.tabs.create({
        url: 'https://x.com/i/bookmarks',
        active: true  // Must be active for scrolling to work
      });
      
      this.scraperTabId = tab.id;
      console.log('[Controller] Scraper tab created:', this.scraperTabId);
      
      // Listen for tab updates (page load)
      this.tabUpdateListener = (tabId, changeInfo, tabInfo) => {
        if (tabId === this.scraperTabId && changeInfo.status === 'complete') {
          console.log('[Controller] Tab loaded, URL:', tabInfo?.url);
          this.onTabLoaded();
        }
      };
      chrome.tabs.onUpdated.addListener(this.tabUpdateListener);

      // Listen for tab close
      this.tabRemovedListener = (tabId) => {
        if (tabId === this.scraperTabId) {
          console.log('[Controller] Scraper tab was closed');
          this.scraperTabId = null;
          
          // Clean up listeners
          if (this.tabUpdateListener) {
            chrome.tabs.onUpdated.removeListener(this.tabUpdateListener);
            this.tabUpdateListener = null;
          }
          chrome.tabs.onRemoved.removeListener(this.tabRemovedListener);
          this.tabRemovedListener = null;
          
          // If we have bookmarks, finish analysis
          if (this.currentAnalysis?.bookmarks?.length > 0) {
            console.log('[Controller] Tab closed with bookmarks, finishing analysis...');
            this.finishAnalysis({ totalCaptured: this.currentAnalysis.bookmarks.length, tabClosed: true });
          } else if (this.status === 'running') {
            // No bookmarks, just reset
            console.log('[Controller] Tab closed with no bookmarks, resetting...');
            this.status = 'idle';
            this.currentAnalysis = null;
            chrome.runtime.sendMessage({
              type: 'ANALYSIS_ERROR',
              error: 'Tab was closed before any bookmarks were captured'
            }).catch(() => {});
          }
        }
      };
      chrome.tabs.onRemoved.addListener(this.tabRemovedListener);

      this.broadcastProgress({
        bookmarks: 0,
        progress: 5,
        status: 'Opening bookmarks page...',
        statusIcon: '🔄'
      });

      return { success: true };
    } catch (error) {
      this.status = 'error';
      return { success: false, error: error.message };
    }
  }

  onTabLoaded() {
    // Remove listener
    if (this.tabUpdateListener) {
      chrome.tabs.onUpdated.removeListener(this.tabUpdateListener);
      this.tabUpdateListener = null;
    }
    
    console.log('[Controller] Tab load complete, waiting before injection...');
    
    // Wait a bit for React/SPA to initialize before injecting
    setTimeout(() => {
      this.injectScraper();
    }, 2000);
  }

  async injectScraper() {
    try {
      console.log('[Controller] Injecting scraper into tab:', this.scraperTabId);
      
      await chrome.scripting.executeScript({
        target: { tabId: this.scraperTabId },
        files: ['content/scraper.js']
      });
      
      this.broadcastProgress({
        bookmarks: 0,
        progress: 10,
        status: 'Scraper injected, initializing...',
        statusIcon: '⚙'
      });

      // Wait for script to load, then initialize
      setTimeout(() => this.initializeScraper(), 1000);
      
    } catch (error) {
      console.error('[Controller] Failed to inject scraper:', error);
      this.handleScraperError('Failed to inject scraper: ' + error.message);
    }
  }

  async initializeScraper() {
    try {
      console.log('[Controller] Sending SCRAPER_INIT...');
      const response = await chrome.tabs.sendMessage(this.scraperTabId, { type: 'SCRAPER_INIT' });
      
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to initialize scraper');
      }

      console.log('[Controller] Scraper initialized, starting tick loop');
      this.broadcastProgress({
        bookmarks: 0,
        progress: 15,
        status: 'Capturing bookmarks...',
        statusIcon: '📜'
      });

      // Start the tick loop driven from service worker
      this.startTickLoop();
      
    } catch (error) {
      console.error('[Controller] Scraper init failed:', error);
      this.handleScraperError('Scraper initialization failed: ' + error.message);
    }
  }

  startTickLoop() {
    // Use chrome.alarms for reliable timing that won't be throttled
    this.tickCount = 0;
    this.maxTicks = 600; // 15 minutes at 1.5s intervals
    this.noNewCount = 0;
    
    // Clear any existing alarm
    chrome.alarms.clear('scraperTick');
    
    // Set up alarm listener
    this.alarmListener = (alarm) => {
      if (alarm.name === 'scraperTick') {
        this.doTick();
      }
    };
    chrome.alarms.onAlarm.addListener(this.alarmListener);
    
    // Start the first tick immediately, then use alarms
    this.doTick();
  }

  async doTick() {
    if (this.status !== 'running' || !this.scraperTabId) {
      console.log('[Controller] Tick loop ending - not running');
      this.cleanupTickLoop();
      return;
    }

    this.tickCount++;

    try {
      const response = await chrome.tabs.sendMessage(this.scraperTabId, { type: 'SCRAPER_TICK' });
      
      if (response?.done) {
        console.log('[Controller] Scraper reported done');
        await this.finishScraping();
        return;
      }

      // Process any batch returned
      if (response?.batch?.length > 0) {
        await this.processBatch(response.batch);
      }

      // Update progress
      const total = response?.total || 0;
      if (response?.newCount > 0) {
        this.noNewCount = 0;
        console.log(`[Controller] Tick ${this.tickCount}: +${response.newCount} (total: ${total})`);
      } else {
        this.noNewCount++;
      }

      // Check completion conditions
      const elapsed = response?.elapsed || 0;
      const timeSinceNew = response?.timeSinceNew || 0;

      // Time limit (15 min)
      if (this.tickCount >= this.maxTicks) {
        console.log('[Controller] Time limit reached');
        await this.finishScraping();
        return;
      }

      // No new content for 45 seconds after initial capture
      if (elapsed > 60 && timeSinceNew > 45000) {
        console.log('[Controller] No new content, finishing');
        await this.finishScraping();
        return;
      }

      // Schedule next tick using alarm (reliable even when tab is background)
      chrome.alarms.create('scraperTick', { delayInMinutes: 0.025 }); // ~1.5 seconds

    } catch (error) {
      console.error('[Controller] Tick error:', error);
      // Tab might be closed
      if (error.message?.includes('Could not establish connection') || 
          error.message?.includes('No tab with id')) {
        console.log('[Controller] Tab appears closed');
        await this.finishScraping();
      } else {
        // Try to continue
        chrome.alarms.create('scraperTick', { delayInMinutes: 0.025 });
      }
    }
  }

  async finishScraping() {
    this.cleanupTickLoop();
    
    if (!this.scraperTabId) return;

    try {
      // Get final data from scraper
      const response = await chrome.tabs.sendMessage(this.scraperTabId, { type: 'SCRAPER_FINISH' });
      
      // Process any remaining batch
      if (response?.remaining?.length > 0) {
        await this.processBatch(response.remaining);
      }

      console.log(`[Controller] Scraping complete: ${response?.total || this.currentAnalysis?.bookmarks?.length} bookmarks`);
      
    } catch (error) {
      console.log('[Controller] Could not get final data:', error.message);
    }

    // Now finish the analysis
    await this.finishAnalysis({ 
      totalCaptured: this.currentAnalysis?.bookmarks?.length || 0 
    });
  }

  cleanupTickLoop() {
    chrome.alarms.clear('scraperTick');
    if (this.alarmListener) {
      chrome.alarms.onAlarm.removeListener(this.alarmListener);
      this.alarmListener = null;
    }
  }

  async processBatch(batch) {
    console.log('[Controller] processBatch called with', batch?.length, 'items');
    
    if (!batch || !Array.isArray(batch)) {
      console.log('[Controller] Invalid batch, skipping');
      return;
    }

    if (!this.currentAnalysis) {
      console.log('[Controller] No current analysis, skipping batch');
      return;
    }

    this.currentAnalysis.bookmarks.push(...batch);
    const totalBookmarks = this.currentAnalysis.bookmarks.length;
    console.log('[Controller] Total bookmarks now:', totalBookmarks);

    const intermediateResults = this.inference.processBatch(batch);

    const estimatedTotal = Math.max(500, totalBookmarks * 1.2);
    const progress = Math.min(85, (totalBookmarks / estimatedTotal) * 85 + 10);

    this.currentAnalysis.progress = {
      bookmarks: totalBookmarks,
      bookmarkCount: totalBookmarks,
      progress: Math.round(progress),
      status: `Capturing scrolls... (${totalBookmarks} found)`,
      statusIcon: '📚',
      topTopics: intermediateResults.topTopics || []
    };

    this.broadcastProgress(this.currentAnalysis.progress);

    if (totalBookmarks >= 50 && totalBookmarks % 50 === 0) {
      this.broadcastEarlyInsights(intermediateResults);
    }
  }

  async finishAnalysis(scraperData) {
    try {
      console.log('[Controller] finishAnalysis called with', scraperData);
      console.log('[Controller] Total bookmarks collected:', this.currentAnalysis?.bookmarks?.length || 0);
      
      // Clean up tick loop
      this.cleanupTickLoop();
      
      // Clean up listeners
      if (this.tabUpdateListener) {
        chrome.tabs.onUpdated.removeListener(this.tabUpdateListener);
        this.tabUpdateListener = null;
      }
      if (this.tabRemovedListener) {
        chrome.tabs.onRemoved.removeListener(this.tabRemovedListener);
        this.tabRemovedListener = null;
      }
      
      // Check if we got any bookmarks
      if (!this.currentAnalysis?.bookmarks?.length) {
        console.log('[Controller] NO BOOKMARKS CAPTURED!');
        this.handleScraperError('No bookmarks were captured. The page may have loaded incorrectly. Please try again.');
        return;
      }
      
      this.broadcastProgress({
        bookmarks: this.currentAnalysis.bookmarks.length,
        progress: 90,
        status: 'Running deep analysis...',
        statusIcon: '◈'
      });

      // Close the scraper tab if still open
      if (this.scraperTabId) {
        try {
          await chrome.tabs.remove(this.scraperTabId);
        } catch (e) {}
        this.scraperTabId = null;
      }

      // Run final inference
      console.log('[Controller] Running inference...');
      const finalResults = await this.inference.finalize();
      console.log('[Controller] Inference complete.');

      // Save to storage
      console.log('[Controller] Saving to storage...');
      const analysisId = await this.storage.saveAnalysis({
        timestamp: Date.now(),
        bookmarkCount: this.currentAnalysis.bookmarks.length,
        bookmarks: this.currentAnalysis.bookmarks,
        results: finalResults,
        duration: Date.now() - this.currentAnalysis.startTime
      });
      console.log('[Controller] Saved with ID:', analysisId);

      this.status = 'complete';

      this.broadcastComplete({
        bookmarkCount: this.currentAnalysis.bookmarks.length,
        analysisId
      });

      // Automatically open results page
      console.log('[Controller] Analysis complete! Opening results...');
      chrome.tabs.create({
        url: chrome.runtime.getURL(`results/results.html?id=${analysisId}`)
      });

    } catch (error) {
      console.error('[Controller] Error finishing analysis:', error);
      this.handleScraperError('Analysis failed: ' + error.message);
    }
  }

  handleScraperError(error) {
    console.error('[Controller] Scraper error:', error);
    this.status = 'error';
    
    // Clean up tick loop
    this.cleanupTickLoop();
    
    // Clean up listeners
    if (this.tabUpdateListener) {
      chrome.tabs.onUpdated.removeListener(this.tabUpdateListener);
      this.tabUpdateListener = null;
    }
    if (this.tabRemovedListener) {
      chrome.tabs.onRemoved.removeListener(this.tabRemovedListener);
      this.tabRemovedListener = null;
    }
    
    // Close the tab
    if (this.scraperTabId) {
      const tabId = this.scraperTabId;
      this.scraperTabId = null;
      
      setTimeout(() => {
        chrome.tabs.remove(tabId).catch(() => {});
      }, 1000);
    }
    
    this.currentAnalysis = null;

    chrome.runtime.sendMessage({
      type: 'ANALYSIS_ERROR',
      error: error
    }).catch(() => {});
  }

  async cancelAnalysis() {
    // Stop tick loop first
    this.cleanupTickLoop();
    
    // Close tab
    if (this.scraperTabId) {
      try {
        await chrome.tabs.remove(this.scraperTabId);
      } catch (e) {}
      this.scraperTabId = null;
    }
    
    // Clean up all listeners
    if (this.tabUpdateListener) {
      chrome.tabs.onUpdated.removeListener(this.tabUpdateListener);
      this.tabUpdateListener = null;
    }
    if (this.tabRemovedListener) {
      chrome.tabs.onRemoved.removeListener(this.tabRemovedListener);
      this.tabRemovedListener = null;
    }
    
    this.status = 'idle';
    this.currentAnalysis = null;
    
    return { success: true };
  }

  broadcastProgress(progress) {
    // Include top topics in progress update
    if (this.currentAnalysis?.progress?.topTopics) {
      progress.topTopics = this.currentAnalysis.progress.topTopics;
    }
    
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_PROGRESS',
      data: progress
    }).catch(() => {});
  }

  broadcastEarlyInsights(results) {
    const insights = [];
    
    if (results.topTopics?.length > 0) {
      const topTopic = results.topTopics[0];
      insights.push(`Strong focus on ${topTopic[0]} (${topTopic[1]} items)`);
    }
    
    if (results.topAuthors?.length > 0) {
      const topAuthor = results.topAuthors[0];
      insights.push(`Frequent saves from @${topAuthor[0]}`);
    }

    if (results.temporalPattern) {
      insights.push(`Peak activity: ${results.temporalPattern}`);
    }

    chrome.runtime.sendMessage({
      type: 'EARLY_INSIGHTS',
      data: insights
    }).catch(() => {});
  }

  broadcastComplete(data) {
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_COMPLETE',
      data
    }).catch(() => {});
  }

  async openResultsPage() {
    const lastAnalysis = await this.storage.getLastAnalysis();
    if (!lastAnalysis) {
      console.log('[Controller] No results to display');
      return;
    }

    chrome.tabs.create({
      url: chrome.runtime.getURL(`results/results.html?id=${lastAnalysis.id}`)
    });
  }

  async openHistoryPage() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('results/history.html')
    });
  }
}

// Initialize controller
const controller = new AnalysisController();
