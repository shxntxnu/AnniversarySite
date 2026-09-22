/**
 * Central Observable Application State
 */

class AppState {
  constructor() {
    this.state = {
      isAuthenticated: false,
      user: null,
      personalConfig: null,
      memories: [],
      onThisDayMemories: [],
      activeMemory: null,
      filterMonth: null,
      isFirstLogin: false,
      nowPlaying: null
    };
    this.listeners = new Set();
  }

  get() {
    return this.state;
  }

  set(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    }
  }
}

export const state = new AppState();
