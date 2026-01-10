// results.js - Heritage B&W renderer with custom emblems

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
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('analyses')) {
          db.createObjectStore('analyses', { keyPath: 'id', autoIncrement: true })
            .createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'id' });
        }
      };
    });
  }

  async getLastAnalysis() {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['analyses'], 'readonly');
      const store = tx.objectStore('analyses');
      const request = store.index('timestamp').openCursor(null, 'prev');
      request.onsuccess = () => {
        const cursor = request.result;
        resolve(cursor ? { ...cursor.value, id: cursor.primaryKey } : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAnalysis(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['analyses'], 'readonly');
      const request = tx.objectStore('analyses').get(id);
      request.onsuccess = () => resolve(request.result ? { ...request.result, id } : null);
      request.onerror = () => reject(request.error);
    });
  }
}

// SVG Emblems for each archetype
const ARCHETYPE_EMBLEMS = {
  'The Seeker': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="40" cy="40" r="32"/>
    <circle cx="40" cy="40" r="20"/>
    <circle cx="40" cy="40" r="8"/>
    <path d="M40 8v12M40 60v12M8 40h12M60 40h12"/>
    <path d="M18 18l8 8M54 54l8 8M18 62l8-8M54 26l8-8"/>
  </svg>`,
  'The Builder': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M20 70V35l20-25 20 25v35H20z"/>
    <path d="M32 70V50h16v20"/>
    <path d="M20 35h40"/>
    <path d="M35 35V20M45 35V20"/>
  </svg>`,
  'The Analyst': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="12" y="12" width="56" height="56"/>
    <path d="M12 28h56M28 12v56"/>
    <circle cx="54" cy="54" r="12"/>
    <path d="M54 46v8M54 58v4"/>
  </svg>`,
  'The Philosopher': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="40" cy="30" r="20"/>
    <path d="M28 46c-4 6-8 14-8 22h40c0-8-4-16-8-22"/>
    <path d="M35 30c0-3 2-5 5-5s5 2 5 5"/>
    <circle cx="40" cy="36" r="2"/>
  </svg>`,
  'The Strategist': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="16" y="16" width="48" height="48"/>
    <path d="M16 32h48M16 48h48M32 16v48M48 16v48"/>
    <circle cx="40" cy="40" r="8"/>
    <path d="M32 24l8 8M48 24l-8 8M32 56l8-8M48 56l-8-8"/>
  </svg>`,
  'The Creator': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M40 10l8 16 18 3-13 13 3 18-16-8-16 8 3-18-13-13 18-3z"/>
    <circle cx="40" cy="42" r="8"/>
  </svg>`,
  'The Scholar': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M16 20h48v50H16z"/>
    <path d="M24 12h32v8H24z"/>
    <path d="M24 30h32M24 40h28M24 50h20M24 60h24"/>
  </svg>`,
  'The Connector': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="40" cy="24" r="12"/>
    <circle cx="20" cy="56" r="10"/>
    <circle cx="60" cy="56" r="10"/>
    <path d="M40 36v8M32 44l-8 8M48 44l8 8"/>
  </svg>`,
  'The Rebel': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M40 12l6 20h20l-16 12 6 20-16-12-16 12 6-20-16-12h20z"/>
    <path d="M40 32v16"/>
  </svg>`,
  'The Sage': `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="40" cy="36" r="24"/>
    <path d="M28 60c0 8 5 12 12 12s12-4 12-12"/>
    <circle cx="32" cy="32" r="4"/>
    <circle cx="48" cy="32" r="4"/>
    <path d="M32 44c4 4 12 4 16 0"/>
  </svg>`
};

class ResultsRenderer {
  constructor() {
    this.storage = new StorageManager();
    this.data = null;
    this.init();
  }

  async init() {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      this.data = id ? await this.storage.getAnalysis(parseInt(id)) : await this.storage.getLastAnalysis();

      if (!this.data) {
        this.showError('No chronicle found. Run an analysis first.');
        return;
      }

      console.log('Loaded analysis:', this.data);
      this.render();
      this.bindEvents();
    } catch (e) {
      console.error('Load error:', e);
      this.showError('Failed to load: ' + e.message);
    }
  }

  showError(msg) {
    document.getElementById('loading').innerHTML = `
      <div style="margin-bottom:20px">
        <svg width="48" height="48" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="16" cy="16" r="12"/><path d="M16 10v8M16 22v2"/>
        </svg>
      </div>
      <p>${msg}</p>
      <button onclick="window.open('https://x.com/i/bookmarks','_blank')" class="btn-action" style="margin-top:20px">
        Visit Bookmarks
      </button>`;
  }

  render() {
    const { results, bookmarkCount, timestamp } = this.data;
    
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    document.getElementById('bookmark-count').textContent = bookmarkCount || 0;

    this.renderArchetype(results.psychProfile, results.coreNarrative);
    this.renderCoreMotivation(results.psychProfile);
    this.renderCognitiveStyle(results.cognitiveStyle);
    this.renderEmotionalLandscape(results.emotionalLandscape);
    this.renderIntellectualCharacter(results.intellectualCharacter);
    this.renderSocialOrientation(results.socialOrientation);
    this.renderHiddenPatterns(results.hiddenPatterns);
    this.renderBlindSpots(results.blindSpots);
    this.renderAuthors(results.authors);
    this.renderTemporal(results.temporal);
    this.renderInformationDiet(results.informationDiet);
    this.renderVocabulary(results.vocabulary);
    this.renderSummary(results.summary, timestamp);
  }

  renderArchetype(psych, narrative) {
    if (!psych?.archetype) return;
    
    const arch = psych.archetype;
    const emblemEl = document.getElementById('archetype-emblem');
    emblemEl.innerHTML = ARCHETYPE_EMBLEMS[arch.primary] || ARCHETYPE_EMBLEMS['The Seeker'];
    
    document.getElementById('archetype-name').textContent = arch.primary;
    document.getElementById('archetype-description').textContent = arch.description || '';
    
    if (arch.secondary) {
      document.getElementById('secondary-archetype').textContent = `with elements of ${arch.secondary}`;
    }

    if (narrative?.summary) {
      document.getElementById('core-narrative').textContent = narrative.summary;
    }
  }

  renderCoreMotivation(psych) {
    if (!psych) return;

    const drivesEl = document.getElementById('drives-list');
    if (psych.drives?.length) {
      drivesEl.innerHTML = psych.drives.map(d => `<li>${d}</li>`).join('');
    }

    const motivationsEl = document.getElementById('motivations-list');
    if (psych.coreMotivation?.length) {
      motivationsEl.innerHTML = psych.coreMotivation.map(m => `
        <div class="motivation-card">
          <div class="motivation-drive">${m.drive}</div>
          <div class="motivation-insight">${m.insight}</div>
        </div>
      `).join('');
    }

    if (psych.dimensions) {
      const dims = psych.dimensions;
      document.getElementById('dimensions-grid').innerHTML = `
        <div class="dimension">
          <span class="dim-label">Openness</span>
          <div class="dim-bar"><div class="dim-fill" style="width:${dims.openness * 10}%"></div></div>
        </div>
        <div class="dimension">
          <span class="dim-label">Conscientiousness</span>
          <div class="dim-bar"><div class="dim-fill" style="width:${dims.conscientiousness * 10}%"></div></div>
        </div>
        <div class="dimension">
          <span class="dim-label">Extraversion</span>
          <div class="dim-bar"><div class="dim-fill" style="width:${dims.extraversion * 10}%"></div></div>
        </div>
        <div class="dimension">
          <span class="dim-label">Agreeableness</span>
          <div class="dim-bar"><div class="dim-fill" style="width:${dims.agreeableness * 10}%"></div></div>
        </div>
      `;
    }
  }

  renderCognitiveStyle(cog) {
    if (!cog) return;

    document.getElementById('cognitive-primary').textContent = cog.primaryMode || '—';
    document.getElementById('cognitive-secondary').textContent = cog.secondaryMode || '—';
    
    if (cog.processingStyle?.description) {
      document.getElementById('cognitive-insight').textContent = cog.processingStyle.description;
    }

    if (cog.scores) {
      const maxScore = Math.max(...Object.values(cog.scores), 1);
      document.getElementById('cognitive-bars').innerHTML = Object.entries(cog.scores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score]) => `
          <div class="style-bar">
            <span class="bar-label">${name}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(score / maxScore) * 100}%"></div></div>
            <span class="bar-value">${score}%</span>
          </div>
        `).join('');
    }
  }

  renderEmotionalLandscape(emo) {
    if (!emo) return;

    document.getElementById('emotional-valence').textContent = emo.valence || 'balanced';
    document.getElementById('emotional-insight').textContent = emo.insight || '';

    if (emo.themes?.length) {
      document.getElementById('emotional-themes').innerHTML = emo.themes
        .map(t => `<span class="theme-tag">${t}</span>`).join('');
    }
  }

  renderIntellectualCharacter(int) {
    if (!int) return;

    document.getElementById('intellectual-identity').textContent = int.identity || '—';
    document.getElementById('intellectual-rigor').textContent = int.rigor || '—';
    document.getElementById('intellectual-style').textContent = int.learningStyle || '—';
    document.getElementById('intellectual-insight').textContent = int.insight || '';

    if (int.scores) {
      document.getElementById('intellectual-bars').innerHTML = Object.entries(int.scores)
        .map(([name, score]) => `
          <div class="int-score">
            <span class="score-label">${name}</span>
            <span class="score-value">${score}%</span>
          </div>
        `).join('');
    }
  }

  renderSocialOrientation(soc) {
    if (!soc) return;

    document.getElementById('social-stance').textContent = soc.socialStance || '—';
    document.getElementById('authority-orientation').textContent = soc.authorityOrientation || '—';
    document.getElementById('content-discovery').textContent = soc.contentDiscovery || '—';
    document.getElementById('social-insight').textContent = soc.insight || '';
  }

  renderHiddenPatterns(patterns) {
    const container = document.getElementById('hidden-patterns');
    if (!patterns?.length) {
      container.innerHTML = '<p class="empty">No hidden patterns detected yet</p>';
      return;
    }

    container.innerHTML = patterns.map(p => `
      <div class="pattern-card">
        <div class="pattern-name">${p.pattern}</div>
        <div class="pattern-insight">${p.insight}</div>
      </div>
    `).join('');
  }

  renderBlindSpots(spots) {
    const container = document.getElementById('blind-spots');
    if (!spots?.length) {
      container.innerHTML = '<p class="empty">No significant blind spots identified</p>';
      return;
    }

    container.innerHTML = spots.map(s => `
      <div class="spot-card">
        <div class="spot-area">${s.area}</div>
        <div class="spot-insight">${s.insight}</div>
      </div>
    `).join('');
  }

  renderAuthors(authors) {
    const container = document.getElementById('authors-list');
    if (!authors?.length) {
      container.innerHTML = '<p class="empty">No authors analyzed</p>';
      return;
    }

    container.innerHTML = authors.slice(0, 15).map(a => `
      <div class="author-card">
        <div class="author-avatar">${(a.displayName || a.handle)[0]?.toUpperCase() || '?'}</div>
        <div class="author-info">
          <div class="author-handle">@${a.handle} ${a.verified ? '<span class="verified">✓</span>' : ''}</div>
          <div class="author-meta">${a.count} saves · ${a.influence}</div>
        </div>
      </div>
    `).join('');
  }

  renderTemporal(temp) {
    if (!temp) return;

    document.getElementById('temporal-pattern').textContent = temp.pattern || '—';
    document.getElementById('temporal-insight').textContent = temp.insight || '';

    const hourly = temp.hourlyDistribution || [];
    const maxH = Math.max(...hourly, 1);
    document.getElementById('hourly-chart').innerHTML = hourly.map((count, h) => {
      const height = (count / maxH) * 100;
      return `<div class="hour-bar" style="height:${Math.max(height, 4)}%" title="${count} at ${h}:00"></div>`;
    }).join('');
  }

  renderInformationDiet(diet) {
    if (!diet) return;

    document.getElementById('diet-format').textContent = diet.formatPreference || '—';
    document.getElementById('diet-visual').textContent = diet.visualOrientation || '—';
    document.getElementById('diet-diversity').textContent = diet.sourceDiversity || '—';
    document.getElementById('diet-insight').textContent = diet.insight || '';

    if (diet.topDomains?.length) {
      document.getElementById('top-domains').innerHTML = diet.topDomains.slice(0, 10)
        .map(([domain, count]) => `
          <div class="domain-item">
            <span class="domain-name">${domain}</span>
            <span class="domain-count">${count}</span>
          </div>
        `).join('');
    }
  }

  renderVocabulary(vocab) {
    if (!vocab) return;

    if (vocab.topWords?.length) {
      document.getElementById('word-cloud').innerHTML = vocab.topWords.slice(0, 30)
        .map(([word, count]) => `<span class="word-tag">${word}</span>`).join('');
    }

    if (vocab.hashtags?.length) {
      document.getElementById('hashtags-list').innerHTML = vocab.hashtags.slice(0, 12)
        .map(([tag, count]) => `<span class="hashtag-tag">#${tag} <small>(${count})</small></span>`).join('');
    }
  }

  renderSummary(summary, timestamp) {
    document.getElementById('total-bookmarks').textContent = summary?.totalBookmarks || 0;
    document.getElementById('unique-authors').textContent = summary?.uniqueAuthors || 0;
    
    const span = summary?.timeSpan;
    document.getElementById('time-span').textContent = span ? `${span.months || 0} months` : '—';

    const date = new Date(timestamp);
    document.getElementById('analysis-date').textContent = 
      `Chronicle inscribed ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  }

  bindEvents() {
    document.getElementById('btn-new').addEventListener('click', () => {
      window.open('https://x.com/i/bookmarks', '_blank');
    });
    document.getElementById('btn-export').addEventListener('click', () => this.export());
  }

  export() {
    if (!this.data) return;
    const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `consciousness-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }
}

document.addEventListener('DOMContentLoaded', () => new ResultsRenderer());
