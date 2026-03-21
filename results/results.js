// results.js — Profile renderer
'use strict';

class StorageManager {
  constructor() { this.dbName = 'BookmarkMirror'; this.dbVersion = 1; this.db = null; }

  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.dbVersion);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { this.db = req.result; resolve(); };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('analyses'))
          db.createObjectStore('analyses', { keyPath: 'id', autoIncrement: true }).createIndex('timestamp', 'timestamp');
      };
    });
  }

  async getAnalysis(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.db.transaction(['analyses'], 'readonly').objectStore('analyses').get(id);
      req.onsuccess = () => resolve(req.result ? { ...req.result, id } : null);
      req.onerror = () => reject(req.error);
    });
  }

  async getLastAnalysis() {
    await this.init();
    return new Promise((resolve, reject) => {
      const req = this.db.transaction(['analyses'], 'readonly').objectStore('analyses').index('timestamp').openCursor(null, 'prev');
      req.onsuccess = () => {
        const c = req.result;
        resolve(c ? { ...c.value, id: c.primaryKey } : null);
      };
      req.onerror = () => reject(req.error);
    });
  }
}

class ResultsRenderer {
  constructor() {
    this.storage = new StorageManager();
    this.data = null;
    this.init();
  }

  async init() {
    try {
      const params = new URLSearchParams(location.search);
      const id = params.get('id');
      this.data = id ? await this.storage.getAnalysis(parseInt(id)) : await this.storage.getLastAnalysis();

      if (!this.data) {
        document.getElementById('loading').innerHTML = `<p style="color:var(--text-dim)">No analysis found. Run one from the extension popup.</p>`;
        return;
      }

      console.log('Loaded analysis:', this.data);
      this.render();
    } catch (e) {
      console.error('Load error:', e);
      document.getElementById('loading').innerHTML = `<p style="color:#c75050">Error: ${e.message}</p>`;
    }
  }

  render() {
    const { results, bookmarkCount, timestamp } = this.data;
    const r = results;

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('main').classList.remove('hidden');

    this.renderHero(r.psychProfile, r.coreNarrative);
    this.renderStatsBar(r.summary, r.topics);
    this.renderHeroCards(r.measurableStats, r.topics);
    this.renderNarrative(r.coreNarrative);
    this.renderDrives(r.psychProfile?.drives);
    this.renderCognitive(r.cognitiveStyle);
    this.renderEmotional(r.emotionalLandscape);
    this.renderTopics(r.topics?.ranked);
    this.renderClusters(r.topics?.clusters);
    this.renderIntellect(r.intellectualCharacter);
    this.renderOCEAN(r.oceanProfile);
    this.renderSchwartzValues(r.schwartzValues);
    this.renderLinguistic(r.linguisticProfile);
    this.renderSocial(r.socialOrientation);
    this.renderEngagementProfile(r.engagementProfile);
    this.renderPatterns(r.hiddenPatterns);
    this.renderBlindSpots(r.blindSpots);
    this.renderAuthors(r.authors);
    this.renderTemporal(r.temporal);
    this.renderDiet(r.informationDiet);
    this.renderVocabulary(r.vocabulary);
    this.renderNumbers(r.measurableStats);
    this.bindEvents();
  }

  // ── Hero ──
  renderHero(psych, narrative) {
    if (!psych?.archetype) return;
    const a = psych.archetype;
    document.getElementById('archetype-icon').textContent = a.icon || '🧭';
    document.getElementById('archetype-name').textContent = a.name || 'The Seeker';
    document.getElementById('archetype-desc').textContent = a.description || '';
    if (psych.secondaryArchetype) {
      document.getElementById('archetype-secondary').textContent = `with shades of ${psych.secondaryArchetype.icon} ${psych.secondaryArchetype.name}`;
    }
    if (narrative?.tagline) {
      document.getElementById('tagline').textContent = narrative.tagline;
    }
  }

  // ── Stats Bar ──
  renderStatsBar(summary, topics) {
    if (!summary) return;
    document.getElementById('stat-bookmarks').textContent = summary.totalBookmarks?.toLocaleString() || 0;
    document.getElementById('stat-authors').textContent = summary.uniqueAuthors?.toLocaleString() || 0;
    document.getElementById('stat-topics').textContent = summary.topicsDetected || 0;
    document.getElementById('stat-diversity').textContent = (topics?.diversityScore || 0) + '%';
    const ts = summary.timeSpan;
    document.getElementById('stat-span').textContent = ts ? (ts.months > 0 ? `${ts.months} mo` : `${ts.days} d`) : '—';
  }

  // ── Narrative ──
  renderNarrative(narrative) {
    document.getElementById('narrative').textContent = narrative?.narrative || '';
  }

  // ── Drives ──
  renderDrives(drives) {
    const container = document.getElementById('drives-list');
    if (!drives?.length) { container.innerHTML = '<p class="empty-state">Not enough data to determine core drives.</p>'; return; }
    container.innerHTML = drives.map(d => `
      <div class="drive-item">
        <span class="drive-name">${d.drive}</span>
        <div class="drive-bar-container">
          <div class="drive-bar-track"><div class="drive-bar-fill" style="width:${d.strength}%"></div></div>
          <span class="drive-desc">${d.desc}</span>
        </div>
        <span class="drive-strength">${d.strength}%</span>
      </div>
    `).join('');
  }

  // ── Cognitive Style ──
  renderCognitive(cog) {
    if (!cog) return;
    document.getElementById('cognitive-blend').textContent = cog.blend || '';
    document.getElementById('cognitive-desc').textContent = cog.description || '';

    const container = document.getElementById('cognitive-bars');
    const scores = cog.scores || {};
    container.innerHTML = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => `
        <div class="bar-row">
          <span class="bar-label">${this.cap(name)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${val}%"></div></div>
          <span class="bar-value">${val}</span>
        </div>
      `).join('');
  }

  // ── Emotional Landscape ──
  renderEmotional(emo) {
    if (!emo) return;
    document.getElementById('emotional-tone').textContent = emo.tone || '';

    const dims = emo.dimensions || {};
    document.getElementById('emotional-dims').innerHTML = Object.entries(dims)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => `
        <div class="bar-row">
          <span class="bar-label">${this.cap(name)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${val}%"></div></div>
          <span class="bar-value">${val}%</span>
        </div>
      `).join('');

    const draws = emo.draws || [];
    document.getElementById('emotional-draws').innerHTML = draws.map(d =>
      `<div class="draw-item">${d}</div>`
    ).join('');
  }

  // ── Topics ──
  renderTopics(topics) {
    const container = document.getElementById('topic-chart');
    if (!topics?.length) { container.innerHTML = '<p class="empty-state">No topics detected.</p>'; return; }
    const max = topics[0]?.totalScore || topics[0]?.count || 1;
    container.innerHTML = topics.slice(0, 15).map((t, i) => `
      <div class="topic-row">
        <span class="topic-rank">${i + 1}</span>
        <span class="topic-name">${this.cap(t.name)}</span>
        <div class="topic-bar-wrap"><div class="topic-bar-fill" style="width:${((t.totalScore || t.count) / max * 100)}%"></div></div>
        <span class="topic-count">${t.count}</span>
        <span class="topic-pct">${t.percentage}%</span>
      </div>
    `).join('');
  }

  // ── Clusters ──
  renderClusters(clusters) {
    const section = document.getElementById('clusters-section');
    const container = document.getElementById('clusters-list');
    if (!clusters?.length) { section.classList.add('hidden'); return; }
    container.innerHTML = clusters.map(c =>
      `<div class="cluster-chip">
        <span>${this.cap(c.topics[0])}</span>
        <span class="cluster-x">×</span>
        <span>${this.cap(c.topics[1])}</span>
        <span class="cluster-count">(${c.count})</span>
      </div>`
    ).join('');
  }

  // ── Intellectual Character ──
  renderIntellect(ic) {
    if (!ic) return;
    const items = [
      { label: 'Curiosity Breadth', value: ic.breadth + '%', desc: `${ic.depthOrientation}` },
      { label: 'Top 3 Topics Share', value: ic.topThreeShare + '%', desc: 'Concentration in top interests' },
      { label: 'Contrarian Index', value: ic.contrarianIndex + '%', desc: 'Counter-narrative attraction' },
      { label: 'Risk Appetite', value: ic.riskAppetite + '%', desc: 'Edgy or volatile topics' },
      { label: 'Engagement Depth', value: ic.engagementDepth + '%', desc: 'Preference for questions & threads' },
      { label: 'Rigour', value: ic.rigour + '%', desc: 'Analytical & evidence-based content' }
    ];
    document.getElementById('intellect-grid').innerHTML = items.map(i => `
      <div class="intellect-item">
        <div class="intellect-label">${i.label}</div>
        <div class="intellect-value">${i.value}</div>
        <div class="intellect-desc">${i.desc}</div>
      </div>
    `).join('');
  }

  // ── Social Orientation ──
  renderSocial(social) {
    if (!social) return;
    const rows = [
      ['Social Stance', social.socialStance],
      ['Authority Bias', social.authorityBias],
      ['Unique Voices', social.uniqueAuthors?.toString()],
      ['Top Author Share', social.topAuthorConcentration + '%'],
      ['Loyalty Score', social.loyaltyPct + '%'],
      ['Avg Likes/Bookmark', social.avgEngagement?.likes?.toLocaleString()]
    ];
    document.getElementById('social-content').innerHTML = rows.map(([label, value]) =>
      `<div class="social-stat"><span class="social-stat-label">${label}</span><span class="social-stat-value">${value || '—'}</span></div>`
    ).join('');
  }

  // ── Hidden Patterns ──
  renderPatterns(patterns) {
    const section = document.getElementById('patterns-section');
    const container = document.getElementById('patterns-list');
    if (!patterns?.length) { section.classList.add('hidden'); return; }
    container.innerHTML = patterns.map(p => `
      <div class="pattern-item">
        <div class="pattern-name">${p.pattern}</div>
        <div class="pattern-desc">${p.description}</div>
        <span class="pattern-strength">Strength: ${p.strength}%</span>
      </div>
    `).join('');
  }

  // ── Blind Spots ──
  renderBlindSpots(spots) {
    const section = document.getElementById('blindspots-section');
    const container = document.getElementById('blindspots-list');
    if (!spots?.length) { section.classList.add('hidden'); return; }
    container.innerHTML = spots.map(s => `
      <div class="blindspot-item">
        <div class="blindspot-area">${s.area}</div>
        <div class="blindspot-desc">${s.description}</div>
      </div>
    `).join('');
  }

  // ── Authors ──
  renderAuthors(authors) {
    const container = document.getElementById('authors-list');
    if (!authors?.length) { container.innerHTML = '<p class="empty-state">No author data.</p>'; return; }

    const top = authors[0];
    const headline = `<div class="author-headline">
      <span class="author-headline-num">${top.count}</span>
      <span class="author-headline-text">saves from @${top.handle} — your most trusted voice</span>
    </div>`;

    const list = authors.slice(0, 15).map((a, i) => `
      <div class="author-item">
        <span class="author-rank">${i + 1}</span>
        <div class="author-info">
          <div class="author-name">${a.displayName || a.handle}</div>
          <div class="author-handle">@${a.handle}</div>
        </div>
        <div style="text-align:right">
          <div class="author-count">${a.count}</div>
          <div class="author-pct">${a.percentageOfBookmarks}%</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = headline + list;
  }

  // ── Hero Cards ──
  renderHeroCards(stats, topics) {
    if (!stats) return;
    const rtEl = document.getElementById('hero-reading-time');
    if (rtEl) rtEl.textContent = stats.readingTimeDisplay || '—';

    const topTopic = topics?.ranked?.[0];
    const topicNameEl = document.getElementById('hero-top-topic-name');
    const topicLabelEl = document.getElementById('hero-top-topic-label');
    if (topicNameEl && topTopic) {
      topicNameEl.textContent = this.cap(topTopic.name);
      if (topicLabelEl) topicLabelEl.textContent = `${topTopic.percentage}% of your saves`;
    }

    const velEl = document.getElementById('hero-velocity');
    if (velEl) velEl.textContent = stats.velocityPerWeek != null ? stats.velocityPerWeek : '—';
  }

  // ── Engagement Profile ──
  renderEngagementProfile(profile) {
    const section = document.getElementById('engagement-section');
    if (!profile) { section?.classList.add('hidden'); return; }

    const labelEl = document.getElementById('engagement-label');
    if (labelEl) labelEl.textContent = profile.label;

    const insightEl = document.getElementById('engagement-insight');
    if (insightEl) insightEl.textContent = profile.insight;

    const barsEl = document.getElementById('engagement-bars');
    if (!barsEl || !profile.buckets?.length) return;

    const maxPct = Math.max(...profile.buckets.map(b => b.pct), 1);
    barsEl.innerHTML = profile.buckets.map(b => `
      <div class="eng-row">
        <span class="eng-label">${b.label}</span>
        <div class="eng-bar-track">
          <div class="eng-bar-fill" style="width:${(b.pct / maxPct) * 100}%"></div>
        </div>
        <span class="eng-pct">${b.pct}%</span>
      </div>
    `).join('');
  }

  // ── Temporal ──
  renderTemporal(temporal) {
    if (!temporal) return;
    document.getElementById('temporal-persona').textContent = temporal.timePersona || '';
    document.getElementById('temporal-peak-hour').textContent = temporal.peakHourLabel || '—';
    document.getElementById('temporal-peak-day').textContent = temporal.peakDay || '—';
    document.getElementById('temporal-trend').textContent = this.cap(temporal.trend || 'steady');

    const hourly = temporal.hourlyDistribution || [];
    const maxHour = Math.max(...hourly, 1);
    const peakH = hourly.indexOf(maxHour);

    const barsHtml = hourly.map((val, h) =>
      `<div class="hour-bar${h === peakH ? ' peak' : ''}" style="height:${(val / maxHour * 100)}%" title="${this.formatHour(h)}: ${val}"></div>`
    ).join('');

    const labels = [0, 3, 6, 9, 12, 15, 18, 21].map(h =>
      `<span class="hour-label" style="flex:3">${h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? h + 'a' : (h - 12) + 'p'}</span>`
    );

    document.getElementById('hourly-chart').innerHTML =
      `<div class="hourly-chart" style="display:flex;align-items:flex-end;gap:2px;height:80px">${barsHtml}</div>
       <div class="hour-labels" style="display:flex;gap:2px;margin-top:4px">${labels.join('')}</div>`;

    // Day of week chart
    const dayEl = document.getElementById('daily-chart');
    if (dayEl && temporal.dailyDistribution?.length) {
      const maxD = Math.max(...temporal.dailyDistribution, 1);
      dayEl.innerHTML = temporal.dailyDistribution.map((val, d) =>
        `<div class="day-bar${d === temporal.dailyDistribution.indexOf(Math.max(...temporal.dailyDistribution)) ? ' peak' : ''}" style="height:${Math.max((val / maxD) * 100, 3)}%" title="${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]}: ${val}"></div>`
      ).join('');
    }

    // Velocity row
    const velRow = document.getElementById('velocity-row');
    if (velRow && temporal.monthlyDistribution) {
      const monthEntries = Object.entries(temporal.monthlyDistribution).sort();
      const peakMonth = monthEntries.sort((a, b) => b[1] - a[1])[0];
      velRow.innerHTML = peakMonth ? `
        <div class="vel-stat"><span class="vel-num">${peakMonth[1]}</span><span class="vel-label">Peak Month</span></div>
        <div class="vel-stat"><span class="vel-num">${monthEntries.length}</span><span class="vel-label">Months Active</span></div>
        <div class="vel-stat"><span class="vel-num">${this.cap(temporal.trend || 'steady')}</span><span class="vel-label">Trend</span></div>
      ` : '';
    }
  }

  // ── Information Diet ──
  renderDiet(diet) {
    if (!diet) return;
    document.getElementById('diet-format').textContent = diet.formatPreference || '';
    document.getElementById('diet-depth').textContent = diet.depthScore || 0;

    const bd = diet.contentBreakdown || {};
    const items = [
      ['Text Only', bd.textOnly],
      ['With Media', bd.mediaRich],
      ['With Links', bd.links],
      ['Threads', bd.threads],
      ['Questions', bd.questions]
    ].filter(([, v]) => v > 0);

    document.getElementById('diet-breakdown').innerHTML = items.map(([label, val]) =>
      `<div class="diet-item"><span class="diet-item-val">${val}</span><span class="diet-item-label">${label}</span></div>`
    ).join('');

    const domains = diet.topDomains || [];
    document.getElementById('diet-domains').innerHTML = domains.slice(0, 10).map(d =>
      `<div class="domain-row"><span class="domain-name">${d.domain}</span><span class="domain-count">${d.count}</span></div>`
    ).join('');
  }

  // ── Vocabulary ──
  renderVocabulary(vocab) {
    if (!vocab) return;

    document.getElementById('vocab-stats').innerHTML = `
      <div><span class="vocab-stat-val">${vocab.uniqueWords?.toLocaleString() || 0}</span><span class="vocab-stat-label">Unique Words</span></div>
      <div><span class="vocab-stat-val">${vocab.richness || 0}%</span><span class="vocab-stat-label">Vocab Richness</span></div>
      <div><span class="vocab-stat-val">${vocab.avgWordLength || 0}</span><span class="vocab-stat-label">Avg Word Length</span></div>
    `;

    const words = vocab.topWords || [];
    const maxCount = words[0]?.count || 1;
    const top5 = words.slice(0, 5);
    const rest = words.slice(5, 40);
    const cloudEl = document.getElementById('word-cloud');
    const callouts = top5.length ? `<div class="word-callouts">${top5.map(w =>
      `<div class="word-callout"><span class="word-callout-count">${w.count}×</span><span class="word-callout-word">${w.word}</span></div>`
    ).join('')}</div>` : '';
    cloudEl.innerHTML = callouts + rest.map(w => {
      const ratio = w.count / maxCount;
      const cls = ratio > 0.6 ? 'large' : ratio > 0.3 ? 'medium' : '';
      return `<span class="word-tag ${cls}">${w.word}<sup style="font-size:9px;opacity:0.5"> ${w.count}</sup></span>`;
    }).join('');

    const hashtags = vocab.topHashtags || [];
    document.getElementById('hashtag-list').innerHTML = hashtags.slice(0, 15).map(h =>
      `<span class="hashtag-tag">#${h.tag} <sup>${h.count}</sup></span>`
    ).join('');
  }

  // ── Numbers ──
  renderNumbers(stats) {
    if (!stats) return;
    const items = [
      [stats.totalBookmarks, 'Total Bookmarks'],
      [stats.uniqueAuthors, 'Unique Authors'],
      [stats.uniqueTopics, 'Topics Detected'],
      [stats.topicDiversity + '%', 'Topic Diversity'],
      [stats.avgBookmarkWords, 'Avg Words/Bookmark'],
      [stats.longestBookmark, 'Longest (words)'],
      [stats.vocabRichness + '%', 'Vocab Richness'],
      [stats.uniqueWordsEncountered?.toLocaleString(), 'Unique Words'],
      [stats.totalLinks, 'Links Saved'],
      [stats.threadBookmarks, 'Threads Saved'],
      [stats.questionBookmarks, 'Questions Saved'],
      [stats.mediaBookmarks, 'Media Items'],
      [stats.peakHour, 'Peak Hour'],
      [stats.peakDay, 'Peak Day'],
      [stats.avgLikesPerBookmark?.toLocaleString(), 'Avg Likes/Bookmark']
    ].filter(([v]) => v !== undefined && v !== null);

    document.getElementById('numbers-grid').innerHTML = items.map(([val, label]) =>
      `<div class="number-item"><span class="number-val">${val}</span><span class="number-label">${label}</span></div>`
    ).join('');
  }

  // ── OCEAN Big Five ──
  renderOCEAN(ocean) {
    const section = document.getElementById('ocean-section');
    if (!ocean?.traits?.length) { section?.classList.add('hidden'); return; }

    const topEl = document.getElementById('ocean-top-trait');
    if (topEl) {
      topEl.innerHTML = `<span class="cognitive-blend">${ocean.topTrait}</span>`;
    }

    const barsEl = document.getElementById('ocean-bars');
    if (barsEl) {
      barsEl.innerHTML = ocean.traits.map(t => `
        <div class="bar-row">
          <span class="bar-label" title="${t.desc}">${t.trait}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${t.score}%"></div>
          </div>
          <span class="bar-value">${t.score}</span>
        </div>
      `).join('');
    }

    const interpEl = document.getElementById('ocean-interpretation');
    if (interpEl) {
      interpEl.innerHTML = `<p class="cognitive-desc">${ocean.interpretation}</p>`;
    }
  }

  // ── Schwartz Values ──
  renderSchwartzValues(schwartz) {
    const section = document.getElementById('schwartz-section');
    if (!schwartz?.dimensions?.length) { section?.classList.add('hidden'); return; }

    const domEl = document.getElementById('schwartz-dominant');
    if (domEl) {
      domEl.innerHTML = `
        <div class="cognitive-blend">${schwartz.dominantLabel}</div>
        <p class="cognitive-desc">${schwartz.dominantDesc}</p>
      `;
    }

    const barsEl = document.getElementById('schwartz-bars');
    if (barsEl) {
      barsEl.innerHTML = schwartz.dimensions.map(d => `
        <div class="bar-row">
          <span class="bar-label" title="${d.desc}">${d.label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${d.score}%"></div></div>
          <span class="bar-value">${d.score}%</span>
        </div>
      `).join('');
    }
  }

  // ── Linguistic Profile ──
  renderLinguistic(ling) {
    const section = document.getElementById('linguistic-section');
    if (!ling) { section?.classList.add('hidden'); return; }

    const items = [
      { label: 'Analytical Thinking', value: ling.analyticalScore + '/100', desc: 'Logical, evidence-based reasoning style' },
      { label: 'Social Confidence', value: ling.cloutScore + '/100', desc: 'Collective vs individual framing' },
      { label: 'Authenticity', value: ling.authenticityScore + '/100', desc: 'Unguarded, honest expression' },
      { label: 'Cognitive Complexity', value: ling.cognitiveComplexity + '/100', desc: 'Depth of reasoning and nuance' },
      { label: 'Emotional Tone', value: ling.emotionalTone + '% positive', desc: 'Ratio of positive to total emotional content' },
      { label: 'Pronoun Focus', value: ling.pronounFocus, desc: 'Self-focused vs other-directed vs collective' },
      { label: 'Reading Level', value: ling.readingLevel, desc: 'Vocabulary complexity of saved content' }
    ];

    document.getElementById('linguistic-grid').innerHTML = items.map(i => `
      <div class="intellect-item">
        <div class="intellect-label">${i.label}</div>
        <div class="intellect-value">${i.value}</div>
        <div class="intellect-desc">${i.desc}</div>
      </div>
    `).join('');
  }

  bindEvents() {
    document.getElementById('btn-export')?.addEventListener('click', () => this.exportJSON());
    document.getElementById('btn-new')?.addEventListener('click', () => {
      window.open('https://x.com/i/bookmarks', '_blank');
    });
  }

  exportJSON() {
    if (!this.data) return;
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bookmark-mirror-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  formatHour(h) {
    if (h === 0) return '12 AM';
    if (h < 12) return h + ' AM';
    if (h === 12) return '12 PM';
    return (h - 12) + ' PM';
  }

  cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''; }
}

document.addEventListener('DOMContentLoaded', () => new ResultsRenderer());
