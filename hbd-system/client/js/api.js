/**
 * Typed API Client for backend communication
 */

async function request(endpoint, options = {}) {
  const defaultHeaders = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    },
    credentials: 'include' // Send httpOnly cookies
  };

  try {
    const res = await fetch(endpoint, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.error || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status === 401 && !endpoint.includes('/api/auth/login')) {
      // Trigger session expiration event
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  logout: () =>
    request('/api/auth/logout', {
      method: 'POST'
    }),

  getMe: () =>
    request('/api/auth/me'),

  // Memories
  getMemories: (sort = 'asc') =>
    request(`/api/memories?sort=${sort}`),

  getOnThisDay: (month, day) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (day) params.append('day', day);
    return request(`/api/memories/on-this-day?${params.toString()}`);
  },

  getMemoryById: (id) =>
    request(`/api/memories/${id}`),

  createMemory: (memoryData) =>
    request('/api/memories', {
      method: 'POST',
      body: JSON.stringify(memoryData)
    }),

  updateMemory: (id, memoryData) =>
    request(`/api/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memoryData)
    }),

  deleteMemory: (id) =>
    request(`/api/memories/${id}`, {
      method: 'DELETE'
    }),

  // Photos
  uploadPhotos: (files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('photos', file);
    }
    return request('/api/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Spotify
  searchSpotify: (q) =>
    request(`/api/spotify/search?q=${encodeURIComponent(q)}`),

  getSpotifyToken: () =>
    request('/api/spotify/token'),

  // Personal Configuration
  getConfig: () =>
    request('/api/config'),

  updateConfig: (updates) =>
    request('/api/config', {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
};
