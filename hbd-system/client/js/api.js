/**
 * 100% Static Client-Side API & Storage Engine
 * Runs completely in the browser for GitHub Pages without requiring a backend server.
 */

import { personalConfig, initialMemories, VALID_USERS } from './data/staticData.js';
import { resolvePhotoUrl } from './utils/paths.js';

const STORAGE_KEYS = {
  SESSION: 'hbd_user_session',
  MEMORIES: 'hbd_memories_data',
  CONFIG: 'hbd_personal_config'
};

// Helper: load stored memories or initialize from static seed
function getStoredMemories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading memories from localStorage, using seed data:', e);
  }

  // First time initialization: seed from static data
  localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(initialMemories));
  return [...initialMemories];
}

function saveStoredMemories(memories) {
  localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
}

// Helper: load stored personal config or initialize from static seed
function getStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return { ...personalConfig, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error reading config from localStorage, using seed:', e);
  }
  return { ...personalConfig };
}

function saveStoredConfig(config) {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

export const api = {
  // Authentication
  login: async (username, password) => {
    // Artificial small delay for polished UI feel
    await new Promise((r) => setTimeout(r, 200));

    const u = (username || '').trim().toLowerCase();
    const p = (password || '').trim();

    const matchedUser = VALID_USERS.find(
      (user) => user.username.toLowerCase() === u && user.password === p
    );

    if (!matchedUser) {
      const err = new Error('Incorrect username or password');
      err.status = 401;
      throw err;
    }

    const sessionUser = {
      username: matchedUser.username,
      role: matchedUser.role,
      name: matchedUser.name,
      spotifyConnected: false
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(sessionUser));
    return {
      success: true,
      user: sessionUser
    };
  },

  logout: async () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    return { success: true };
  },

  getMe: async () => {
    const rawSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!rawSession) {
      const err = new Error('No active session');
      err.status = 401;
      throw err;
    }

    try {
      const user = JSON.parse(rawSession);
      return {
        success: true,
        user,
        personal: getStoredConfig()
      };
    } catch (e) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      const err = new Error('Invalid session');
      err.status = 401;
      throw err;
    }
  },

  // Memories
  getMemories: async (sort = 'asc') => {
    const memories = getStoredMemories();
    const sorted = [...memories].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sort === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return {
      success: true,
      data: sorted
    };
  },

  getOnThisDay: async (month, day) => {
    const memories = getStoredMemories();
    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const targetDay = day ? parseInt(day, 10) : now.getDate();

    // Check for exact month & day match
    const matches = memories.filter((mem) => {
      if (!mem.date) return false;
      const d = new Date(mem.date);
      return d.getMonth() + 1 === targetMonth && d.getDate() === targetDay;
    });

    if (matches.length > 0) {
      return { success: true, data: matches };
    }

    // Romantic fallback: feature the most recent milestone memory
    const sortedDesc = [...memories].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const fallback = sortedDesc.slice(0, 1);
    return { success: true, data: fallback };
  },

  getMemoryById: async (id) => {
    const memories = getStoredMemories();
    const found = memories.find((m) => m.id === id);
    if (!found) {
      const err = new Error('Memory not found');
      err.status = 404;
      throw err;
    }
    return { success: true, data: found };
  },

  createMemory: async (memoryData) => {
    const memories = getStoredMemories();
    const newMemory = {
      id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...memoryData
    };
    memories.push(newMemory);
    saveStoredMemories(memories);
    return { success: true, data: newMemory };
  },

  updateMemory: async (id, memoryData) => {
    const memories = getStoredMemories();
    const index = memories.findIndex((m) => m.id === id);
    if (index === -1) {
      const err = new Error('Memory not found');
      err.status = 404;
      throw err;
    }
    memories[index] = {
      ...memories[index],
      ...memoryData,
      updatedAt: new Date().toISOString()
    };
    saveStoredMemories(memories);
    return { success: true, data: memories[index] };
  },

  deleteMemory: async (id) => {
    let memories = getStoredMemories();
    memories = memories.filter((m) => m.id !== id);
    saveStoredMemories(memories);
    return { success: true };
  },

  // Photos (client-side base64 uploader)
  uploadPhotos: async (files) => {
    const readAsDataURL = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const photoUrls = await Promise.all(Array.from(files).map(readAsDataURL));
    return {
      success: true,
      photos: photoUrls
    };
  },

  // Spotify (Static integration: embed player)
  searchSpotify: async (q) => {
    return {
      success: true,
      tracks: []
    };
  },

  getSpotifyToken: async () => {
    // In static mode, signals player to use the official Spotify Embed Player directly
    return { success: false, accessToken: null };
  },

  // Personal Configuration
  getConfig: async () => {
    return {
      success: true,
      data: getStoredConfig()
    };
  },

  updateConfig: async (updates) => {
    const current = getStoredConfig();
    const updated = { ...current, ...updates };
    saveStoredConfig(updated);
    return {
      success: true,
      data: updated
    };
  }
};
