class OpenWeatherAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async getCurrentWeather(lat, lon) {
        const cacheKey = `current_${lat}_${lon}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.fetchWithRetry(`/api/weather/current/${lat}/${lon}`);
            const data = await response.json();
            
            this.setCache(cacheKey, data);
            
            return data;
        } catch (error) {
            Utils.debugLog('Current weather fetch failed', error, 'error');
            throw error;
        }
    }

    async getHourlyForecast(lat, lon) {
        const cacheKey = `hourly_${lat}_${lon}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.fetchWithRetry(`/api/forecast/hourly/${lat}/${lon}`);
            const data = await response.json();
            
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            Utils.debugLog('Hourly forecast fetch failed', error, 'error');
            throw error;
        }
    }

    async getDailyForecast(lat, lon) {
        const cacheKey = `daily_${lat}_${lon}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.fetchWithRetry(`/api/forecast/daily/${lat}/${lon}`);
            const data = await response.json();
            
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            Utils.debugLog('Daily forecast fetch failed', error, 'error');
            throw error;
        }
    }

    async getAirPollution(lat, lon) {
        const cacheKey = `pollution_${lat}_${lon}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const response = await this.fetchWithRetry(`/api/pollution/${lat}/${lon}`);
            const data = await response.json();
            
            this.setCache(cacheKey, data, 30 * 60 * 1000); // Cache for 30 minutes
            return data;
        } catch (error) {
            Utils.debugLog('Air pollution data unavailable', error, 'warn');
            return null;
        }
    }

    async fetchWithRetry(url, options = {}, retryCount = 0) {
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            if (retryCount < this.maxRetries) {
                Utils.debugLog(`Retrying request (${retryCount + 1}/${this.maxRetries})`, { url, error: error.message }, 'warn');
                
                await this.delay(this.retryDelay * Math.pow(2, retryCount));
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
            expiry: expiry
        });
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        Utils.debugLog(`Cache hit for ${key}`);
        return cached.data;
    }

    clearCache() {
        this.cache.clear();
        Utils.debugLog('Weather cache cleared');
    }

    async preloadWeatherData(lat, lon) {
        const promises = [
            this.getCurrentWeather(lat, lon),
            this.getHourlyForecast(lat, lon),
            this.getDailyForecast(lat, lon),
            this.getAirPollution(lat, lon)
        ];

        try {
            const results = await Promise.allSettled(promises);
            
            const successful = results.filter(result => result.status === 'fulfilled').length;
            Utils.debugLog(`Preloaded ${successful}/4 weather data types`);
            
            return {
                current: results[0].status === 'fulfilled' ? results[0].value : null,
                hourly: results[1].status === 'fulfilled' ? results[1].value : null,
                daily: results[2].status === 'fulfilled' ? results[2].value : null,
                pollution: results[3].status === 'fulfilled' ? results[3].value : null
            };
        } catch (error) {
            Utils.debugLog('Weather data preload failed', error, 'error');
            throw error;
        }
    }

    async refreshCurrentLocationWeather() {
        const lastLocation = Utils.loadFromStorage('lastLocation');
        
        if (!lastLocation || !Utils.isValidCoordinates(lastLocation.lat, lastLocation.lon)) {
            return;
        }

        try {
            const lat = lastLocation.lat;
            const lon = lastLocation.lon;
            
            [`current_${lat}_${lon}`, `hourly_${lat}_${lon}`, `daily_${lat}_${lon}`, `pollution_${lat}_${lon}`]
                .forEach(key => this.cache.delete(key));

            await this.preloadWeatherData(lat, lon);
            
            Utils.debugLog('Background weather refresh completed');
        } catch (error) {
            Utils.debugLog('Background weather refresh failed', error, 'warn');
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                expiredEntries++;
            } else {
                validEntries++;
            }
        }
        
        return {
            total: this.cache.size,
            valid: validEntries,
            expired: expiredEntries
        };
    }
}

window.weatherAPI = new OpenWeatherAPI();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenWeatherAPI;
}