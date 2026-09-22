const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

const STORE_FILE = path.join(__dirname, '..', 'data', 'store.json');
const SEED_FILE = path.join(__dirname, '..', 'data', 'seedMemories.json');
const CONFIG_FILE = path.join(__dirname, '..', 'data', 'personalConfig.json');

// In-memory cache synced with disk
let store = {
  user: null,
  memories: [],
  config: null
};

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Persist in-memory store to JSON file atomically
function persist() {
  ensureDataDir();
  const tempPath = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempPath, STORE_FILE);
}

// Load data and seed if first run
async function initStore() {
  ensureDataDir();

  // Load personal config from personalConfig.json
  let personalCfg = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      personalCfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.warn('Could not read personalConfig.json, using defaults', e.message);
    }
  }

  if (fs.existsSync(STORE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      store.users = data.users || [];
      store.user = data.user || (store.users[0] || null);
      store.memories = data.memories || [];
      store.config = data.config || personalCfg;
    } catch (err) {
      console.error('Error loading store.json, reinitializing...', err);
    }
  }

  // Ensure store.users is populated
  if (!store.users) {
    store.users = [];
  }
  if (store.user && !store.users.some(u => u.id === store.user.id)) {
    store.user.role = 'admin';
    store.users.push(store.user);
  }

  // Ensure Admin User exists
  let adminUser = store.users.find(u => u.role === 'admin' || u.id === 'user-01' || u.id === 'user-admin');
  const salt = await bcrypt.genSalt(10);

  if (!adminUser) {
    const adminPassHash = await bcrypt.hash(config.admin.password, salt);
    adminUser = {
      id: 'user-admin',
      username: config.admin.username,
      role: 'admin',
      passwordHash: adminPassHash,
      spotifyRefreshTokenEncrypted: null,
      spotifyConnected: false,
      createdAt: new Date().toISOString()
    };
    store.users.push(adminUser);
  } else {
    adminUser.role = 'admin';
  }
  store.user = adminUser;

  // Ensure Viewer User exists (Read-only)
  let viewerUser = store.users.find(u => u.role === 'viewer' || u.id === 'user-viewer');
  if (!viewerUser) {
    const viewerPassHash = await bcrypt.hash(config.viewer.password, salt);
    viewerUser = {
      id: 'user-viewer',
      username: config.viewer.username,
      role: 'viewer',
      passwordHash: viewerPassHash,
      spotifyRefreshTokenEncrypted: null,
      spotifyConnected: false,
      createdAt: new Date().toISOString()
    };
    store.users.push(viewerUser);
  } else {
    viewerUser.role = 'viewer';
  }

  // If no memories exist yet, seed initial memories
  if (!store.memories || store.memories.length === 0) {
    if (fs.existsSync(SEED_FILE)) {
      try {
        const seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
        store.memories = seedData.map((m, idx) => ({
          ...m,
          id: m.id || `mem-${Date.now()}-${idx}`,
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString()
        }));
      } catch (e) {
        console.warn('Could not load seedMemories.json:', e.message);
      }
    }
  }

  if (!store.config) {
    store.config = personalCfg;
  }

  // Ensure environment overrides from .env take effect if configured
  if (config.personal.partnerName && config.personal.partnerName !== 'My Love') {
    store.config.partnerName = config.personal.partnerName;
  }
  if (config.personal.yourName && config.personal.yourName !== 'Me') {
    store.config.yourName = config.personal.yourName;
  }
  if (config.personal.relationshipStartDate) {
    store.config.relationshipStartDate = config.personal.relationshipStartDate;
  }
  if (config.personal.birthdayMonth && config.personal.birthdayDay) {
    store.config.birthday = {
      ...(store.config.birthday || {}),
      month: config.personal.birthdayMonth,
      day: config.personal.birthdayDay,
      letter: config.personal.birthdayNote || store.config.birthday?.letter
    };
  }

  persist();
  console.log(`Data store ready: ${store.memories.length} memories loaded. Users: admin '${adminUser.username}', viewer '${viewerUser.username}' active.`);
}

// ========================
// User Methods
// ========================
async function getUser() {
  return store.user;
}

async function getUserById(id) {
  if (store.users) {
    const found = store.users.find(u => u.id === id);
    if (found) return found;
  }
  if (store.user && store.user.id === id) return store.user;
  return null;
}

async function getUserByUsername(username) {
  const clean = (username || '').toLowerCase().trim();
  if (!clean) return null;

  if (store.users) {
    for (const u of store.users) {
      if (u.username.toLowerCase() === clean) return u;
      // Admin aliases
      if (u.role === 'admin' && (clean === 'admin' || clean === 'shantanu' || clean === 'love')) return u;
      // Viewer aliases
      if (u.role === 'viewer' && (clean === 'viewer' || clean === 'rubina')) return u;
    }
  }

  if (store.user && store.user.username.toLowerCase() === clean) {
    return store.user;
  }
  return null;
}

async function updateUser(updates) {
  store.user = {
    ...store.user,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  if (store.users) {
    const idx = store.users.findIndex(u => u.id === store.user.id);
    if (idx !== -1) {
      store.users[idx] = { ...store.users[idx], ...updates };
    }
  }
  persist();
  return store.user;
}

// ========================
// Memory Methods
// ========================
async function getMemories(sort = 'asc') {
  const sorted = [...store.memories].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return sort === 'desc' ? db - da : da - db;
  });
  return sorted;
}

async function getMemoryById(id) {
  return store.memories.find(m => m.id === id) || null;
}

async function createMemory(data) {
  const newMemory = {
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date: data.date,
    title: (data.title || 'Untitled Moment').trim(),
    story: (data.story || '').trim(),
    location: (data.location || '').trim(),
    photos: Array.isArray(data.photos) ? data.photos : [],
    song: data.song || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.memories.push(newMemory);
  persist();
  return newMemory;
}

async function updateMemory(id, updates) {
  const index = store.memories.findIndex(m => m.id === id);
  if (index === -1) return null;

  const current = store.memories[index];
  const updated = {
    ...current,
    date: updates.date !== undefined ? updates.date : current.date,
    title: updates.title !== undefined ? updates.title.trim() : current.title,
    story: updates.story !== undefined ? updates.story.trim() : current.story,
    location: updates.location !== undefined ? updates.location.trim() : current.location,
    photos: Array.isArray(updates.photos) ? updates.photos : current.photos,
    song: updates.song !== undefined ? updates.song : current.song,
    updatedAt: new Date().toISOString()
  };

  store.memories[index] = updated;
  persist();
  return updated;
}

async function deleteMemory(id) {
  const initialLen = store.memories.length;
  store.memories = store.memories.filter(m => m.id !== id);
  if (store.memories.length < initialLen) {
    persist();
    return true;
  }
  return false;
}

async function getMemoriesOnDate(month, day) {
  // month is 1-12, day is 1-31
  return store.memories.filter(m => {
    if (!m.date) return false;
    const d = new Date(m.date);
    // getUTCMonth is 0-11
    const mMonth = d.getUTCMonth() + 1;
    const mDay = d.getUTCDate();
    return mMonth === month && mDay === day;
  });
}

// ========================
// Personal Config Methods
// ========================
async function getPersonalConfig() {
  return store.config;
}

async function updatePersonalConfig(updates) {
  store.config = {
    ...store.config,
    ...updates
  };
  persist();
  return store.config;
}

module.exports = {
  initStore,
  getUser,
  getUserById,
  getUserByUsername,
  updateUser,
  getMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
  getMemoriesOnDate,
  getPersonalConfig,
  updatePersonalConfig
};
