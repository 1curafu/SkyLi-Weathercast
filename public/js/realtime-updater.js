class RealtimeUpdater {
    constructor() {
        this.isActive = false;
        this.updateInterval = null;
        this.lastUpdateTime = 0;
        this.updateCount = 0;
        this.intervals = {
            current: 5 * 60 * 1000,      // 5 minutes
            hourly: 30 * 60 * 1000,      // 30 minutes
            daily: 2 * 60 * 60 * 1000,   // 2 hours
            pollution: 15 * 60 * 1000    // 15 minutes
        };
        
        this.init();
    }

    init() {
        Utils.debugLog('Realtime updater initialized');
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.lastUpdateTime = Date.now();
        this.scheduleNextUpdate();
        
        Utils.debugLog('Real-time weather updates started');
    }

    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        if (this.updateInterval) {
            clearTimeout(this.updateInterval);
            this.updateInterval = null;
        }
        
        Utils.debugLog('Real-time weather updates stopped');
    }

    forceUpdate() {
        if (!this.isActive) return;
        
        this.performUpdate(true);
    }

    scheduleNextUpdate() {
        if (!this.isActive) return;
        
        this.updateInterval = setTimeout(() => {
            this.performUpdate();
        }, this.intervals.current);
    }

    async performUpdate(forced = false) {
        if (!this.isActive && !forced) return;
        
        if (!window.weatherApp?.currentLocation) {
            this.scheduleNextUpdate();
            return;
        }
        
        const location = window.weatherApp.currentLocation;
        
        try {
            const updateTasks = this.getUpdateTasks();
            
            if (updateTasks.length === 0 && !forced) {
                this.scheduleNextUpdate();
                return;
            }
            
            const tasksToRun = forced ? ['current', 'hourly', 'pollution', 'daily'] : updateTasks;
            
            const results = await this.executeUpdateTasks(tasksToRun, location);
            
            this.updateUI(results);
            
            this.updateCount++;
            this.lastUpdateTime = Date.now();
            
        } catch (error) {
            Utils.debugLog('Real-time update failed', error, 'error');
        } finally {
            if (this.isActive) {
                this.scheduleNextUpdate();
            }
        }
    }

    getUpdateTasks() {
        const now = Date.now();
        const tasks = [];
        
        if (now - this.lastUpdateTime >= this.intervals.current) {
            tasks.push('current');
        }
        
        if (now - this.getLastUpdateTime('hourly') >= this.intervals.hourly) {
            tasks.push('hourly');
        }
        
        if (now - this.getLastUpdateTime('daily') >= this.intervals.daily) {
            tasks.push('daily');
        }
        
        if (now - this.getLastUpdateTime('pollution') >= this.intervals.pollution) {
            tasks.push('pollution');
        }
        
        return tasks;
    }

    async executeUpdateTasks(tasks, location) {
        const results = {};
        
        const promises = tasks.map(async (task) => {
            try {
                let data;
                switch (task) {
                    case 'current':
                        data = await window.weatherAPI.getCurrentWeather(location.lat, location.lon);
                        results.current = data;
                        break;
                    case 'hourly':
                        data = await window.weatherAPI.getHourlyForecast(location.lat, location.lon);
                        results.hourly = data;
                        break;
                    case 'daily':
                        data = await window.weatherAPI.getDailyForecast(location.lat, location.lon);
                        results.daily = data;
                        break;
                    case 'pollution':
                        data = await window.weatherAPI.getAirPollution(location.lat, location.lon);
                        results.pollution = data;
                        break;
                }
            } catch (error) {
                Utils.debugLog(`Failed to update ${task}`, error, 'warn');
            }
        });
        
        await Promise.allSettled(promises);
        return results;
    }

    updateUI(results) {
        if (results.current && window.weatherApp) {
            window.weatherApp.updateCurrentWeather(results.current);
            this.setLastUpdateTime('current');
        }
        
        if (results.hourly && window.weatherApp) {
            window.weatherApp.updateHourlyForecast(results.hourly);
            this.setLastUpdateTime('hourly');
        }
        
        if (results.daily && window.weatherApp) {
            window.weatherApp.updateDailyForecast(results.daily);
            this.setLastUpdateTime('daily');
        }
        
        if (results.pollution && window.weatherApp) {
            window.weatherApp.updateAirQuality(results.pollution);
            this.setLastUpdateTime('pollution');
        }
    }

    getLastUpdateTime(type) {
        const key = `lastUpdate_${type}`;
        return Utils.loadFromStorage(key, 0);
    }

    setLastUpdateTime(type) {
        const key = `lastUpdate_${type}`;
        Utils.saveToStorage(key, Date.now());
    }

    getStatus() {
        return {
            isActive: this.isActive,
            updateCount: this.updateCount,
            lastUpdateTime: this.lastUpdateTime
        };
    }

    setUpdateInterval(minutes) {
        this.intervals.current = minutes * 60 * 1000;
        Utils.debugLog(`Update interval set to ${minutes} minutes`);
    }
}

window.realtimeUpdater = new RealtimeUpdater();

document.addEventListener('DOMContentLoaded', () => {
    if (window.weatherApp?.currentLocation) {
        window.realtimeUpdater.start();
    }
    
    const originalLoadWeather = window.weatherApp?.loadWeatherForLocation;
    if (originalLoadWeather) {
        window.weatherApp.loadWeatherForLocation = function(location) {
            const result = originalLoadWeather.call(this, location);
            
            if (result && result.then) {
                result.then(() => window.realtimeUpdater.start());
            } else {
                window.realtimeUpdater.start();
            }
            
            return result;
        };
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealtimeUpdater;
}