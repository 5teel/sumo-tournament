/**
 * SUMO TOURNAMENT V2 - API Client
 */

const API = {
    baseUrl: '/api',

    /**
     * Make authenticated request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add auth token if available
        if (GameState.token) {
            headers['Authorization'] = `Bearer ${GameState.token}`;
        }

        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

    // ============================================
    // AUTH ENDPOINTS
    // ============================================

    /**
     * Register new user
     */
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: userData
        });
    },

    /**
     * Login existing user
     */
    async login(email) {
        return this.request('/auth/login', {
            method: 'POST',
            body: { email }
        });
    },

    /**
     * Logout current user
     */
    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    },

    // ============================================
    // LOBBY ENDPOINTS
    // ============================================

    /**
     * Get lobby data
     */
    async getLobby() {
        return this.request('/lobby');
    },

    /**
     * Heartbeat - get current state
     */
    async heartbeat() {
        return this.request('/heartbeat', {
            method: 'POST'
        });
    },

    // ============================================
    // MATCH ENDPOINTS
    // ============================================

    /**
     * Start tournament (admin only)
     */
    async startTournament() {
        return this.request('/match/start', {
            method: 'POST'
        });
    },

    /**
     * Submit phase choice
     */
    async submitChoice(choice) {
        return this.request('/match/choice', {
            method: 'POST',
            body: { choice }
        });
    },

    /**
     * Request next match
     */
    async nextMatch() {
        return this.request('/match/next', {
            method: 'POST'
        });
    },

    // ============================================
    // ADMIN ENDPOINTS
    // ============================================

    /**
     * Reset tournament
     */
    async resetTournament() {
        return this.request('/admin/reset', {
            method: 'POST'
        });
    }
};
