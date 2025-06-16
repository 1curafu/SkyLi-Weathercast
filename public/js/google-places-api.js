class GooglePlacesAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 15 * 60 * 1000;
        this.maxRetries = 2;
        this.retryDelay = 800;
        
        this.popularLocations = [
            'Zurich', 'London', 'New York', 'Paris', 'Tokyo',
            'Berlin', 'Madrid', 'Rome', 'Vienna', 'Amsterdam'
        ];
        
        this.searchHistory = [];
        this.maxSearchHistory = 20;
        this.lastSearchTime = 0;
        this.searchThrottle = 200;
        
        this.init();
    }

    async init() {
        setTimeout(() => {
            this.preloadPopularLocations();
        }, 2000);
        
        Utils.debugLog('Google Places API client initialized');
    }

    async getAutocompleteSuggestions(query) {
        if (!query || query.length < 2) {
            return { predictions: [] };
        }

        const cacheKey = `autocomplete_${query.toLowerCase()}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            Utils.debugLog(`Autocomplete cache hit for: ${query}`);
            return this.enhanceSuggestions(cached, query);
        }

        const now = Date.now();
        if (now - this.lastSearchTime < this.searchThrottle) {
            await this.delay(this.searchThrottle);
        }

        try {
            const response = await this.fetchWithRetry(`/api/places/autocomplete/${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.predictions) {
                this.setCache(cacheKey, data);
                
                this.addToSearchHistory(query);
                
                this.lastSearchTime = Date.now();
                return this.enhanceSuggestions(data, query);
            }
            
            return { predictions: [] };
            
        } catch (error) {
            Utils.debugLog('Autocomplete fetch failed', error, 'error');
            
            const expiredCache = this.getFromCache(cacheKey, true);
            if (expiredCache) {
                Utils.debugLog('Returning expired cache due to error');
                return this.enhanceSuggestions(expiredCache, query);
            }
            
            return { predictions: [] };
        }
    }

    async getPlaceDetails(placeId) {
        if (!placeId) {
            throw new Error('Place ID is required');
        }

        const cacheKey = `details_${placeId}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            Utils.debugLog(`Place details cache hit for: ${placeId}`);
            return cached;
        }

        try {
            const response = await this.fetchWithRetry(`/api/places/details/${placeId}`);
            const data = await response.json();
            
            if (Utils.isValidCoordinates(data.lat, data.lon)) {
                this.setCache(cacheKey, data, 30 * 60 * 1000); 
                return data;
            } else {
                throw new Error('Invalid coordinates in place details');
            }
            
        } catch (error) {
            Utils.debugLog('Place details fetch failed', error, 'error');
            throw error;
        }
    }


    enhanceSuggestions(data, query) {
        if (!data.predictions || !Array.isArray(data.predictions)) {
            return { predictions: [] };
        }

        const enhanced = data.predictions.map(prediction => ({
            ...prediction,
            relevanceScore: this.calculateRelevanceScore(prediction, query),
            isFromHistory: this.isInSearchHistory(prediction.description),
            distance: this.calculateApproxDistance(prediction)
        }));

        enhanced.sort((a, b) => {
            if (a.isFromHistory && !b.isFromHistory) return -1;
            if (!a.isFromHistory && b.isFromHistory) return 1;
            
            return b.relevanceScore - a.relevanceScore;
        });

        return { predictions: enhanced };
    }

    calculateRelevanceScore(prediction, query) {
        const queryLower = query.toLowerCase();
        const mainText = (prediction.mainText || prediction.description || '').toLowerCase();
        const secondaryText = (prediction.secondaryText || '').toLowerCase();
        
        let score = 0;
        
        if (mainText === queryLower) score += 100;
        if (mainText.startsWith(queryLower)) score += 50;
        if (mainText.includes(queryLower)) score += 25;
        if (secondaryText.includes(queryLower)) score += 10;
        
        const types = prediction.types || [];
        if (types.includes('locality')) score += 20;
        if (types.includes('administrative_area_level_1')) score += 15;
        if (types.includes('country')) score += 10;
        
        if (this.popularLocations.some(loc => 
            mainText.includes(loc.toLowerCase()))) {
            score += 15;
        }
        
        return score;
    }

    calculateApproxDistance(prediction) {
        return null;
    }

    addToSearchHistory(query) {
        const normalizedQuery = query.trim().toLowerCase();
        
        this.searchHistory = this.searchHistory.filter(item => item !== normalizedQuery);
        
        this.searchHistory.unshift(normalizedQuery);
        
        if (this.searchHistory.length > this.maxSearchHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxSearchHistory);
        }
        
        Utils.saveToStorage('placesSearchHistory', this.searchHistory);
    }

    isInSearchHistory(description) {
        if (!description) return false;
        
        const normalizedDesc = description.toLowerCase();
        return this.searchHistory.some(query => 
            normalizedDesc.includes(query) || query.includes(normalizedDesc)
        );
    }

    loadSearchHistory() {
        const saved = Utils.loadFromStorage('placesSearchHistory', []);
        if (Array.isArray(saved)) {
            this.searchHistory = saved.slice(0, this.maxSearchHistory);
        }
    }

    clearSearchHistory() {
        this.searchHistory = [];
        Utils.removeFromStorage('placesSearchHistory');
        Utils.debugLog('Search history cleared');
    }

    async preloadPopularLocations() {
        Utils.debugLog('Preloading popular locations...');
        
        const preloadPromises = this.popularLocations.slice(0, 5).map(async (location) => {
            try {
                await this.getAutocompleteSuggestions(location);
                Utils.debugLog(`Preloaded: ${location}`);
            } catch (error) {
                Utils.debugLog(`Failed to preload ${location}`, error, 'warn');
            }
        });

        await Promise.allSettled(preloadPromises);
        Utils.debugLog('Popular locations preload completed');
    }

    getPopularSuggestions() {
        const suggestions = [];
        
        this.popularLocations.forEach(location => {
            const cacheKey = `autocomplete_${location.toLowerCase()}`;
            const cached = this.getFromCache(cacheKey);
            
            if (cached && cached.predictions && cached.predictions.length > 0) {
                suggestions.push({
                    mainText: location,
                    description: location,
                    placeId: cached.predictions[0].placeId,
                    isPopular: true
                });
            }
        });
        
        return suggestions;
    }

    async geocodeWithFallback(query) {
        try {
            const suggestions = await this.getAutocompleteSuggestions(query);
            
            if (suggestions.predictions && suggestions.predictions.length > 0) {
                const bestMatch = suggestions.predictions[0];
                
                try {
                    return await this.getPlaceDetails(bestMatch.placeId);
                } catch (detailsError) {
                    Utils.debugLog('Place details failed, trying direct geocoding', detailsError, 'warn');
                }
            }
            
            const response = await fetch(`/api/geocode/${encodeURIComponent(query)}`);
            if (response.ok) {
                return await response.json();
            }
            
            throw new Error('All geocoding methods failed');
            
        } catch (error) {
            Utils.debugLog('Geocoding with fallback failed', error, 'error');
            return null;
        }
    }

    async fetchWithRetry(url, options = {}, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            if (retryCount < this.maxRetries && error.name !== 'AbortError') {
                Utils.debugLog(`Retrying Places API request (${retryCount + 1}/${this.maxRetries})`, { url, error: error.message }, 'warn');
                
                await this.delay(this.retryDelay * Math.pow(1.5, retryCount));
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            
            throw error;
        }
    }

    setCache(key, data, customTimeout = null) {
        const timeout = customTimeout || this.cacheTimeout;
        const expiry = Date.now() + timeout;
        
        this.cache.set(key, {
            data: data,
            expiry: expiry,
            timestamp: Date.now()
        });
        
        if (this.cache.size > 100) {
            this.cleanupExpiredCache();
        }
    }

    getFromCache(key, includeExpired = false) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        const isExpired = Date.now() > cached.expiry;
        
        if (isExpired && !includeExpired) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            Utils.debugLog(`Cleaned up ${cleanedCount} expired cache entries`);
        }
    }

    clearCache() {
        this.cache.clear();
        Utils.debugLog('Places cache cleared');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        let autocompleteEntries = 0;
        let detailsEntries = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                expiredEntries++;
            } else {
                validEntries++;
            }
            
            if (key.startsWith('autocomplete_')) {
                autocompleteEntries++;
            } else if (key.startsWith('details_')) {
                detailsEntries++;
            }
        }
        
        return {
            total: this.cache.size,
            valid: validEntries,
            expired: expiredEntries,
            autocomplete: autocompleteEntries,
            details: detailsEntries,
            searchHistory: this.searchHistory.length
        };
    }

    optimizeCache() {
        this.cleanupExpiredCache();
        
        if (this.cache.size > 150) {
            const entries = Array.from(this.cache.entries());
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            
            this.cache.clear();
            entries.slice(0, 100).forEach(([key, value]) => {
                this.cache.set(key, value);
            });
            
            Utils.debugLog('Cache optimized - kept 100 most recent entries');
        }
    }

    debugCacheContents() {
        const contents = {};
        for (const [key, value] of this.cache.entries()) {
            contents[key] = {
                dataType: Array.isArray(value.data?.predictions) ? 'autocomplete' : 'details',
                expiry: new Date(value.expiry).toISOString(),
                isExpired: Date.now() > value.expiry
            };
        }
        
        Utils.debugLog('Places cache contents', contents);
        return contents;
    }
}

window.placesAPI = new GooglePlacesAPI();

window.placesAPI.loadSearchHistory();

setInterval(() => {
    window.placesAPI.optimizeCache();
}, 10 * 60 * 1000);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GooglePlacesAPI;
}