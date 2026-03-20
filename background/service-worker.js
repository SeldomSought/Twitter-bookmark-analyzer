// background/service-worker.js — Orchestration + Deep Inference Engine
// v2.0 — Rebuilt for speed, depth, and reliability
'use strict';

// ═══════════════════════════════════════════════
// TOPIC TAXONOMY — Expanded lexicon with weighted signals
// ═══════════════════════════════════════════════

const TAXONOMY = {
  technology: {
    keywords: ['ai','ml','gpt','llm','neural','algorithm','software','hardware','api','code','coding','programming','developer','devops','cloud','saas','startup','tech','silicon valley','automation','robotics','data','database','machine learning','deep learning','transformer','compute','gpu','deploy','kubernetes','docker','react','javascript','python','rust','golang','microservice','backend','frontend','fullstack','devtools','open source','github','compiler','latency','scalability','inference','finetuning','rag','vector','embedding','prompt'],
    weight: 1.0
  },
  philosophy: {
    keywords: ['philosophy','metaphysics','epistemology','ontology','ethics','existential','nihilism','stoicism','phenomenology','consciousness','qualia','free will','determinism','moral','virtue','socrates','plato','aristotle','nietzsche','kant','hegel','wittgenstein','meaning','truth','reality','perception','being','existence','absurd','dialectic','logos','telos','dualism','materialism'],
    weight: 1.2
  },
  psychology: {
    keywords: ['psychology','cognitive','behavioral','therapy','mental health','trauma','attachment','narcissism','anxiety','depression','adhd','neurodivergent','personality','jung','freud','maslow','self-awareness','ego','shadow','projection','coping','resilience','mindfulness','emotional intelligence','psychoanalysis','unconscious','neurosis','dissociation','schema','inner child','boundaries','codependent','gaslighting'],
    weight: 1.1
  },
  finance: {
    keywords: ['finance','investing','stocks','crypto','bitcoin','ethereum','defi','nft','trading','portfolio','dividend','hedge fund','vc','venture capital','valuation','ipo','revenue','profit','margin','cash flow','yield','bond','equity','options','derivatives','market','bull','bear','recession','inflation','interest rate','fed','gdp','economics','macroeconomics','fiscal','monetary'],
    weight: 1.0
  },
  politics: {
    keywords: ['politics','policy','government','democracy','republican','democrat','liberal','conservative','congress','senate','election','vote','legislation','regulation','supreme court','geopolitics','diplomacy','sanctions','nato','immigration','tax','welfare','healthcare','gun','abortion','climate policy','lobbying','corruption','propaganda','ideology','authoritarian','populism','sovereignty'],
    weight: 0.9
  },
  science: {
    keywords: ['science','physics','quantum','biology','chemistry','neuroscience','astronomy','evolution','genetics','dna','rna','protein','cell','molecule','atom','particle','cosmology','relativity','entropy','thermodynamics','ecology','climate','geology','paleontology','telescope','experiment','hypothesis','peer review','research','study','published','journal','nature','lancet'],
    weight: 1.0
  },
  creativity: {
    keywords: ['art','design','creative','aesthetic','writing','poetry','music','film','cinema','photography','painting','sculpture','typography','illustration','animation','graphic design','ux','ui','brand','visual','composition','color theory','architecture','fashion','cinema','director','songwriter','novelist','screenplay','storytelling','narrative','fiction','prose','literary'],
    weight: 1.0
  },
  health: {
    keywords: ['health','fitness','workout','exercise','nutrition','diet','sleep','meditation','yoga','running','weightlifting','cardio','protein','calories','fasting','intermittent','supplements','vitamin','gut health','microbiome','longevity','aging','biohacking','sauna','cold plunge','recovery','injury','stretching','mobility','marathon','crossfit','bodybuilding'],
    weight: 0.9
  },
  business: {
    keywords: ['business','entrepreneur','founder','ceo','leadership','management','strategy','growth','marketing','sales','product','customer','revenue','scale','team','hiring','culture','remote work','productivity','meetings','okr','kpi','b2b','b2c','marketplace','supply chain','logistics','operations','negotiation','partnership','acquisition','branding','gtm','pmf','retention','churn'],
    weight: 1.0
  },
  spirituality: {
    keywords: ['spiritual','meditation','consciousness','awakening','enlightenment','buddhism','taoism','zen','hinduism','yoga','chakra','energy','vibration','manifestation','prayer','soul','divine','sacred','ritual','mysticism','shamanism','psychedelic','ayahuasca','psilocybin','dmt','plant medicine','ceremony','transcendence','non-duality','advaita','surrender','presence','mindfulness'],
    weight: 1.1
  },
  relationships: {
    keywords: ['relationship','dating','marriage','love','intimacy','communication','trust','vulnerability','attachment','breakup','divorce','family','parenting','children','friendship','loneliness','connection','empathy','compassion','boundary','toxic','narcissist','partner','spouse','conflict','resolution','jealousy','infidelity','commitment','polyamory','monogamy'],
    weight: 1.0
  },
  culture: {
    keywords: ['culture','society','race','gender','identity','lgbtq','feminism','masculinity','diversity','inclusion','equity','privilege','systemic','colonialism','decolonize','indigenous','diaspora','immigration','class','inequality','gentrification','urbanization','media','journalism','censorship','free speech','cancel','woke','tradition','modernity','globalization'],
    weight: 0.9
  },
  self_improvement: {
    keywords: ['self improvement','personal development','habit','discipline','motivation','goals','mindset','growth mindset','stoicism','journaling','morning routine','reading','learning','skill','mastery','focus','deep work','attention','procrastination','willpower','accountability','gratitude','affirmation','visualization','flow state','peak performance','optimization','life design'],
    weight: 1.0
  },
  humor: {
    keywords: ['lol','lmao','funny','joke','meme','comedy','satire','irony','sarcasm','shitpost','ratio','💀','😂','🤣','hilarious','roast','clown','absurd','parody','bit','deadpan','punchline','standup'],
    weight: 0.7
  },
  nature: {
    keywords: ['nature','wilderness','hiking','camping','mountain','ocean','forest','river','wildlife','bird','animal','ecosystem','biodiversity','conservation','national park','trail','sunset','landscape','garden','plant','tree','flower','farming','agriculture','permaculture','regenerative','soil','water','climate change','sustainability','environment','renewable','solar','wind'],
    weight: 0.9
  },
  history: {
    keywords: ['history','historical','ancient','medieval','renaissance','enlightenment','revolution','war','empire','civilization','dynasty','archaeology','artifact','museum','heritage','colonial','industrial','victorian','classical','roman','greek','egyptian','ottoman','mongol','persian','viking','crusade','reformation','cold war','ww2','ww1'],
    weight: 1.0
  },
  writing: {
    keywords: ['writing','writer','author','essay','blog','newsletter','substack','publish','book','novel','memoir','storytelling','narrative','prose','rhetoric','editing','draft','manuscript','literary','sentence','paragraph','voice','style','craft','nonfiction','long form','short story','journalism','reporting','op-ed','column'],
    weight: 1.0
  },
  mathematics: {
    keywords: ['math','mathematics','statistics','probability','calculus','algebra','geometry','topology','theorem','proof','equation','formula','optimization','linear','regression','bayesian','gaussian','markov','graph theory','combinatorics','number theory','set theory','logic','formal','axiom'],
    weight: 1.1
  },
  gaming: {
    keywords: ['gaming','game','video game','esports','stream','twitch','nintendo','playstation','xbox','pc gaming','rpg','fps','mmo','indie game','game design','level design','game dev','speedrun','multiplayer','pvp','pve','open world','sandbox','roguelike','metroidvania','souls','zelda','mario','minecraft','fortnite','league','valorant'],
    weight: 0.8
  },
  food: {
    keywords: ['food','recipe','cooking','restaurant','chef','cuisine','baking','fermentation','sourdough','coffee','wine','beer','cocktail','tasting','umami','spice','herb','kitchen','meal prep','farm to table','street food','michelin','culinary','pastry','bbq','grill','smoke','sushi','ramen','pasta','bread','chocolate','dessert'],
    weight: 0.8
  },
  geopolitics: {
    keywords: ['geopolitics','china','russia','ukraine','taiwan','iran','israel','palestine','nato','un','eu','brics','sanctions','nuclear','arms','military','defense','intelligence','espionage','cyber warfare','proxy war','territorial','sovereignty','hegemony','superpower','belt and road','oil','opec','trade war','embargo'],
    weight: 1.0
  },
  crypto_web3: {
    keywords: ['crypto','bitcoin','ethereum','blockchain','defi','nft','web3','dao','token','airdrop','staking','yield farming','liquidity','dex','wallet','metamask','solana','polygon','layer 2','rollup','zk','merkle','consensus','proof of stake','proof of work','decentralized','permissionless','trustless','smart contract','tokenomics'],
    weight: 0.9
  },
  media_entertainment: {
    keywords: ['movie','tv show','series','anime','manga','netflix','hbo','disney','streaming','trailer','review','soundtrack','album','song','artist','band','concert','festival','podcast','youtube','tiktok','instagram','influencer','celebrity','pop culture','entertainment','fandom','cosplay','comic','graphic novel','superhero','marvel','dc'],
    weight: 0.8
  }
};

// ═══════════════════════════════════════════════
// LIWC-STYLE PSYCHOLINGUISTIC WORD LISTS
// Based on Pennebaker et al. LIWC framework and validated psychometric research
// ═══════════════════════════════════════════════

const LIWC = {
  // Cognitive complexity — how deeply the writer processes information
  insight: ['think','know','consider','realize','understand','recognize','notice','aware','reflect','ponder','contemplate','discover','learn','perceive','grasp','comprehend'],
  causation: ['because','effect','hence','result','reason','cause','therefore','thus','since','due','leads','creates','produces','generates','stems'],
  discrepancy: ['should','would','could','ought','must','need','want','wish','hope','suppose','expected','intended','desire'],
  tentative: ['maybe','perhaps','possibly','probably','seem','appear','guess','think','believe','might','may','wonder','uncertain','unclear'],
  certainty: ['always','never','definitely','absolutely','certainly','clearly','obviously','undoubtedly','truly','exactly','precisely','guaranteed'],

  // Social process words
  social: ['friend','family','people','human','person','group','community','society','team','together','share','meet','talk','connect','relationship','others'],

  // Drives and biological/psychological needs
  risk: ['danger','risk','threat','fear','unsafe','vulnerable','expose','gamble','bet','uncertain','volatile','crash','fail'],
  reward: ['earn','win','gain','profit','reward','achieve','succeed','goal','milestone','benefit','value','return'],

  // Negations (indicates analytical distance, not emotional acceptance)
  negation: ['not','no','never','nothing','neither','nor','nobody','nowhere','none','without','lack','absent'],

  // Function words — prepositions indicate analytical style
  prepositions: ['on','in','at','to','for','with','by','from','of','about','over','through','between','among','across','around'],
  articles: ['the','a','an'],

  // Authenticity markers (LIWC "authenticity" = exclusive words + negative emotion + first-person singular)
  exclusive: ['but','except','without','exclude','unless','however','despite','although','whereas','yet','still','rather'],

  // Positive and negative affect (expanded beyond current sentiment lists)
  positiveAffect: ['love','great','amazing','beautiful','brilliant','excellent','wonderful','perfect','incredible','inspiring','grateful','blessed','happy','joy','excited','proud','hope','optimistic','powerful','impressive','celebrate','thrive','flourish','delight','cherish','admire'],
  negativeAffect: ['hate','terrible','awful','disgusting','horrific','devastating','depressing','tragic','failure','broken','angry','frustrated','disappointed','scared','anxious','worried','exhausted','burned','overwhelmed','dread','despair','miserable','suffer','struggle','pain']
};

// ═══════════════════════════════════════════════
// SCHWARTZ VALUES — 4 higher-order clusters
// Schwartz (1992, 2012) Basic Human Values Theory
// ═══════════════════════════════════════════════

const SCHWARTZ = {
  selfEnhancement: {
    // Power + Achievement: ambition, success, control, status
    topics: ['business', 'finance', 'crypto_web3'],
    keywords: ['success','achieve','power','control','lead','status','wealth','win','influence','authority','career','promotion','competitive','dominate','excel','outperform','ambitious','prestigious','elite','advantage'],
    label: 'Self-Enhancement',
    desc: 'Motivated by personal success, influence, and social recognition'
  },
  selfTranscendence: {
    // Universalism + Benevolence: justice, nature, equality, caring
    topics: ['culture', 'nature', 'relationships', 'spirituality'],
    keywords: ['justice','equality','nature','welfare','help','care','empathy','protect','community','environment','compassion','charity','solidarity','rights','human','universal','peace','harmony','give','serve'],
    label: 'Self-Transcendence',
    desc: 'Motivated by the welfare of others and the natural world'
  },
  opennessToChange: {
    // Self-direction + Stimulation: creativity, curiosity, novelty, freedom
    topics: ['technology', 'creativity', 'science', 'philosophy'],
    keywords: ['create','explore','discover','freedom','independent','novel','curious','experiment','innovate','change','challenge','adventure','risk','new','unconventional','original','question','build','invent','possibility'],
    label: 'Openness to Change',
    desc: 'Motivated by novelty, creativity, and personal freedom'
  },
  conservation: {
    // Security + Conformity + Tradition: stability, rules, heritage, order
    topics: ['history', 'politics', 'health'],
    keywords: ['tradition','stability','order','rule','respect','duty','safe','protect','preserve','heritage','family','loyalty','discipline','obey','structure','established','proven','conventional','reliable','secure'],
    label: 'Conservation',
    desc: 'Motivated by stability, tradition, and social order'
  }
};

// ═══════════════════════════════════════════════
// BIG FIVE (OCEAN) TRAIT INDICATORS
// Based on Mairesse et al. (2007), Golbeck et al. (2011), and
// Park et al. (2015) social media personality research
// ═══════════════════════════════════════════════

const OCEAN_SIGNALS = {
  openness: {
    topicBoost: ['philosophy', 'science', 'creativity', 'spirituality', 'mathematics', 'writing', 'history'],
    keywords: ['art','imagine','creative','curious','wonder','aesthetic','abstract','novel','unique','poetic','metaphor','theory','concept','explore','universe','consciousness','meaning','wisdom','insight'],
    // breadth of topics and vocabulary richness also contribute
    desc: 'Openness to Experience — intellectual curiosity, aesthetic sensitivity, and imagination'
  },
  conscientiousness: {
    topicBoost: ['self_improvement', 'health', 'business'],
    keywords: ['plan','goal','habit','discipline','system','schedule','efficient','productive','consistent','organize','track','measure','optimize','improve','achieve','structured','methodical','routine','accountability','progress'],
    desc: 'Conscientiousness — organization, goal-orientation, and deliberate self-regulation'
  },
  extraversion: {
    topicBoost: ['relationships', 'humor', 'media_entertainment', 'culture'],
    keywords: ['people','social','fun','energy','party','talk','together','friends','crowd','share','exciting','outgoing','connect','meet','lively','bold','confident','enthusiastic','vibe','community'],
    desc: 'Extraversion — sociability, positive affect, and engagement with the social world'
  },
  agreeableness: {
    topicBoost: ['relationships', 'spirituality', 'nature'],
    keywords: ['kind','empathy','compassion','trust','support','help','care','gentle','understanding','patient','cooperative','harmony','forgive','warmth','generous','appreciate','grateful','together','love','nurture'],
    desc: 'Agreeableness — cooperativeness, empathy, and interpersonal warmth'
  },
  neuroticism: {
    topicBoost: ['psychology'],
    keywords: ['anxious','worry','stress','overwhelm','fear','panic','nervous','depressed','lonely','insecure','doubt','shame','regret','sad','dread','tense','exhausted','burnout','spiral','fragile'],
    desc: 'Emotional Reactivity — sensitivity to emotional stimuli (not inherently negative)'
  }
};

// ═══════════════════════════════════════════════
// DEEP INFERENCE ENGINE
// ═══════════════════════════════════════════════

class InferenceEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.bookmarks = [];
    this.topicHits = {};       // topic -> [{text, score, author, timestamp}]
    this.authorMap = {};       // handle -> {displayName, count, topics[], avgMetrics}
    this.temporalBuckets = { hourly: new Array(24).fill(0), daily: new Array(7).fill(0), monthly: {} };
    this.wordFreq = {};
    this.hashtagFreq = {};
    this.mentionFreq = {};
    this.linkDomains = {};
    this.textLengths = [];
    this.wordCounts = [];
    this.sentenceCounts = [];
    this.mediaStats = { images: 0, videos: 0, withAlt: 0, total: 0 };
    this.metricTotals = { likes: 0, retweets: 0, replies: 0, views: 0, count: 0 };
    this.contentPatterns = { questions: 0, threads: 0, quotes: 0, links: 0, mediaRich: 0, textOnly: 0 };
    this.sentimentSignals = { positive: 0, negative: 0, analytical: 0, aspirational: 0, critical: 0, vulnerable: 0, confrontational: 0 };
    // New: LIWC-style signals
    this.liwc = {
      insight: 0, causation: 0, discrepancy: 0, tentative: 0, certainty: 0,
      social: 0, risk: 0, reward: 0, negation: 0, exclusive: 0,
      positiveAffect: 0, negativeAffect: 0
    };
    // New: pronoun aggregation across all bookmarks
    this.pronounTotals = { i: 0, we: 0, you: 0, they: 0, totalWords: 0 };
    // New: Schwartz values signal counts
    this.schwartzSignals = { selfEnhancement: 0, selfTranscendence: 0, opennessToChange: 0, conservation: 0 };
    // New: OCEAN keyword signal counts
    this.oceanSignals = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };
    // New: views tracking for mainstream vs niche analysis
    this.viewTotals = { total: 0, count: 0 };
  }

  processBatch(batch) {
    for (const item of batch) {
      this.bookmarks.push(item);
      this._processItem(item);
    }
    return this._intermediateResults();
  }

  _processItem(item) {
    const text = (item.text || '').toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 2);

    // ── Topic classification (multi-label with scoring) ──
    for (const [topic, def] of Object.entries(TAXONOMY)) {
      let score = 0;
      for (const kw of def.keywords) {
        if (kw.includes(' ')) {
          if (text.includes(kw)) score += 2 * def.weight;
        } else {
          // Word boundary match
          const regex = new RegExp(`\\b${kw}\\b`, 'i');
          if (regex.test(text)) score += 1 * def.weight;
        }
      }
      if (score > 0) {
        if (!this.topicHits[topic]) this.topicHits[topic] = [];
        this.topicHits[topic].push({
          score,
          text: item.text.slice(0, 200),
          author: item.author?.handle || '',
          timestamp: item.timestamp
        });
      }
    }

    // ── Author tracking ──
    const handle = item.author?.handle;
    if (handle) {
      if (!this.authorMap[handle]) {
        this.authorMap[handle] = {
          displayName: item.author.displayName || handle,
          count: 0,
          topics: [],
          totalLikes: 0,
          totalRetweets: 0,
          texts: []
        };
      }
      const a = this.authorMap[handle];
      a.count++;
      a.totalLikes += item.metrics?.likes || 0;
      a.totalRetweets += item.metrics?.retweets || 0;
      if (a.texts.length < 5) a.texts.push(item.text.slice(0, 150));
    }

    // ── Temporal ──
    if (item.timestamp) {
      try {
        const d = new Date(item.timestamp);
        if (!isNaN(d)) {
          this.temporalBuckets.hourly[d.getHours()]++;
          this.temporalBuckets.daily[d.getDay()]++;
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          this.temporalBuckets.monthly[monthKey] = (this.temporalBuckets.monthly[monthKey] || 0) + 1;
        }
      } catch (e) {}
    }

    // ── Word frequency (filter stopwords) ──
    const stopwords = new Set(['the','and','for','that','this','with','you','are','was','have','has','had','not','but','from','they','been','will','would','could','should','about','into','than','then','them','their','there','each','which','what','when','where','who','how','all','can','her','his','our','out','its','also','just','more','some','very','like','know','get','got','your','one','two','new','now','way','may','day','too','use','she','him','see','did','any','say','does','still','why','let','much','most','own','only','come','make','take','want','over','such','good','well','back','even','after','look','here','give','many','being','those','same','other','going','being','think','really','thing','people','right','want','need','going','don\'t','it\'s','i\'m','can\'t','won\'t','didn\'t','that\'s','what\'s','there\'s','don','didn','isn','aren','wasn','weren','couldn','wouldn','shouldn','http','https','www','com','amp']);
    for (const w of words) {
      const clean = w.replace(/[^a-z0-9'-]/g, '');
      if (clean.length > 2 && !stopwords.has(clean) && !/^\d+$/.test(clean)) {
        this.wordFreq[clean] = (this.wordFreq[clean] || 0) + 1;
      }
    }

    // ── Hashtags / Mentions ──
    (item.hashtags || []).forEach(h => { this.hashtagFreq[h] = (this.hashtagFreq[h] || 0) + 1; });
    (item.mentions || []).forEach(m => { this.mentionFreq[m] = (this.mentionFreq[m] || 0) + 1; });

    // ── Links / domains ──
    (item.links || []).forEach(link => {
      try {
        const domain = new URL(link).hostname.replace('www.', '');
        this.linkDomains[domain] = (this.linkDomains[domain] || 0) + 1;
      } catch (e) {}
    });

    // ── Content metrics ──
    this.textLengths.push(item.textLength || item.text.length);
    this.wordCounts.push(item.wordCount || words.length);

    // ── Media ──
    if (item.media?.length) {
      this.mediaStats.total += item.media.length;
      item.media.forEach(m => {
        if (m.type === 'image') this.mediaStats.images++;
        if (m.type === 'video') this.mediaStats.videos++;
        if (m.alt) this.mediaStats.withAlt++;
      });
    }

    // ── Engagement metrics ──
    if (item.metrics) {
      this.metricTotals.likes += item.metrics.likes || 0;
      this.metricTotals.retweets += item.metrics.retweets || 0;
      this.metricTotals.replies += item.metrics.replies || 0;
      this.metricTotals.views += item.metrics.views || 0;
      this.metricTotals.count++;
    }
    if (item.metrics?.views > 0) {
      this.viewTotals.total += item.metrics.views;
      this.viewTotals.count++;
    }

    // ── Sentence counts ──
    if (item.sentenceCount) this.sentenceCounts.push(item.sentenceCount);

    // ── Pronoun aggregation ──
    if (item.pronouns) {
      this.pronounTotals.i += item.pronouns.i || 0;
      this.pronounTotals.we += item.pronouns.we || 0;
      this.pronounTotals.you += item.pronouns.you || 0;
      this.pronounTotals.they += item.pronouns.they || 0;
      this.pronounTotals.totalWords += item.wordCount || 0;
    }

    // ── Content patterns ──
    if (text.includes('?')) this.contentPatterns.questions++;
    if (item.isThread) this.contentPatterns.threads++;
    if (item.isQuote) this.contentPatterns.quotes++;
    if (item.links?.length) this.contentPatterns.links++;
    if (item.media?.length) this.contentPatterns.mediaRich++;
    else this.contentPatterns.textOnly++;

    // ── Sentiment signals (keyword-based) ──
    const posWords = ['love','great','amazing','beautiful','brilliant','excellent','wonderful','perfect','incredible','inspiring','grateful','blessed','happy','joy','excited','proud','hope','optimistic','powerful','impressive'];
    const negWords = ['hate','terrible','awful','disgusting','horrific','devastating','depressing','tragic','failure','broken','angry','frustrated','disappointed','scared','anxious','worried','exhausted','burned out','overwhelmed'];
    const analyticWords = ['analysis','data','evidence','research','study','framework','model','theory','hypothesis','correlation','causation','metric','systematic','empirical','methodology','statistical','objective','rational','logical','quantitative'];
    const aspirationWords = ['goal','dream','build','create','launch','grow','learn','master','achieve','become','transform','improve','optimize','level up','unlock','potential','vision','mission','purpose','ambition'];
    const criticalWords = ['problem','issue','flaw','broken','wrong','mistake','fail','critique','overrated','overhyped','misleading','propaganda','grift','scam','fraud','lie','bullshit','nonsense','garbage','mediocre'];
    const vulnerableWords = ['struggle','pain','loss','grief','lonely','scared','admit','confess','honest','raw','real','vulnerable','overwhelmed','burnout','cry','hurt','trauma','heal','recover','survive'];

    for (const w of words) {
      if (posWords.includes(w)) this.sentimentSignals.positive++;
      if (negWords.includes(w)) this.sentimentSignals.negative++;
      if (analyticWords.includes(w)) this.sentimentSignals.analytical++;
      if (aspirationWords.includes(w)) this.sentimentSignals.aspirational++;
      if (criticalWords.includes(w)) this.sentimentSignals.critical++;
      if (vulnerableWords.includes(w)) this.sentimentSignals.vulnerable++;
    }

    // ── LIWC-style psycholinguistic signals ──
    for (const w of words) {
      if (LIWC.insight.includes(w))        this.liwc.insight++;
      if (LIWC.causation.includes(w))      this.liwc.causation++;
      if (LIWC.discrepancy.includes(w))    this.liwc.discrepancy++;
      if (LIWC.tentative.includes(w))      this.liwc.tentative++;
      if (LIWC.certainty.includes(w))      this.liwc.certainty++;
      if (LIWC.social.includes(w))         this.liwc.social++;
      if (LIWC.risk.includes(w))           this.liwc.risk++;
      if (LIWC.reward.includes(w))         this.liwc.reward++;
      if (LIWC.negation.includes(w))       this.liwc.negation++;
      if (LIWC.exclusive.includes(w))      this.liwc.exclusive++;
      if (LIWC.positiveAffect.includes(w)) this.liwc.positiveAffect++;
      if (LIWC.negativeAffect.includes(w)) this.liwc.negativeAffect++;
    }

    // ── Schwartz Values keyword signals ──
    for (const [dim, def] of Object.entries(SCHWARTZ)) {
      for (const kw of def.keywords) {
        const matched = kw.includes(' ') ? text.includes(kw) : new RegExp(`\\b${kw}\\b`, 'i').test(text);
        if (matched) this.schwartzSignals[dim]++;
      }
    }

    // ── OCEAN keyword signals ──
    for (const [trait, def] of Object.entries(OCEAN_SIGNALS)) {
      for (const kw of def.keywords) {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) this.oceanSignals[trait]++;
      }
    }
  }

  _intermediateResults() {
    const sorted = Object.entries(this.topicHits)
      .map(([name, hits]) => ({ name, count: hits.length, totalScore: hits.reduce((s, h) => s + h.score, 0) }))
      .sort((a, b) => b.totalScore - a.totalScore);

    const topAuthors = Object.entries(this.authorMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([handle, data]) => ({ handle, ...data }));

    return {
      topTopics: sorted.slice(0, 5),
      topAuthors,
      bookmarkCount: this.bookmarks.length
    };
  }

  // ═══════════════════════════════════════════════
  // FINALIZE — Generate the full psychological profile
  // ═══════════════════════════════════════════════

  finalize() {
    console.log('[Inference] Finalizing analysis of', this.bookmarks.length, 'bookmarks');

    const n = this.bookmarks.length;
    if (n === 0) return this._emptyProfile();

    try {
      const topics = this._buildTopicProfile();
      const authors = this._buildAuthorProfile();
      const temporal = this._buildTemporalProfile();
      const vocabulary = this._buildVocabularyProfile();
      const informationDiet = this._buildInformationDiet(topics);
      const cognitiveStyle = this._buildCognitiveStyle(topics, vocabulary);
      const emotionalLandscape = this._buildEmotionalLandscape();
      const intellectualCharacter = this._buildIntellectualCharacter(topics, vocabulary);
      const socialOrientation = this._buildSocialOrientation(authors, topics);
      const psychProfile = this._buildPsychProfile(topics, cognitiveStyle, emotionalLandscape, intellectualCharacter);
      const hiddenPatterns = this._findHiddenPatterns(topics, authors, vocabulary);
      const blindSpots = this._identifyBlindSpots(topics);
      const coreNarrative = this._buildCoreNarrative(psychProfile, topics, cognitiveStyle, emotionalLandscape);
      const measurableStats = this._buildMeasurableStats(topics, authors, temporal, vocabulary);
      // New psychometric dimensions
      const oceanProfile = this._buildOCEANProfile(topics, vocabulary, temporal);
      const schwartzValues = this._buildSchwartzValues(topics);
      const linguisticProfile = this._buildLinguisticProfile(vocabulary);
      const topicVelocity = this._buildTopicVelocity(topics);

      return {
        summary: {
          totalBookmarks: n,
          uniqueAuthors: Object.keys(this.authorMap).length,
          topicsDetected: topics.ranked.length,
          timeSpan: this._getTimeSpan(),
          avgBookmarkLength: Math.round(this.textLengths.reduce((a, b) => a + b, 0) / n),
          avgWordCount: Math.round(this.wordCounts.reduce((a, b) => a + b, 0) / n)
        },
        topics,
        authors,
        temporal,
        vocabulary,
        informationDiet,
        cognitiveStyle,
        emotionalLandscape,
        intellectualCharacter,
        socialOrientation,
        psychProfile,
        hiddenPatterns,
        blindSpots,
        coreNarrative,
        measurableStats,
        oceanProfile,
        schwartzValues,
        linguisticProfile,
        topicVelocity,
        contentPatterns: this.contentPatterns,
        sentimentSignals: this.sentimentSignals,
        mediaStats: this.mediaStats
      };
    } catch (e) {
      console.error('[Inference] Finalize error:', e);
      return this._emptyProfile();
    }
  }

  // ── Topic Profile ──
  _buildTopicProfile() {
    const n = this.bookmarks.length;
    const ranked = Object.entries(this.topicHits)
      .map(([name, hits]) => ({
        name,
        count: hits.length,
        totalScore: hits.reduce((s, h) => s + h.score, 0),
        percentage: Math.round((hits.length / n) * 100),
        avgScore: hits.reduce((s, h) => s + h.score, 0) / hits.length,
        topAuthors: this._topAuthorsForTopic(hits),
        sampleTexts: hits.slice(0, 3).map(h => h.text)
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    // Topic diversity score (Shannon entropy)
    const total = ranked.reduce((s, t) => s + t.count, 0);
    let entropy = 0;
    for (const t of ranked) {
      const p = t.count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    const maxEntropy = Math.log2(ranked.length || 1);
    const diversityScore = maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 100) : 0;

    // Topic clusters (co-occurrence)
    const clusters = this._findTopicClusters();

    return { ranked, diversityScore, clusters, totalTopicHits: total };
  }

  _topAuthorsForTopic(hits) {
    const counts = {};
    for (const h of hits) {
      if (h.author) counts[h.author] = (counts[h.author] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h, c]) => ({ handle: h, count: c }));
  }

  _findTopicClusters() {
    // Find topics that appear together in the same bookmarks
    const cooccurrence = {};
    for (const bm of this.bookmarks) {
      const text = (bm.text || '').toLowerCase();
      const matchedTopics = [];
      for (const [topic, def] of Object.entries(TAXONOMY)) {
        for (const kw of def.keywords) {
          if (text.includes(kw)) { matchedTopics.push(topic); break; }
        }
      }
      // Record co-occurrences
      for (let i = 0; i < matchedTopics.length; i++) {
        for (let j = i + 1; j < matchedTopics.length; j++) {
          const key = [matchedTopics[i], matchedTopics[j]].sort().join('+');
          cooccurrence[key] = (cooccurrence[key] || 0) + 1;
        }
      }
    }
    return Object.entries(cooccurrence)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pair, count]) => ({ topics: pair.split('+'), count }));
  }

  // ── Author Profile ──
  _buildAuthorProfile() {
    return Object.entries(this.authorMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 25)
      .map(([handle, data]) => ({
        handle,
        displayName: data.displayName,
        count: data.count,
        percentageOfBookmarks: Math.round((data.count / this.bookmarks.length) * 100),
        avgLikes: data.count > 0 ? Math.round(data.totalLikes / data.count) : 0,
        avgRetweets: data.count > 0 ? Math.round(data.totalRetweets / data.count) : 0,
        sampleTexts: data.texts
      }));
  }

  // ── Temporal Profile ──
  _buildTemporalProfile() {
    const peakHour = this.temporalBuckets.hourly.indexOf(Math.max(...this.temporalBuckets.hourly));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDay = dayNames[this.temporalBuckets.daily.indexOf(Math.max(...this.temporalBuckets.daily))];

    // Classify time persona
    let timePersona = 'Balanced';
    const lateNight = this.temporalBuckets.hourly.slice(22, 24).reduce((a, b) => a + b, 0) + this.temporalBuckets.hourly.slice(0, 5).reduce((a, b) => a + b, 0);
    const morning = this.temporalBuckets.hourly.slice(5, 12).reduce((a, b) => a + b, 0);
    const afternoon = this.temporalBuckets.hourly.slice(12, 17).reduce((a, b) => a + b, 0);
    const evening = this.temporalBuckets.hourly.slice(17, 22).reduce((a, b) => a + b, 0);
    const total = lateNight + morning + afternoon + evening || 1;

    if (lateNight / total > 0.35) timePersona = 'Night Owl';
    else if (morning / total > 0.40) timePersona = 'Early Riser';
    else if (evening / total > 0.40) timePersona = 'Evening Thinker';
    else if (afternoon / total > 0.40) timePersona = 'Afternoon Explorer';

    // Monthly trend
    const monthlyEntries = Object.entries(this.temporalBuckets.monthly).sort();
    let trend = 'steady';
    if (monthlyEntries.length >= 3) {
      const recent = monthlyEntries.slice(-3).reduce((s, [, v]) => s + v, 0);
      const earlier = monthlyEntries.slice(0, 3).reduce((s, [, v]) => s + v, 0);
      if (recent > earlier * 1.5) trend = 'increasing';
      else if (recent < earlier * 0.6) trend = 'decreasing';
    }

    return {
      peakHour,
      peakHourLabel: this._formatHour(peakHour),
      peakDay,
      timePersona,
      hourlyDistribution: this.temporalBuckets.hourly,
      dailyDistribution: this.temporalBuckets.daily,
      monthlyDistribution: this.temporalBuckets.monthly,
      trend,
      distribution: { lateNight: Math.round(lateNight / total * 100), morning: Math.round(morning / total * 100), afternoon: Math.round(afternoon / total * 100), evening: Math.round(evening / total * 100) }
    };
  }

  _formatHour(h) {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  }

  // ── Vocabulary Profile ──
  _buildVocabularyProfile() {
    const sorted = Object.entries(this.wordFreq).sort((a, b) => b[1] - a[1]);
    const topWords = sorted.slice(0, 50).map(([word, count]) => ({ word, count }));
    const topHashtags = Object.entries(this.hashtagFreq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));
    const topMentions = Object.entries(this.mentionFreq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([mention, count]) => ({ mention, count }));

    // Vocabulary richness (unique words / total words)
    const totalWords = Object.values(this.wordFreq).reduce((a, b) => a + b, 0);
    const uniqueWords = sorted.length;
    const richness = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 100) : 0;

    // Avg complexity proxy (average word length)
    let totalLen = 0, totalCount = 0;
    for (const [word, count] of sorted) {
      totalLen += word.length * count;
      totalCount += count;
    }
    const avgWordLength = totalCount > 0 ? (totalLen / totalCount).toFixed(1) : 0;

    return { topWords, topHashtags, topMentions, richness, avgWordLength, uniqueWords, totalWords };
  }

  // ── Information Diet ──
  _buildInformationDiet(topics) {
    const topDomains = Object.entries(this.linkDomains).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([domain, count]) => ({ domain, count }));

    // Categorize domains
    const domainTypes = { news: 0, academic: 0, social: 0, blog: 0, video: 0, tool: 0, other: 0 };
    const newsPatterns = ['nytimes','washingtonpost','bbc','reuters','cnn','fox','theguardian','wsj','bloomberg','economist','politico','axios','techcrunch','wired','arstechnica','verge'];
    const academicPatterns = ['arxiv','scholar','pubmed','nature.com','sciencedirect','jstor','ncbi','ieee','acm','springer','wiley'];
    const socialPatterns = ['twitter','x.com','reddit','youtube','tiktok','instagram','facebook','linkedin','threads','mastodon','substack','medium'];
    const videoPatterns = ['youtube','vimeo','twitch','rumble'];

    for (const [domain] of Object.entries(this.linkDomains)) {
      if (newsPatterns.some(p => domain.includes(p))) domainTypes.news++;
      else if (academicPatterns.some(p => domain.includes(p))) domainTypes.academic++;
      else if (socialPatterns.some(p => domain.includes(p))) domainTypes.social++;
      else if (videoPatterns.some(p => domain.includes(p))) domainTypes.video++;
      else domainTypes.other++;
    }

    // Format preference
    const { textOnly, mediaRich, links, threads, quotes, questions } = this.contentPatterns;
    const total = this.bookmarks.length || 1;
    let formatPreference = 'Mixed';
    if (textOnly / total > 0.6) formatPreference = 'Text-Dominant';
    else if (mediaRich / total > 0.4) formatPreference = 'Visual';
    else if (links / total > 0.4) formatPreference = 'Link Curator';
    else if (threads / total > 0.2) formatPreference = 'Thread Reader';

    // Depth score (prefers long-form, threads, articles vs short memes/images)
    const depthSignals = threads + (links * 0.5) + (this.wordCounts.filter(w => w > 50).length * 0.5);
    const surfaceSignals = mediaRich * 0.3 + this.wordCounts.filter(w => w < 15).length;
    const depthScore = Math.min(100, Math.round((depthSignals / (depthSignals + surfaceSignals + 1)) * 100));

    return { topDomains, domainTypes, formatPreference, depthScore, contentBreakdown: { textOnly, mediaRich, links, threads, quotes, questions, total } };
  }

  // ── Cognitive Style ──
  _buildCognitiveStyle(topics, vocabulary) {
    const scores = {
      analytical: 0,
      creative: 0,
      strategic: 0,
      humanistic: 0,
      practical: 0,
      theoretical: 0,
      systems: 0,
      narrative: 0
    };

    // Score from topics
    const topicScores = {
      analytical: ['technology', 'science', 'mathematics', 'finance'],
      creative: ['creativity', 'writing', 'food', 'media_entertainment'],
      strategic: ['business', 'politics', 'geopolitics', 'finance'],
      humanistic: ['psychology', 'relationships', 'culture', 'spirituality'],
      practical: ['health', 'self_improvement', 'business', 'technology'],
      theoretical: ['philosophy', 'science', 'mathematics', 'history'],
      systems: ['technology', 'science', 'geopolitics', 'business'],
      narrative: ['writing', 'history', 'culture', 'media_entertainment']
    };

    for (const [style, relatedTopics] of Object.entries(topicScores)) {
      for (const t of relatedTopics) {
        const hits = this.topicHits[t]?.length || 0;
        scores[style] += hits;
      }
    }

    // Score from sentiment signals
    scores.analytical += this.sentimentSignals.analytical * 3;
    scores.creative += this.sentimentSignals.positive * 1;
    scores.humanistic += this.sentimentSignals.vulnerable * 2;
    scores.strategic += this.sentimentSignals.aspirational * 2;
    scores.practical += this.sentimentSignals.aspirational * 1;

    // Score from content patterns
    scores.analytical += this.contentPatterns.links * 0.5;
    scores.narrative += this.contentPatterns.threads * 2;
    scores.creative += this.contentPatterns.mediaRich * 0.5;
    scores.theoretical += this.contentPatterns.questions * 1;

    // Normalize
    const maxScore = Math.max(...Object.values(scores), 1);
    for (const k of Object.keys(scores)) {
      scores[k] = Math.round((scores[k] / maxScore) * 100);
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = sorted[0][0];
    const secondary = sorted[1][0];

    const descriptions = {
      analytical: 'You process the world through data, evidence, and logical frameworks. You seek to understand mechanisms and measure truth.',
      creative: 'You are drawn to expression, beauty, and originality. You process experience through aesthetic and artistic lenses.',
      strategic: 'You think in systems of leverage and influence. You naturally evaluate power dynamics, incentives, and optimal positioning.',
      humanistic: 'You prioritize understanding human experience — emotions, relationships, and the inner world. You seek wisdom about what it means to be alive.',
      practical: 'You gravitate toward what works. Your bookmarks reflect someone focused on implementation, optimization, and tangible improvement.',
      theoretical: 'You are compelled by abstract ideas, foundational principles, and deep questions. Knowledge itself is the reward.',
      systems: 'You think in interconnected wholes. You see feedback loops, emergent properties, and structural dynamics where others see isolated events.',
      narrative: 'You understand the world through stories, history, and contextual meaning. Events are episodes in larger arcs.'
    };

    return {
      primary,
      secondary,
      scores,
      description: descriptions[primary],
      blend: `${this._capitalize(primary)}-${this._capitalize(secondary)} Thinker`
    };
  }

  // ── Emotional Landscape ──
  _buildEmotionalLandscape() {
    const s = this.sentimentSignals;
    const total = Object.values(s).reduce((a, b) => a + b, 1);

    const dimensions = {
      optimism: Math.round(((s.positive + s.aspirational) / total) * 100),
      criticality: Math.round(((s.critical + s.negative + s.confrontational) / total) * 100),
      introspection: Math.round(((s.vulnerable + s.analytical) / total) * 100),
      ambition: Math.round((s.aspirational / total) * 100),
      empathy: Math.round((s.vulnerable / total) * 100)
    };

    // Emotional tone
    let tone = 'Balanced';
    if (dimensions.optimism > 45) tone = 'Optimistic & Forward-Looking';
    else if (dimensions.criticality > 40) tone = 'Critical & Discerning';
    else if (dimensions.introspection > 40) tone = 'Reflective & Inward';
    else if (dimensions.ambition > 30) tone = 'Driven & Aspirational';

    // What draws them emotionally
    const draws = [];
    if (s.aspirational > s.analytical) draws.push('Content that paints a better future');
    if (s.analytical > s.positive) draws.push('Evidence-based reasoning and clear thinking');
    if (s.vulnerable > 3) draws.push('Raw honesty and authentic vulnerability');
    if (s.critical > s.positive) draws.push('Sharp critiques and contrarian takes');
    if (s.positive > s.critical * 2) draws.push('Inspiring and uplifting perspectives');

    return { tone, dimensions, draws, raw: s };
  }

  // ── Intellectual Character ──
  _buildIntellectualCharacter(topics, vocabulary) {
    const n = this.bookmarks.length || 1;

    // Curiosity breadth (how many different topics)
    const activeTopic = topics.ranked.filter(t => t.percentage > 3).length;
    const breadth = Math.min(100, Math.round((activeTopic / Object.keys(TAXONOMY).length) * 100));

    // Depth vs breadth (concentrated vs scattered)
    const topThreeShare = topics.ranked.slice(0, 3).reduce((s, t) => s + t.percentage, 0);
    const depthOrientation = topThreeShare > 60 ? 'Deep Specialist' : topThreeShare > 40 ? 'Focused Generalist' : 'Wide Explorer';

    // Contrarian index (saves critical / confrontational content)
    const contrarianIndex = Math.round(((this.sentimentSignals.critical + this.sentimentSignals.confrontational) / n) * 100);

    // Original thought indicator (questions, threads — signs of deeper engagement)
    const engagementDepth = Math.round(((this.contentPatterns.questions + this.contentPatterns.threads) / n) * 100);

    // Risk appetite (saves crypto, geopolitics, controversial topics)
    const riskTopics = ['crypto_web3', 'geopolitics', 'politics'];
    const riskHits = riskTopics.reduce((s, t) => s + (this.topicHits[t]?.length || 0), 0);
    const riskAppetite = Math.min(100, Math.round((riskHits / n) * 100));

    // Rigour (links, academic domains, analytical signals)
    const rigour = Math.min(100, Math.round(
      ((this.contentPatterns.links * 0.3 + this.sentimentSignals.analytical * 5) / n) * 100
    ));

    return {
      breadth,
      depthOrientation,
      contrarianIndex,
      engagementDepth,
      riskAppetite,
      rigour,
      identity: depthOrientation,
      topThreeShare
    };
  }

  // ── Social Orientation ──
  _buildSocialOrientation(authors, topics) {
    const n = this.bookmarks.length || 1;
    const uniqueAuthors = Object.keys(this.authorMap).length;
    const topAuthorConcentration = authors.length > 0 ? Math.round((authors[0].count / n) * 100) : 0;

    // Loyalty vs exploration
    const loyaltyScore = authors.slice(0, 5).reduce((s, a) => s + a.count, 0);
    const loyaltyPct = Math.round((loyaltyScore / n) * 100);
    let socialStance = 'Balanced';
    if (loyaltyPct > 50) socialStance = 'Loyal Follower — deep trust in select voices';
    else if (uniqueAuthors / n > 0.7) socialStance = 'Wide Sampler — draws from many diverse voices';
    else socialStance = 'Curated Circle — a thoughtful middle ground';

    // Authority orientation (saves high-engagement content vs niche)
    const avgLikes = this.metricTotals.count > 0 ? this.metricTotals.likes / this.metricTotals.count : 0;
    let authorityBias = 'Mixed';
    if (avgLikes > 5000) authorityBias = 'Mainstream — gravitates toward high-signal, widely-validated content';
    else if (avgLikes > 500) authorityBias = 'Semi-mainstream — values quality with some reach';
    else authorityBias = 'Niche Explorer — seeks hidden gems and underrated voices';

    return {
      uniqueAuthors,
      topAuthorConcentration,
      socialStance,
      authorityBias,
      loyaltyPct,
      avgEngagement: { likes: Math.round(avgLikes), retweets: Math.round(this.metricTotals.retweets / (this.metricTotals.count || 1)) }
    };
  }

  // ── Psychological Profile ──
  _buildPsychProfile(topics, cognitiveStyle, emotionalLandscape, intellectualCharacter) {
    // Determine archetype from convergence of dimensions
    const archetypes = [
      { name: 'The Architect', test: () => cognitiveStyle.scores.systems > 60 && cognitiveStyle.scores.analytical > 50, icon: '🏛️', desc: 'You build mental models of how the world works. Your bookmarks reveal someone who sees structure, leverage, and interconnection everywhere — an engineer of ideas.' },
      { name: 'The Philosopher', test: () => cognitiveStyle.scores.theoretical > 60 && (this.topicHits.philosophy?.length > 5 || this.topicHits.spirituality?.length > 5), icon: '🦉', desc: 'You are drawn to the deepest questions. Your bookmarks trace a path through meaning, consciousness, and the nature of existence — a seeker of fundamental truths.' },
      { name: 'The Strategist', test: () => cognitiveStyle.scores.strategic > 60 && this.sentimentSignals.aspirational > this.sentimentSignals.vulnerable, icon: '♟️', desc: 'You think in moves, not moments. Your bookmarks reveal a mind that constantly evaluates positioning, leverage, and optimal paths — a chess player navigating reality.' },
      { name: 'The Alchemist', test: () => cognitiveStyle.scores.creative > 50 && cognitiveStyle.scores.practical > 40, icon: '⚗️', desc: 'You transform raw materials into something greater. Your bookmarks show a maker who blends creativity with pragmatism — turning ideas into tangible reality.' },
      { name: 'The Healer', test: () => cognitiveStyle.scores.humanistic > 60 && emotionalLandscape.dimensions.empathy > 20, icon: '🌿', desc: 'You are attuned to suffering and growth. Your bookmarks reveal deep concern for the human condition — relationships, mental health, and the journey of becoming whole.' },
      { name: 'The Oracle', test: () => cognitiveStyle.scores.analytical > 50 && intellectualCharacter.breadth > 50, icon: '🔮', desc: 'You synthesize information from wildly different domains to see what others miss. Your bookmarks are a web of cross-domain pattern recognition — a living prediction engine.' },
      { name: 'The Rebel', test: () => emotionalLandscape.dimensions.criticality > 35 && intellectualCharacter.contrarianIndex > 15, icon: '⚔️', desc: 'You challenge received wisdom. Your bookmarks are full of dissenting voices, sharp critiques, and perspectives that question the status quo — a natural iconoclast.' },
      { name: 'The Scholar', test: () => cognitiveStyle.scores.theoretical > 50 && intellectualCharacter.rigour > 30, icon: '📜', desc: 'You pursue knowledge with rigor and patience. Your bookmarks are a personal library spanning deep research, long reads, and careful analysis — a modern polymath.' },
      { name: 'The Builder', test: () => cognitiveStyle.scores.practical > 50 && this.sentimentSignals.aspirational > this.sentimentSignals.analytical, icon: '🔨', desc: 'You save to build. Your bookmarks are a workshop of practical knowledge, tactical insight, and how-to wisdom — everything in service of making something real.' },
      { name: 'The Witness', test: () => cognitiveStyle.scores.narrative > 50 && (this.topicHits.history?.length > 3 || this.topicHits.culture?.length > 5), icon: '👁️', desc: 'You observe and remember. Your bookmarks chronicle the human story — culture, history, and the unfolding present — with the eye of someone who believes understanding requires attention.' },
      { name: 'The Seeker', test: () => true, icon: '🧭', desc: 'You are on a journey of discovery. Your bookmarks span many territories with the restless curiosity of someone searching for something they haven\'t fully named yet.' }
    ];

    let primary = archetypes[archetypes.length - 1]; // Default: Seeker
    let secondary = null;
    for (const a of archetypes) {
      if (a.test()) {
        if (!secondary || a.name !== primary.name) secondary = primary;
        primary = a;
        break;
      }
    }

    // Psychological drives
    const drives = [];
    if (this.sentimentSignals.aspirational > 5) drives.push({ drive: 'Achievement', strength: Math.min(100, this.sentimentSignals.aspirational * 8), desc: 'A need to build, grow, and reach higher ground' });
    if (this.sentimentSignals.analytical > 5) drives.push({ drive: 'Understanding', strength: Math.min(100, this.sentimentSignals.analytical * 8), desc: 'A compulsion to comprehend how things truly work' });
    if (this.sentimentSignals.vulnerable > 3) drives.push({ drive: 'Connection', strength: Math.min(100, this.sentimentSignals.vulnerable * 12), desc: 'A desire for authentic human relationship and belonging' });
    if (this.sentimentSignals.critical > 5) drives.push({ drive: 'Truth', strength: Math.min(100, this.sentimentSignals.critical * 8), desc: 'A refusal to accept surface explanations or comfortable lies' });
    if (this.sentimentSignals.positive > 8) drives.push({ drive: 'Inspiration', strength: Math.min(100, this.sentimentSignals.positive * 5), desc: 'An orientation toward beauty, possibility, and the extraordinary' });
    drives.sort((a, b) => b.strength - a.strength);

    // Anxieties / tensions
    const tensions = [];
    if (cognitiveStyle.scores.analytical > 40 && cognitiveStyle.scores.humanistic > 30) tensions.push('Head vs. Heart — rational analysis competes with emotional wisdom');
    if (cognitiveStyle.scores.strategic > 40 && cognitiveStyle.scores.creative > 30) tensions.push('Control vs. Flow — strategic planning pulls against creative spontaneity');
    if (intellectualCharacter.breadth > 60) tensions.push('Depth vs. Breadth — your wide curiosity may struggle against the need to specialize');
    if (emotionalLandscape.dimensions.criticality > 25 && emotionalLandscape.dimensions.optimism > 25) tensions.push('Idealism vs. Skepticism — you want to believe but need to question');

    return {
      archetype: { name: primary.name, icon: primary.icon, description: primary.desc },
      secondaryArchetype: secondary ? { name: secondary.name, icon: secondary.icon } : null,
      drives: drives.slice(0, 4),
      tensions,
      dimensions: cognitiveStyle.scores
    };
  }

  // ── Hidden Patterns ──
  _findHiddenPatterns(topics, authors, vocabulary) {
    const patterns = [];
    const n = this.bookmarks.length || 1;

    // Topic co-occurrence insight
    if (topics.clusters.length > 0) {
      const top = topics.clusters[0];
      patterns.push({
        pattern: `${this._capitalize(top.topics[0])} × ${this._capitalize(top.topics[1])} Nexus`,
        description: `You repeatedly save content at the intersection of ${top.topics[0]} and ${top.topics[1]} (${top.count} times). This cross-domain interest is distinctive and suggests unique synthesizing ability.`,
        strength: Math.min(100, top.count * 10)
      });
    }

    // Late night patterns
    const lateNightPct = (this.temporalBuckets.hourly.slice(22).reduce((a, b) => a + b, 0) + this.temporalBuckets.hourly.slice(0, 4).reduce((a, b) => a + b, 0)) / n * 100;
    if (lateNightPct > 25) {
      patterns.push({
        pattern: 'Night Mind',
        description: `${Math.round(lateNightPct)}% of your bookmarks happen between 10 PM and 4 AM. Your most resonant content is saved when the world is quiet — suggesting deeper, more authentic engagement during solitary hours.`,
        strength: Math.round(lateNightPct)
      });
    }

    // High-engagement bias
    const avgLikes = this.metricTotals.count > 0 ? this.metricTotals.likes / this.metricTotals.count : 0;
    if (avgLikes < 200) {
      patterns.push({
        pattern: 'Hidden Gem Hunter',
        description: `Your average bookmarked tweet has only ~${Math.round(avgLikes)} likes. You consistently find valuable content before it goes mainstream — an indicator of independent taste.`,
        strength: Math.min(100, Math.round(200 / (avgLikes + 1)) * 10)
      });
    }

    // Single author dependency
    const topAuthor = Object.entries(this.authorMap).sort((a, b) => b[1].count - a[1].count)[0];
    if (topAuthor && topAuthor[1].count / n > 0.1) {
      patterns.push({
        pattern: `@${topAuthor[0]} Apprentice`,
        description: `${Math.round(topAuthor[1].count / n * 100)}% of your bookmarks come from @${topAuthor[0]}. This voice is a primary intellectual influence — consider what it says about the ideas you're absorbing.`,
        strength: Math.round(topAuthor[1].count / n * 100)
      });
    }

    // Question asker
    if (this.contentPatterns.questions / n > 0.2) {
      patterns.push({
        pattern: 'Question Collector',
        description: `${Math.round(this.contentPatterns.questions / n * 100)}% of your saves contain questions. You're drawn to inquiry over answers — a sign of genuine intellectual curiosity rather than confirmation-seeking.`,
        strength: Math.round(this.contentPatterns.questions / n * 100)
      });
    }

    // Thread preference
    if (this.contentPatterns.threads / n > 0.15) {
      patterns.push({
        pattern: 'Long-Form Thinker',
        description: `${Math.round(this.contentPatterns.threads / n * 100)}% of your saves are threads or long-form content. You prefer developed arguments over hot takes — valuing depth over virality.`,
        strength: Math.round(this.contentPatterns.threads / n * 100)
      });
    }

    return patterns.sort((a, b) => b.strength - a.strength).slice(0, 6);
  }

  // ── Blind Spots ──
  _identifyBlindSpots(topics) {
    const active = new Set(topics.ranked.filter(t => t.percentage > 3).map(t => t.name));
    const allTopics = Object.keys(TAXONOMY);

    const missingCategories = {
      'Emotional Awareness': ['psychology', 'relationships', 'spirituality'],
      'Physical Grounding': ['health', 'nature', 'food'],
      'Creative Expression': ['creativity', 'writing', 'media_entertainment'],
      'Systems Thinking': ['science', 'mathematics', 'technology'],
      'Social Awareness': ['politics', 'culture', 'geopolitics'],
      'Practical Application': ['business', 'self_improvement', 'finance'],
      'Historical Context': ['history', 'philosophy', 'culture'],
      'Play & Lightness': ['humor', 'gaming', 'media_entertainment']
    };

    const blindSpots = [];
    for (const [category, requiredTopics] of Object.entries(missingCategories)) {
      const coverage = requiredTopics.filter(t => active.has(t)).length;
      if (coverage === 0) {
        blindSpots.push({
          area: category,
          description: `Your bookmarks show little engagement with ${requiredTopics.join(', ')} content. This could represent an unexplored dimension of growth.`,
          severity: 'notable'
        });
      } else if (coverage <= 1 && requiredTopics.length >= 3) {
        blindSpots.push({
          area: category,
          description: `Only minimal coverage of ${category.toLowerCase()} — there may be valuable perspectives you're missing here.`,
          severity: 'mild'
        });
      }
    }

    return blindSpots.slice(0, 4);
  }

  // ── Core Narrative ──
  _buildCoreNarrative(psych, topics, cognitiveStyle, emotionalLandscape) {
    const topTopics = topics.ranked.slice(0, 3).map(t => t.name);
    const archetype = psych.archetype.name;
    const style = cognitiveStyle.primary;
    const tone = emotionalLandscape.tone;

    let narrative = `You are ${archetype}, with a mind that moves in ${style} patterns. `;
    narrative += `Your bookmarks tell the story of someone deeply engaged with ${this._humanizeTopics(topTopics)}. `;

    if (psych.drives.length > 0) {
      narrative += `At your core, you are driven by ${psych.drives[0].drive.toLowerCase()}`;
      if (psych.drives.length > 1) narrative += ` and ${psych.drives[1].drive.toLowerCase()}`;
      narrative += '. ';
    }

    if (psych.tensions.length > 0) {
      narrative += `Your central tension: ${psych.tensions[0].split('—')[0].trim().toLowerCase()} — and navigating this is part of what makes your perspective unique. `;
    }

    narrative += `Your emotional register is ${tone.toLowerCase()}, and your intellectual character is that of a ${cognitiveStyle.blend.toLowerCase()}.`;

    return {
      narrative,
      archetype: psych.archetype.name,
      tagline: this._generateTagline(psych, topTopics, cognitiveStyle)
    };
  }

  _humanizeTopics(topics) {
    const labels = {
      technology: 'technology and building',
      philosophy: 'philosophical inquiry',
      psychology: 'the human mind',
      finance: 'markets and value creation',
      politics: 'power and governance',
      science: 'scientific understanding',
      creativity: 'creative expression',
      health: 'physical optimization',
      business: 'entrepreneurship and strategy',
      spirituality: 'consciousness and meaning',
      relationships: 'human connection',
      culture: 'culture and society',
      self_improvement: 'personal mastery',
      humor: 'humor and absurdity',
      nature: 'the natural world',
      history: 'historical perspective',
      writing: 'the craft of writing',
      mathematics: 'mathematical thinking',
      gaming: 'interactive worlds',
      food: 'culinary culture',
      geopolitics: 'global power dynamics',
      crypto_web3: 'decentralized systems',
      media_entertainment: 'media and storytelling'
    };
    const mapped = topics.map(t => labels[t] || t);
    if (mapped.length === 1) return mapped[0];
    if (mapped.length === 2) return `${mapped[0]} and ${mapped[1]}`;
    return `${mapped.slice(0, -1).join(', ')}, and ${mapped[mapped.length - 1]}`;
  }

  _generateTagline(psych, topTopics, style) {
    const templates = [
      `A ${style.primary} mind drawn to ${topTopics[0] || 'ideas'}, shaped by ${psych.drives[0]?.drive?.toLowerCase() || 'curiosity'}.`,
      `${psych.archetype.name}: where ${topTopics[0] || 'knowledge'} meets ${topTopics[1] || 'wonder'}.`,
      `Driven by ${psych.drives[0]?.drive?.toLowerCase() || 'discovery'}, anchored in ${style.primary.toLowerCase()} thinking.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // ── Measurable Stats ──
  _buildMeasurableStats(topics, authors, temporal, vocabulary) {
    return {
      totalBookmarks: this.bookmarks.length,
      uniqueAuthors: Object.keys(this.authorMap).length,
      uniqueTopics: topics.ranked.length,
      topicDiversity: topics.diversityScore,
      avgBookmarkWords: Math.round(this.wordCounts.reduce((a, b) => a + b, 0) / (this.bookmarks.length || 1)),
      longestBookmark: Math.max(...this.wordCounts, 0),
      shortestBookmark: Math.min(...this.wordCounts, 0),
      vocabRichness: vocabulary.richness,
      uniqueWordsEncountered: vocabulary.uniqueWords,
      totalHashtags: Object.values(this.hashtagFreq).reduce((a, b) => a + b, 0),
      totalLinks: Object.values(this.linkDomains).reduce((a, b) => a + b, 0),
      mediaBookmarks: this.mediaStats.total,
      threadBookmarks: this.contentPatterns.threads,
      questionBookmarks: this.contentPatterns.questions,
      peakHour: temporal.peakHourLabel,
      peakDay: temporal.peakDay,
      avgLikesPerBookmark: Math.round(this.metricTotals.likes / (this.metricTotals.count || 1)),
      timeSpan: this._getTimeSpan()
    };
  }

  // ── Helpers ──
  _getTimeSpan() {
    const dates = this.bookmarks
      .map(b => b.timestamp ? new Date(b.timestamp) : null)
      .filter(d => d && !isNaN(d))
      .sort((a, b) => a - b);
    if (dates.length < 2) return null;
    const days = Math.round((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24));
    return { days, months: Math.round(days / 30), earliest: dates[0].toISOString(), latest: dates[dates.length - 1].toISOString() };
  }

  // ── OCEAN Big Five Profile ──
  // Inferred from topic patterns, keyword signals, and behavioral indicators.
  // Inspired by Mairesse et al. (2007) and Park et al. (2015) social media research.
  _buildOCEANProfile(topics, vocabulary, temporal) {
    const n = this.bookmarks.length || 1;
    const scores = { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 };

    // --- Openness to Experience ---
    // Predicts: breadth of topics, philosophy/art/science, diverse vocab, novelty words
    OCEAN_SIGNALS.openness.topicBoost.forEach(t => { scores.openness += (this.topicHits[t]?.length || 0) * 1.5; });
    scores.openness += this.oceanSignals.openness * 3;
    scores.openness += topics.diversityScore * 0.5;               // broad interests = higher O
    scores.openness += Math.min(30, vocabulary.richness * 0.3);   // rich vocabulary = higher O
    scores.openness += this.liwc.insight * 2;                     // reflective thinking
    scores.openness += this.contentPatterns.questions * 0.5;      // question-seeking

    // --- Conscientiousness ---
    // Predicts: self-improvement content, health, planning words, consistent temporal patterns
    OCEAN_SIGNALS.conscientiousness.topicBoost.forEach(t => { scores.conscientiousness += (this.topicHits[t]?.length || 0) * 2; });
    scores.conscientiousness += this.oceanSignals.conscientiousness * 3;
    scores.conscientiousness += this.sentimentSignals.aspirational * 2;
    scores.conscientiousness += this.liwc.reward * 1.5;           // goal/reward focus
    // Morning bookmarking suggests disciplined habits
    const morningActivity = temporal.distribution?.morning || 0;
    if (morningActivity > 30) scores.conscientiousness += 10;

    // --- Extraversion ---
    // Predicts: social/relationship content, entertainment, humor, high-viral content saves
    OCEAN_SIGNALS.extraversion.topicBoost.forEach(t => { scores.extraversion += (this.topicHits[t]?.length || 0) * 1.5; });
    scores.extraversion += this.oceanSignals.extraversion * 3;
    scores.extraversion += this.liwc.social * 2;                  // social content
    scores.extraversion += this.liwc.positiveAffect * 1;
    scores.extraversion += this.pronounTotals.you * 2;            // addressing others = extraverted
    const avgLikes = this.metricTotals.count > 0 ? this.metricTotals.likes / this.metricTotals.count : 0;
    if (avgLikes > 2000) scores.extraversion += 10;               // viral content preference

    // --- Agreeableness ---
    // Predicts: empathy/vulnerability words, relationship content, less critical
    OCEAN_SIGNALS.agreeableness.topicBoost.forEach(t => { scores.agreeableness += (this.topicHits[t]?.length || 0) * 2; });
    scores.agreeableness += this.oceanSignals.agreeableness * 4;
    scores.agreeableness += this.sentimentSignals.vulnerable * 3;
    scores.agreeableness += this.liwc.social * 1;
    scores.agreeableness -= this.sentimentSignals.critical * 1.5; // critical content = lower A
    scores.agreeableness -= this.sentimentSignals.confrontational * 2;

    // --- Neuroticism (Emotional Reactivity) ---
    // Predicts: negative emotion words, anxiety content, late-night saving patterns
    OCEAN_SIGNALS.neuroticism.topicBoost.forEach(t => { scores.neuroticism += (this.topicHits[t]?.length || 0) * 2; });
    scores.neuroticism += this.oceanSignals.neuroticism * 4;
    scores.neuroticism += this.liwc.negativeAffect * 2;
    scores.neuroticism += this.liwc.risk * 1;
    const lateNightPct = temporal.distribution?.lateNight || 0;
    if (lateNightPct > 30) scores.neuroticism += 15;              // late night = higher N tendency
    scores.neuroticism += this.liwc.discrepancy * 0.5;            // "should/would/could" = rumination

    // Normalize all scores to 0-100
    // Use soft normalization: 100 = very strong signal relative to corpus
    const normalize = (v, cap) => Math.min(100, Math.max(0, Math.round((v / Math.max(cap, 1)) * 100)));
    const capScale = n * 0.5; // scale relative to bookmark count
    const normalized = {
      openness:          normalize(scores.openness, capScale * 2),
      conscientiousness: normalize(scores.conscientiousness, capScale * 1.5),
      extraversion:      normalize(scores.extraversion, capScale * 1.5),
      agreeableness:     Math.max(0, normalize(scores.agreeableness, capScale)),
      neuroticism:       normalize(scores.neuroticism, capScale)
    };

    // OCEAN descriptions (high-score framing)
    const traits = [
      {
        trait: 'Openness',
        score: normalized.openness,
        high: 'Intellectually curious, imaginative, drawn to novelty and abstract ideas',
        low: 'Practical, conventional, preference for familiar and concrete information',
        desc: OCEAN_SIGNALS.openness.desc
      },
      {
        trait: 'Conscientiousness',
        score: normalized.conscientiousness,
        high: 'Goal-oriented, organized, self-disciplined, deliberate in choices',
        low: 'Flexible, spontaneous, process-driven rather than outcome-driven',
        desc: OCEAN_SIGNALS.conscientiousness.desc
      },
      {
        trait: 'Extraversion',
        score: normalized.extraversion,
        high: 'Energized by social connection, seeks stimulation, positive and assertive',
        low: 'Prefers solitude and depth, introspective, internally motivated',
        desc: OCEAN_SIGNALS.extraversion.desc
      },
      {
        trait: 'Agreeableness',
        score: normalized.agreeableness,
        high: 'Empathetic, cooperative, trusting, values harmony and human connection',
        low: 'Direct, competitive, skeptical — prioritizes truth over comfort',
        desc: OCEAN_SIGNALS.agreeableness.desc
      },
      {
        trait: 'Emotional Reactivity',
        score: normalized.neuroticism,
        high: 'Emotionally sensitive and responsive; feels the world deeply',
        low: 'Emotionally stable, calm under pressure, resilient',
        desc: OCEAN_SIGNALS.neuroticism.desc
      }
    ].sort((a, b) => b.score - a.score);

    // Dominant trait description
    const top = traits[0];
    const interpretation = top.score > 60 ? top.high : top.score < 35 ? top.low : 'Moderate expression — balanced between both poles';

    return { traits, normalized, topTrait: top.trait, interpretation };
  }

  // ── Schwartz Values Profile ──
  // Based on Schwartz (1992, 2012) Basic Human Values theory.
  // Four higher-order clusters derived from keyword signals + topic patterns.
  _buildSchwartzValues(topics) {
    const n = this.bookmarks.length || 1;
    const scores = { selfEnhancement: 0, selfTranscendence: 0, opennessToChange: 0, conservation: 0 };

    // Add keyword signal counts
    for (const [dim, val] of Object.entries(this.schwartzSignals)) {
      scores[dim] += val * 3;
    }

    // Add topic-based signals
    for (const [dim, def] of Object.entries(SCHWARTZ)) {
      for (const t of def.topics) {
        scores[dim] += (this.topicHits[t]?.length || 0) * 1.5;
      }
    }

    // Compute percentages relative to total signal
    const total = Object.values(scores).reduce((a, b) => a + b, 1);
    const pct = {};
    for (const [k, v] of Object.entries(scores)) {
      pct[k] = Math.round((v / total) * 100);
    }

    // Dominant and secondary values
    const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
    const dominant = sorted[0][0];
    const secondary = sorted[1][0];

    return {
      scores: pct,
      dominant,
      secondary,
      dominantLabel: SCHWARTZ[dominant].label,
      dominantDesc: SCHWARTZ[dominant].desc,
      secondaryLabel: SCHWARTZ[secondary].label,
      dimensions: Object.entries(SCHWARTZ).map(([key, def]) => ({
        key,
        label: def.label,
        desc: def.desc,
        score: pct[key] || 0
      })).sort((a, b) => b.score - a.score)
    };
  }

  // ── Linguistic Profile (LIWC-inspired) ──
  // Psycholinguistic dimensions derived from Pennebaker et al. LIWC framework.
  _buildLinguisticProfile(vocabulary) {
    const n = this.bookmarks.length || 1;
    const totalWords = vocabulary.totalWords || 1;

    // Analytical Thinking score (0-100): higher = more analytical, formal, logical
    // LIWC: articles + prepositions + numbers indicate analytical writing
    // Here: causation words + certainty + low tentativeness
    const analyticalScore = Math.min(100, Math.round(
      ((this.liwc.causation * 4 + this.liwc.certainty * 3 + this.sentimentSignals.analytical * 5) / totalWords) * 1000
    ));

    // Clout score (0-100): social confidence, expertise signaling
    // LIWC: first-person plural, positive assertions, fewer hedges
    const totalPronouns = this.pronounTotals.i + this.pronounTotals.we + this.pronounTotals.you + this.pronounTotals.they + 1;
    const weRatio = this.pronounTotals.we / totalPronouns;
    const cloutScore = Math.min(100, Math.round(
      (weRatio * 40 + (this.liwc.reward / totalWords) * 500 + (this.liwc.certainty / totalWords) * 300)
    ));

    // Authenticity score (0-100): honest, unguarded expression
    // LIWC: exclusive words (but/except), negative emotion, first-person singular
    const iRatio = this.pronounTotals.i / totalPronouns;
    const authenticityScore = Math.min(100, Math.round(
      (iRatio * 30 + (this.liwc.exclusive / totalWords) * 400 + (this.liwc.negativeAffect / totalWords) * 300)
    ));

    // Cognitive Complexity: how much the content engages deeper thinking
    const cogComplexity = Math.min(100, Math.round(
      ((this.liwc.insight + this.liwc.causation + this.liwc.discrepancy + this.liwc.tentative) / totalWords) * 800
    ));

    // Emotional Tone: % positive relative to total emotional content
    const totalAffect = this.liwc.positiveAffect + this.liwc.negativeAffect + 1;
    const emotionalTone = Math.round((this.liwc.positiveAffect / totalAffect) * 100);

    // Pronoun orientation
    const pronounFocus = iRatio > 0.4 ? 'Self-Focused' : weRatio > 0.3 ? 'Collective' : this.pronounTotals.you > this.pronounTotals.i ? 'Other-Directed' : 'Balanced';

    // Reading complexity proxy (avg word length as syllable proxy)
    const avgWordLen = parseFloat(vocabulary.avgWordLength) || 4;
    let readingLevel = 'Accessible';
    if (avgWordLen > 6.5) readingLevel = 'Advanced';
    else if (avgWordLen > 5.5) readingLevel = 'Intermediate-High';
    else if (avgWordLen > 4.5) readingLevel = 'Intermediate';

    return {
      analyticalScore,
      cloutScore,
      authenticityScore,
      cognitiveComplexity: cogComplexity,
      emotionalTone,
      pronounFocus,
      readingLevel,
      pronounBreakdown: {
        selfFocus: Math.round(iRatio * 100),
        collective: Math.round(weRatio * 100),
        otherRef: Math.round((this.pronounTotals.you / totalPronouns) * 100)
      },
      rawLiwc: this.liwc
    };
  }

  // ── Topic Velocity ── (which topics are growing or declining over time)
  _buildTopicVelocity(topics) {
    // Need at least 2 months of data
    const monthKeys = Object.keys(this.temporalBuckets.monthly).sort();
    if (monthKeys.length < 2) return [];

    const midpoint = Math.floor(monthKeys.length / 2);
    const earlyMonths = new Set(monthKeys.slice(0, midpoint));
    const recentMonths = new Set(monthKeys.slice(midpoint));

    // For each topic, count hits in early vs recent period
    const velocity = [];
    for (const [topicName, hits] of Object.entries(this.topicHits)) {
      let earlyCount = 0, recentCount = 0;
      for (const h of hits) {
        if (!h.timestamp) continue;
        const d = new Date(h.timestamp);
        if (isNaN(d)) continue;
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (earlyMonths.has(mk)) earlyCount++;
        else if (recentMonths.has(mk)) recentCount++;
      }
      if (earlyCount + recentCount < 5) continue;
      const change = recentCount - earlyCount;
      const pctChange = earlyCount > 0 ? Math.round((change / earlyCount) * 100) : 100;
      velocity.push({ topic: topicName, earlyCount, recentCount, change, pctChange });
    }

    return velocity
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 8)
      .map(v => ({
        ...v,
        trend: v.pctChange > 25 ? 'rising' : v.pctChange < -25 ? 'fading' : 'stable'
      }));
  }

  _capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''; }

  _emptyProfile() {
    return {
      summary: { totalBookmarks: 0, uniqueAuthors: 0, topicsDetected: 0 },
      topics: { ranked: [], diversityScore: 0, clusters: [], totalTopicHits: 0 },
      authors: [],
      temporal: { peakHour: 0, peakHourLabel: '—', peakDay: '—', timePersona: 'Unknown', hourlyDistribution: new Array(24).fill(0), dailyDistribution: new Array(7).fill(0), monthlyDistribution: {}, trend: 'unknown', distribution: {} },
      vocabulary: { topWords: [], topHashtags: [], topMentions: [], richness: 0, avgWordLength: 0, uniqueWords: 0, totalWords: 0 },
      informationDiet: { topDomains: [], domainTypes: {}, formatPreference: 'Unknown', depthScore: 0, contentBreakdown: {} },
      cognitiveStyle: { primary: 'unknown', secondary: 'unknown', scores: {}, description: '', blend: '' },
      emotionalLandscape: { tone: 'Unknown', dimensions: {}, draws: [], raw: {} },
      intellectualCharacter: { breadth: 0, depthOrientation: 'Unknown', contrarianIndex: 0, engagementDepth: 0, riskAppetite: 0, rigour: 0 },
      socialOrientation: { uniqueAuthors: 0, socialStance: 'Unknown', authorityBias: 'Unknown' },
      psychProfile: { archetype: { name: 'The Seeker', icon: '🧭', description: 'Not enough data for deep analysis.' }, drives: [], tensions: [] },
      hiddenPatterns: [],
      blindSpots: [],
      coreNarrative: { narrative: 'More bookmarks needed for a meaningful profile.', tagline: '' },
      measurableStats: {},
      contentPatterns: {},
      sentimentSignals: {},
      mediaStats: {}
    };
  }
}


// ═══════════════════════════════════════════════
// STORAGE MANAGER
// ═══════════════════════════════════════════════

class StorageManager {
  constructor() {
    this.dbName = 'BookmarkMirror';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('analyses')) {
          db.createObjectStore('analyses', { keyPath: 'id', autoIncrement: true })
            .createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async saveAnalysis(data) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['analyses'], 'readwrite');
      const req = tx.objectStore('analyses').add(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getLastAnalysis() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['analyses'], 'readonly');
      const req = tx.objectStore('analyses').index('timestamp').openCursor(null, 'prev');
      req.onsuccess = () => {
        const cursor = req.result;
        resolve(cursor ? { ...cursor.value, id: cursor.primaryKey } : null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getAnalysis(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['analyses'], 'readonly');
      const req = tx.objectStore('analyses').get(id);
      req.onsuccess = () => resolve(req.result ? { ...req.result, id } : null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllAnalyses() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['analyses'], 'readonly');
      const req = tx.objectStore('analyses').index('timestamp').openCursor(null, 'prev');
      const results = [];
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) { results.push({ ...cursor.value, id: cursor.primaryKey }); cursor.continue(); }
        else resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }
}


// ═══════════════════════════════════════════════
// ANALYSIS CONTROLLER
// ═══════════════════════════════════════════════

class AnalysisController {
  constructor() {
    this.storage = new StorageManager();
    this.inference = new InferenceEngine();
    this.status = 'idle'; // idle | scraping | analyzing | complete | error
    this.scraperTabId = null;
    this.bookmarkCount = 0;
    this.startTime = null;
    this.lastAnalysisId = null;
    this.keepaliveInterval = null;
    this._setupListeners();
    console.log('[Controller] Initialized');
  }

  _setupListeners() {
    // Handle messages from popup and scraper
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      this._handleMessage(msg, sender).then(sendResponse).catch(e => {
        console.error('[Controller] Handler error:', e);
        sendResponse({ error: e.message });
      });
      return true; // async
    });

    // Handle port connections (keepalive from scraper)
    chrome.runtime.onConnect.addListener(port => {
      if (port.name === 'scraper-keepalive') {
        console.log('[Controller] Scraper keepalive port connected');
        port.onMessage.addListener(msg => {
          if (msg.type === 'PING' && msg.totalCaptured !== undefined) {
            this.bookmarkCount = msg.totalCaptured;
          }
        });
        port.onDisconnect.addListener(() => {
          console.log('[Controller] Scraper keepalive port disconnected');
        });
      }
    });

    // Tab close handler
    chrome.tabs.onRemoved.addListener(tabId => {
      if (tabId === this.scraperTabId) {
        console.log('[Controller] Scraper tab closed');
        if (this.status === 'scraping') this._finishAnalysis('tab_closed');
      }
    });
  }

  async _handleMessage(msg, sender) {
    switch (msg.type) {
      case 'START_ANALYSIS':
        return this._startAnalysis();

      case 'STOP_AND_GENERATE':
        // Tell scraper to stop, then finalize
        if (this.scraperTabId) {
          try { await chrome.tabs.sendMessage(this.scraperTabId, { type: 'SCRAPER_STOP' }); } catch (e) {}
        }
        return this._finishAnalysis('user_stopped');

      case 'GET_STATUS':
        return this._getStatus();

      case 'OPEN_RESULTS':
        return this._openResults();

      case 'GET_HISTORY':
        return this.storage.getAllAnalyses();

      case 'SCRAPER_READY':
        console.log('[Controller] Scraper ready in tab', sender?.tab?.id);
        return { ok: true };

      // Self-driving scraper sends batches
      case 'SCRAPER_BATCH':
        if (msg.data?.length > 0) {
          this.inference.processBatch(msg.data);
          this.bookmarkCount = msg.totalCaptured || this.bookmarkCount;
          console.log(`[Controller] +${msg.data.length} tweets (total: ${this.bookmarkCount})`);
          this._broadcastProgress();
        }
        return { ok: true };

      // Scraper finished
      case 'SCRAPER_COMPLETE':
        console.log('[Controller] Scraper reports complete. Total:', msg.totalCaptured);
        this.bookmarkCount = msg.totalCaptured || this.bookmarkCount;
        return this._finishAnalysis('scraper_done');

      default:
        return { error: 'unknown message type' };
    }
  }

  async _startAnalysis() {
    if (this.status === 'scraping') return { error: 'Already running' };

    console.log('[Controller] Starting analysis...');
    this.inference.reset();
    this.bookmarkCount = 0;
    this.startTime = Date.now();
    this.status = 'scraping';

    try {
      // Open bookmarks tab (active: true so initial load is fast)
      const tab = await chrome.tabs.create({ url: 'https://x.com/i/bookmarks', active: true });
      this.scraperTabId = tab.id;
      console.log('[Controller] Opened tab', tab.id);

      // Wait for full page load
      await this._waitForTabLoad(tab.id);
      console.log('[Controller] Tab loaded, waiting for SPA...');
      await new Promise(r => setTimeout(r, 4000)); // React hydration

      // Inject scraper
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/scraper.js']
      });
      console.log('[Controller] Scraper injected');
      await new Promise(r => setTimeout(r, 1500));

      // Initialize
      const initResult = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPER_INIT' });
      console.log('[Controller] Scraper init:', initResult);

      if (!initResult?.success) {
        throw new Error(initResult?.error || 'Scraper init failed');
      }

      // Tell scraper to start its own loop
      await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPER_START' });
      console.log('[Controller] Scraper loop started');

      // Start backup keepalive polling
      // This keeps the service worker alive AND checks on the scraper
      this._startKeepalive();

      this._broadcastProgress();
      return { success: true };
    } catch (e) {
      console.error('[Controller] Start error:', e);
      this.status = 'error';
      this._cleanup();
      return { error: e.message };
    }
  }

  // Keepalive: periodically ping the scraper to keep service worker alive
  _startKeepalive() {
    this._stopKeepalive();
    this.keepaliveInterval = setInterval(async () => {
      if (this.status !== 'scraping' || !this.scraperTabId) {
        this._stopKeepalive();
        return;
      }

      try {
        const result = await chrome.tabs.sendMessage(this.scraperTabId, { type: 'PING' });
        if (result?.totalCaptured !== undefined) {
          this.bookmarkCount = result.totalCaptured;
        }
        // If scraper stopped running on its own, finish
        if (result?.alive && !result?.running && this.bookmarkCount > 0) {
          console.log('[Controller] Scraper stopped running, finalizing');
          await this._finishAnalysis('scraper_stopped');
        }
        this._broadcastProgress();
      } catch (e) {
        // Tab might be gone
        console.warn('[Controller] Keepalive ping failed:', e.message);
        if (this.bookmarkCount > 0) {
          await this._finishAnalysis('connection_lost');
        } else {
          this.status = 'error';
          this._cleanup();
        }
      }
    }, 3000); // Every 3 seconds
  }

  _stopKeepalive() {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }
  }

  _waitForTabLoad(tabId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('Tab load timeout'));
      }, 30000);

      const listener = (id, info) => {
        if (id === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          clearTimeout(timeout);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  async _finishAnalysis(reason) {
    if (this.status === 'analyzing' || this.status === 'complete') return { already: true };

    console.log('[Controller] Finishing. Reason:', reason, 'Bookmarks:', this.bookmarkCount);
    this.status = 'analyzing';
    this._stopKeepalive();

    // Tell scraper to stop if still running
    if (this.scraperTabId) {
      try { await chrome.tabs.sendMessage(this.scraperTabId, { type: 'SCRAPER_STOP' }); } catch (e) {}
    }

    // Close scraper tab
    if (this.scraperTabId) {
      try { await chrome.tabs.remove(this.scraperTabId); } catch (e) {}
      this.scraperTabId = null;
    }

    // Run inference
    const results = this.inference.finalize();
    console.log('[Controller] Inference complete. Topics:', results.topics?.ranked?.length || 0);

    // Save
    try {
      const record = {
        timestamp: new Date().toISOString(),
        bookmarkCount: this.bookmarkCount,
        duration: Date.now() - (this.startTime || Date.now()),
        reason,
        results
      };
      this.lastAnalysisId = await this.storage.saveAnalysis(record);
      console.log('[Controller] Saved analysis ID:', this.lastAnalysisId);

      this.status = 'complete';
      this._broadcastComplete();

      // Auto-open results
      await this._openResults();
    } catch (e) {
      console.error('[Controller] Save error:', e);
      this.status = 'error';
    }

    return { success: true };
  }

  _cleanup() {
    this._stopKeepalive();
    if (this.scraperTabId) {
      try { chrome.tabs.remove(this.scraperTabId); } catch (e) {}
      this.scraperTabId = null;
    }
  }

  _getStatus() {
    return {
      status: this.status,
      bookmarkCount: this.bookmarkCount,
      elapsed: this.startTime ? Date.now() - this.startTime : 0,
      lastAnalysisId: this.lastAnalysisId
    };
  }

  _broadcastProgress() {
    chrome.runtime.sendMessage({
      type: 'PROGRESS_UPDATE',
      data: {
        bookmarkCount: this.bookmarkCount,
        elapsed: this.startTime ? Date.now() - this.startTime : 0,
        status: this.status
      }
    }).catch(() => {});
  }

  _broadcastComplete() {
    chrome.runtime.sendMessage({
      type: 'ANALYSIS_COMPLETE',
      data: { id: this.lastAnalysisId, bookmarkCount: this.bookmarkCount }
    }).catch(() => {});
  }

  async _openResults() {
    const last = await this.storage.getLastAnalysis();
    if (!last) return { error: 'No results' };
    chrome.tabs.create({ url: chrome.runtime.getURL(`results/results.html?id=${last.id}`) });
    return { success: true };
  }
}

// Boot
const controller = new AnalysisController();
console.log('[BookmarkMirror] Service worker v3 ready');
