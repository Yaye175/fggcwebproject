// Empty = same origin as the page that loaded this script. The backend serves
// the frontend, so requests go to the right host automatically in dev and prod
// (no hardcoded localhost that would break once deployed).
const API_URL = '';

// Escape untrusted strings before inserting into innerHTML (prevents stored XSS).
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const api = {
    // Helper for auth headers
    getHeaders: () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    },

    // Handle API errors
    handleResponse: async (response) => {
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Auto logout on unauthorized
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },

    // GET request
    get: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: api.getHeaders(),
            credentials: 'same-origin'
        });
        return api.handleResponse(response);
    },

    // POST request
    post: async (endpoint, payload) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: api.getHeaders(),
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        return api.handleResponse(response);
    },

    // PUT request
    put: async (endpoint, payload = {}) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: api.getHeaders(),
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        return api.handleResponse(response);
    }
};
