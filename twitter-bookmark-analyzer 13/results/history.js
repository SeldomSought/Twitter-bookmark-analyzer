// results/history.js - History page for viewing past analyses

// StorageManager (duplicated for standalone use)
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
          const store = db.createObjectStore('analyses', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          const store = db.createObjectStore('bookmarks', { keyPath: 'id' });
          store.createIndex('analysisId', 'analysisId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  async getDb() {
    if (!this.db) await this.init();
    return this.db;
  }

  async getAllAnalyses() {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['analyses'], 'readonly');
      const store = transaction.objectStore('analyses');
      const request = store.openCursor(null, 'prev');
      
      const results = [];
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

  async deleteAnalysis(id) {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['analyses', 'bookmarks'], 'readwrite');
      
      // Delete analysis
      transaction.objectStore('analyses').delete(id);
      
      // Delete associated bookmarks
      const bookmarksStore = transaction.objectStore('bookmarks');
      const index = bookmarksStore.index('analysisId');
      const request = index.openCursor(IDBKeyRange.only(id));
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearAll() {
    const db = await this.getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['analyses', 'bookmarks', 'settings'], 'readwrite');
      transaction.objectStore('analyses').clear();
      transaction.objectStore('bookmarks').clear();
      transaction.objectStore('settings').clear();
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// History Page Controller
class HistoryController {
  constructor() {
    this.storage = new StorageManager();
    this.analyses = [];
    this.init();
  }

  async init() {
    try {
      this.analyses = await this.storage.getAllAnalyses();
      this.render();
      this.bindEvents();
    } catch (error) {
      console.error('Error loading history:', error);
      document.getElementById('loading').innerHTML = `
        <div class="error-icon">⚠️</div>
        <p>Failed to load history: ${error.message}</p>
      `;
    }
  }

  render() {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');
    const historyList = document.getElementById('history-list');
    const btnClear = document.getElementById('btn-clear');

    loading.classList.add('hidden');

    if (this.analyses.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }

    historyList.classList.remove('hidden');
    btnClear.classList.remove('hidden');

    historyList.innerHTML = this.analyses.map(analysis => this.renderCard(analysis)).join('');
  }

  renderCard(analysis) {
    const date = new Date(analysis.timestamp);
    const archetype = analysis.results?.profile?.archetype || 'Unknown';
    const bookmarkCount = analysis.bookmarkCount || 0;
    const topicCount = analysis.results?.topics?.length || 0;
    const duration = analysis.duration ? Math.round(analysis.duration / 1000) : 0;

    const archetypeIcons = {
      'The Builder': '🔧',
      'The Philosopher': '🤔',
      'The Analyst': '📊',
      'The Creator': '🎨',
      'The Strategist': '♟️',
      'The Connector': '🤝',
      'The Seeker': '🔮'
    };

    return `
      <div class="history-card" data-id="${analysis.id}">
        <div class="history-icon">${archetypeIcons[archetype] || '🧠'}</div>
        <div class="history-info">
          <div class="history-date">${this.formatDate(date)}</div>
          <div class="history-meta">
            <span>📚 ${bookmarkCount} bookmarks</span>
            <span>🏷️ ${topicCount} topics</span>
            <span>⏱️ ${this.formatDuration(duration)}</span>
          </div>
        </div>
        <div class="history-archetype">${archetype}</div>
        <div class="history-actions">
          <button class="btn-icon view-btn" data-id="${analysis.id}" title="View">👁️</button>
          <button class="btn-icon delete btn-delete" data-id="${analysis.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long' }) + ' at ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    }
  }

  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  bindEvents() {
    // Back link
    document.getElementById('back-link').addEventListener('click', (e) => {
      e.preventDefault();
      window.close();
    });

    // Start new analysis
    document.getElementById('btn-start')?.addEventListener('click', () => {
      window.open('https://twitter.com/i/bookmarks', '_blank');
    });

    // Clear all
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all analysis history? This cannot be undone.')) {
        this.clearAll();
      }
    });

    // View and delete buttons (event delegation)
    document.getElementById('history-list').addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.view-btn');
      const deleteBtn = e.target.closest('.btn-delete');
      const card = e.target.closest('.history-card');

      if (viewBtn) {
        e.stopPropagation();
        this.viewAnalysis(viewBtn.dataset.id);
      } else if (deleteBtn) {
        e.stopPropagation();
        this.deleteAnalysis(deleteBtn.dataset.id);
      } else if (card) {
        this.viewAnalysis(card.dataset.id);
      }
    });
  }

  viewAnalysis(id) {
    const url = chrome.runtime.getURL(`results/results.html?id=${id}`);
    window.location.href = url;
  }

  async deleteAnalysis(id) {
    if (!confirm('Delete this analysis?')) return;

    try {
      await this.storage.deleteAnalysis(parseInt(id));
      this.analyses = this.analyses.filter(a => a.id !== parseInt(id));
      this.render();
      this.bindEvents(); // Rebind after re-render
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete analysis: ' + error.message);
    }
  }

  async clearAll() {
    try {
      await this.storage.clearAll();
      this.analyses = [];
      this.render();
    } catch (error) {
      console.error('Failed to clear:', error);
      alert('Failed to clear history: ' + error.message);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new HistoryController();
});
