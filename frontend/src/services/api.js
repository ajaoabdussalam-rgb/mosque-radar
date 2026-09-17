/**
 * Centralized API service for communicating with the Mosque Radar backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom error class capturing response status and validation maps
 */
export class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    ...options.headers
  };

  // Attach JWT Bearer token if present in localStorage
  const token = localStorage.getItem('token');
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('Failed to parse server response', res.status);
  }

  if (!res.ok || json.success === false) {
    throw new ApiError(
      json.message || `Request failed with status ${res.status}`,
      res.status,
      json.errors || null
    );
  }

  return json;
}

export const api = {
  // Fetch mosques (public discovery or status filtered, with optional text search)
  getMosques: (params = {}) => {
    const filteredParams = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filteredParams[key] = value;
      }
    });
    const query = new URLSearchParams(filteredParams).toString();
    return request(`/mosques${query ? `?${query}` : ''}`);
  },

  // Proximity discovery using user coordinates
  getNearbyMosques: ({ lat, lng, radius, limit, status }) => {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append('lat', lat);
    if (lng !== undefined) params.append('lng', lng);
    if (radius !== undefined) params.append('radius', radius);
    if (limit !== undefined) params.append('limit', limit);
    if (status !== undefined) params.append('status', status);

    return request(`/mosques/nearby?${params.toString()}`);
  },

  // Single mosque lookup
  getMosqueById: (id) => request(`/mosques/${id}`),

  // Community mosque submission
  createMosque: (payload) =>
    request('/mosques', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Image upload
  uploadImage: (fileOrFormData) => {
    let body;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('image', fileOrFormData);
    }

    return request('/upload', {
      method: 'POST',
      body
    });
  },

  // Moderation queue (supports status filtering: pending, verified, rejected)
  getModerationQueue: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/mosques/moderation/queue${query ? `?${query}` : ''}`);
  },

  // Moderate / verify decision
  verifyMosque: (id, decision) =>
    request(`/mosques/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(decision)
    }),

  // Moderate / edit mosque details prior to verification
  updateMosque: (id, updates) =>
    request(`/mosques/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  // Check potential duplicates by proximity and/or name
  checkDuplicates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/mosques/moderation/duplicates${query ? `?${query}` : ''}`);
  },

  // Authentication & User Profile
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getMe: () => request('/auth/me'),

  getMySubmissions: () => request('/auth/my-submissions')
};
