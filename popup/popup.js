// popup.js — Popup controller
'use strict';

class Popup {
  constructor() {
    this.timerInterval = null;
    this.pollInterval = null;
    this.startTime = null;

    document.getElementById('btn-start')?.addEventListener('click', () => this.start());
    document.getElementById('btn-stop')?.addEventListener('click', () => this.stop());
    document.getElementById('btn-results')?.addEventListener('click', () => this.openResults());
    document.getElementById('btn-new')?.addEventListener('click', () => this.reset());
    document.getElementById('btn-retry')?.addEventListener('click', () => this.reset());

    chrome.runtime.onMessage.addListener(msg => this.onMessage(msg));
    this.checkStatus();
  }

  async checkStatus() {
    try {
      const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      if (!status) return;

      if (status.status === 'scraping') {
        this.startTime = Date.now() - status.elapsed;
        this.showState('scraping');
        document.getElementById('bookmark-count').textContent = status.bookmarkCount || 0;
        this.startTimer();
        this.startPolling();
      } else if (status.status === 'analyzing') {
        this.showState('analyzing');
      } else if (status.status === 'complete') {
        this.showState('complete');
        document.getElementById('final-count').textContent = status.bookmarkCount || 0;
      } else if (status.status === 'error') {
        this.showState('error');
      }
    } catch (e) {
      console.log('Status check failed:', e);
    }
  }

  async start() {
    this.showState('scraping');
    this.startTime = Date.now();
    this.startTimer();
    this.startPolling();

    try {
      const result = await chrome.runtime.sendMessage({ type: 'START_ANALYSIS' });
      if (result?.error) {
        this.showState('error');
        document.getElementById('error-text').textContent = result.error;
      }
    } catch (e) {
      this.showState('error');
      document.getElementById('error-text').textContent = e.message;
    }
  }

  async stop() {
    try {
      await chrome.runtime.sendMessage({ type: 'STOP_AND_GENERATE' });
      this.showState('analyzing');
    } catch (e) {}
  }

  async openResults() {
    chrome.runtime.sendMessage({ type: 'OPEN_RESULTS' });
  }

  reset() {
    this.stopTimer();
    this.stopPolling();
    this.showState('idle');
  }

  onMessage(msg) {
    if (msg.type === 'PROGRESS_UPDATE') {
      document.getElementById('bookmark-count').textContent = msg.data?.bookmarkCount || 0;
    }
    if (msg.type === 'ANALYSIS_COMPLETE') {
      this.stopTimer();
      this.stopPolling();
      this.showState('complete');
      document.getElementById('final-count').textContent = msg.data?.bookmarkCount || 0;
    }
  }

  showState(state) {
    document.querySelectorAll('.state').forEach(el => el.classList.remove('active'));
    document.getElementById(`state-${state}`)?.classList.add('active');
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (!this.startTime) return;
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const min = Math.floor(elapsed / 60);
      const sec = String(elapsed % 60).padStart(2, '0');
      const el = document.getElementById('elapsed-time');
      if (el) el.textContent = `${min}:${sec}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  startPolling() {
    this.stopPolling();
    this.pollInterval = setInterval(() => this.checkStatus(), 2000);
  }

  stopPolling() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }
}

document.addEventListener('DOMContentLoaded', () => new Popup());
