// popup.js - Heritage popup controller

class PopupController {
  constructor() {
    this.state = 'idle';
    this.startTime = null;
    this.timerInterval = null;
    this.pollInterval = null;
    this.lastAnalysisId = null;
    this.init();
  }

  init() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Analyze tab buttons
    document.getElementById('btn-start')?.addEventListener('click', () => this.startAnalysis());
    document.getElementById('btn-stop')?.addEventListener('click', () => this.stopAndGenerate());
    document.getElementById('btn-view')?.addEventListener('click', () => this.viewResults());
    document.getElementById('btn-view-last')?.addEventListener('click', () => this.viewResults());
    document.getElementById('btn-new')?.addEventListener('click', () => this.reset());
    document.getElementById('btn-retry')?.addEventListener('click', () => this.reset());

    // Footer links
    document.getElementById('link-history')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.viewHistory();
    });
    document.getElementById('link-about')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.viewAbout();
    });

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((msg) => this.handleMessage(msg));

    // Check current state
    this.checkState();
  }

  switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    
    if (tabName === 'history') {
      this.loadHistory();
    }
  }

  async checkState() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      console.log('[Popup] Status:', response);
      
      if (response?.isRunning) {
        this.showState('running');
        this.startTime = response.startTime || Date.now();
        
        if (response.progress) {
          this.updateProgress(response.progress);
        }
        
        this.startProgressTimer();
        this.startPolling();
        
      } else if (response?.lastAnalysis) {
        this.lastAnalysisId = response.lastAnalysis.id;
        this.showLastAnalysis(response.lastAnalysis);
        this.showState('idle');
      } else {
        this.showState('idle');
      }
    } catch (e) {
      console.log('[Popup] Status error:', e);
      this.showState('idle');
    }
  }

  showLastAnalysis(analysis) {
    const container = document.getElementById('last-analysis');
    const countEl = document.getElementById('last-count');
    const dateEl = document.getElementById('last-date');
    const viewBtn = document.getElementById('btn-view-last');
    
    if (container && analysis) {
      container.style.display = 'block';
      if (countEl) countEl.textContent = analysis.bookmarkCount || 0;
      if (dateEl) {
        const date = new Date(analysis.timestamp);
        dateEl.textContent = date.toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        });
      }
      if (viewBtn) viewBtn.style.display = 'block';
    }
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    
    this.pollInterval = setInterval(async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
        
        if (response?.isRunning && response.progress) {
          this.updateProgress(response.progress);
        } else if (!response?.isRunning && this.state === 'running') {
          clearInterval(this.pollInterval);
          
          if (response?.lastAnalysis) {
            this.lastAnalysisId = response.lastAnalysis.id;
            this.showComplete({ bookmarkCount: response.lastAnalysis.bookmarkCount });
          }
        }
      } catch (e) {
        console.log('[Popup] Poll error:', e);
      }
    }, 2000);
  }

  async startAnalysis() {
    try {
      this.showState('running');
      this.startTime = Date.now();
      this.startProgressTimer();
      this.startPolling();
      
      const response = await chrome.runtime.sendMessage({ type: 'START_ANALYSIS' });
      console.log('[Popup] Start response:', response);
      
      if (!response?.success) {
        this.showError(response?.error || 'Failed to start analysis');
      }
    } catch (error) {
      this.showError('Failed to begin chronicle: ' + error.message);
    }
  }

  async stopAndGenerate() {
    try {
      const btn = document.getElementById('btn-stop');
      if (btn) {
        btn.textContent = 'Stopping...';
        btn.disabled = true;
      }
      
      const response = await chrome.runtime.sendMessage({ type: 'STOP_AND_GENERATE' });
      console.log('[Popup] Stop response:', response);
      
      if (response?.success) {
        this.lastAnalysisId = response.analysisId;
      }
    } catch (error) {
      console.error('[Popup] Stop error:', error);
      const btn = document.getElementById('btn-stop');
      if (btn) {
        btn.textContent = 'Stop & Generate Results';
        btn.disabled = false;
      }
    }
  }

  handleMessage(msg) {
    console.log('[Popup] Message:', msg.type);
    
    switch (msg.type) {
      case 'ANALYSIS_PROGRESS':
        this.updateProgress(msg.data);
        break;
      case 'ANALYSIS_COMPLETE':
        this.lastAnalysisId = msg.data?.analysisId;
        this.showComplete(msg.data);
        break;
      case 'ANALYSIS_ERROR':
        this.showError(msg.error);
        break;
    }
  }

  updateProgress(data) {
    if (!data) return;
    
    const count = data.bookmarkCount || data.bookmarks || 0;
    const countEl = document.getElementById('bookmark-count');
    if (countEl) countEl.textContent = count;
    
    const progress = Math.min((count / 500) * 100, 95);
    const fillEl = document.getElementById('progress-fill');
    if (fillEl) fillEl.style.width = progress + '%';
    
    if (data.status) {
      const statusEl = document.getElementById('status-text');
      if (statusEl) statusEl.textContent = data.status;
    }
    
    if (data.topTopics?.length) {
      const topicsEl = document.getElementById('topics-list');
      const previewEl = document.getElementById('topics-preview');
      if (topicsEl && previewEl) {
        previewEl.style.display = 'block';
        topicsEl.innerHTML = data.topTopics.slice(0, 6)
          .map(([topic]) => `<span class="topic-tag">${topic}</span>`)
          .join('');
      }
    }
  }

  startProgressTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      if (this.startTime) {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const timeEl = document.getElementById('elapsed-time');
        if (timeEl) {
          timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')} elapsed`;
        }
      }
    }, 1000);
  }

  showComplete(data) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
    
    this.showState('complete');
    
    const countEl = document.getElementById('complete-count');
    if (countEl) countEl.textContent = data?.bookmarkCount || 0;
    
    const btn = document.getElementById('btn-stop');
    if (btn) {
      btn.textContent = 'Stop & Generate Results';
      btn.disabled = false;
    }
  }

  showError(message) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
    
    this.showState('error');
    
    const btn = document.getElementById('btn-stop');
    if (btn) {
      btn.textContent = 'Stop & Generate Results';
      btn.disabled = false;
    }
    
    let displayMessage = message;
    if (message?.includes('NOT_LOGGED_IN')) {
      displayMessage = 'Please log into Twitter first.';
    } else if (message?.includes('NO_BOOKMARKS')) {
      displayMessage = 'No bookmarks found in your collection.';
    } else if (message?.includes('TIMEOUT')) {
      displayMessage = 'Could not locate your bookmarks.';
    }
    
    const errorEl = document.getElementById('error-text');
    if (errorEl) errorEl.textContent = displayMessage;
  }

  showState(state) {
    ['idle', 'running', 'complete', 'error'].forEach(s => {
      const el = document.getElementById(`state-${s}`);
      if (el) {
        el.classList.toggle('active', s === state);
      }
    });
    this.state = state;
  }

  reset() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.startTime = null;
    
    const fillEl = document.getElementById('progress-fill');
    if (fillEl) fillEl.style.width = '0%';
    
    const countEl = document.getElementById('bookmark-count');
    if (countEl) countEl.textContent = '0';
    
    const timeEl = document.getElementById('elapsed-time');
    if (timeEl) timeEl.textContent = '';
    
    const statusEl = document.getElementById('status-text');
    if (statusEl) statusEl.textContent = 'Initializing...';
    
    const topicsEl = document.getElementById('topics-list');
    if (topicsEl) topicsEl.innerHTML = '';
    
    const previewEl = document.getElementById('topics-preview');
    if (previewEl) previewEl.style.display = 'none';
    
    const btn = document.getElementById('btn-stop');
    if (btn) {
      btn.textContent = 'Stop & Generate Results';
      btn.disabled = false;
    }
    
    this.showState('idle');
  }

  viewResults() {
    const url = this.lastAnalysisId 
      ? chrome.runtime.getURL(`results/results.html?id=${this.lastAnalysisId}`)
      : chrome.runtime.getURL('results/results.html');
    chrome.tabs.create({ url });
  }

  viewHistory() {
    chrome.tabs.create({ url: chrome.runtime.getURL('results/history.html') });
  }

  viewAbout() {
    chrome.tabs.create({ url: chrome.runtime.getURL('results/about.html') });
  }

  async loadHistory() {
    // Simple history display in the popup
    const listEl = document.getElementById('history-list');
    const emptyEl = document.getElementById('history-empty');
    if (!listEl) return;

    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY' });
      
      if (response?.analyses?.length) {
        emptyEl.style.display = 'none';
        listEl.innerHTML = response.analyses.slice(0, 5).map(a => `
          <div class="last-analysis" style="margin-bottom:12px;cursor:pointer" data-id="${a.id}">
            <div class="last-analysis-count">${a.bookmarkCount} scrolls</div>
            <div class="last-analysis-date">${new Date(a.timestamp).toLocaleDateString()}</div>
          </div>
        `).join('');
        
        listEl.querySelectorAll('[data-id]').forEach(el => {
          el.addEventListener('click', () => {
            chrome.tabs.create({ 
              url: chrome.runtime.getURL(`results/results.html?id=${el.dataset.id}`)
            });
          });
        });
      } else {
        emptyEl.style.display = 'block';
        listEl.innerHTML = '';
      }
    } catch (e) {
      console.log('[Popup] History error:', e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
