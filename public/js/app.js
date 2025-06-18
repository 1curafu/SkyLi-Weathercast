class WeatherApp {
    constructor() {
        this.currentLocation = null;
        this.currentWeather = null;
        this.lastHourlyData = null;
        this.isLoading = false;
        this.temperatureUnit = 'C';
        this.autocompleteResults = [];
        this.selectedSuggestionIndex = -1;
        
        this.init();
    }

    async init() {
    this.setupEventListeners();
    this.loadUserPreferences();
    await this.loadDefaultLocation();
    
    // Start realtime updater after initialization
    setTimeout(() => {
        if (window.realtimeUpdater && !window.realtimeUpdater.isActive) {
            Utils.debugLog('Auto-starting realtime updater...');
            window.realtimeUpdater.start();
        }
    }, 2000);
    
    Utils.debugLog('Weather app initialized successfully');
}

    // Event Listeners and State Management

    setupEventListeners() {
        const locationInput = document.getElementById('locationInput');
        
        if (locationInput) {
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLocationSearch();
                }
            });

            locationInput.addEventListener('keydown', (e) => {
                this.handleKeyboardNavigation(e);
            });

            locationInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearchInput(e.target.value);
            }, 300));

            locationInput.addEventListener('blur', () => {
                setTimeout(() => this.hideSuggestions(), 150);
            });

            locationInput.addEventListener('focus', (e) => {
                if (e.target.value.length >= 2) {
                    this.handleSearchInput(e.target.value);
                }
            });
        }

        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.location) {
                this.loadWeatherForLocation(e.state.location);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.currentLocation) {
                this.refreshWeatherData();
            }
        });

        document.addEventListener('click', (e) => {
            const searchContainer = document.querySelector('.left-section');
            if (searchContainer && !searchContainer.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    // Search and Autocomplete Handling

    async handleSearchInput(value) {
        if (!value || typeof value !== 'string') {
            this.hideSuggestions();
            return;
        }

        const trimmedValue = value.trim();
        
        if (trimmedValue.length < 2) {
            this.hideSuggestions();
            return;
        }

        const sanitizedValue = Utils.sanitizeCityName(trimmedValue);
        
        if (!sanitizedValue) {
            this.hideSuggestions();
            return;
        }

        if (sanitizedValue.length > 100) {
            this.hideSuggestions();
            return;
        }

        if (!Utils.isValidCityName(sanitizedValue)) {
            this.hideSuggestions();
            return;
        }

        const coordMatch = sanitizedValue.match(/^(-?\d{1,3}\.?\d*),?\s*(-?\d{1,3}\.?\d*)$/);
        
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lon = parseFloat(coordMatch[2]);
            
            if (Utils.isValidCoordinates(lat, lon)) {
                this.showCoordinatePreview(lat, lon);
                return;
            } else {
                this.hideSuggestions();
                return;
            }
        }

        await this.fetchAutocompleteSuggestions(sanitizedValue);
    }

    async fetchAutocompleteSuggestions(query) {
        try {
            this.showLoadingSuggestions();
            
            const response = await fetch(`/api/places/autocomplete/${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`Autocomplete API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.predictions && Array.isArray(data.predictions)) {
                this.autocompleteResults = data.predictions;
                this.displaySuggestions(data.predictions);
            } else {
                this.autocompleteResults = [];
                this.showNoSuggestions();
            }
            
        } catch (error) {
            Utils.debugLog('Autocomplete error', error, 'error');
            this.autocompleteResults = [];
            this.hideSuggestions();
        }
    }

    // Autocomplete Suggestions Display

    displaySuggestions(suggestions) {
        const container = this.getSuggestionsContainer();
        if (!container) return;

        container.innerHTML = '';
        this.selectedSuggestionIndex = -1;

        if (suggestions.length === 0) {
            this.showNoSuggestions();
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const item = this.createSuggestionItem(suggestion, index);
            container.appendChild(item);
        });

        this.showSuggestions();
    }

    createSuggestionItem(suggestion, index) {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.dataset.index = index;
        
        const mainDiv = document.createElement('div');
        mainDiv.className = 'suggestion-main';
        mainDiv.innerHTML = this.highlightMatch(suggestion.mainText);
        
        const secondaryDiv = document.createElement('div');
        secondaryDiv.className = 'suggestion-secondary';
        secondaryDiv.textContent = suggestion.secondaryText;
        
        div.appendChild(mainDiv);
        div.appendChild(secondaryDiv);

        div.addEventListener('click', () => {
            this.selectSuggestion(suggestion);
        });

        div.addEventListener('mouseenter', () => {
            this.highlightSuggestion(index);
        });

        return div;
    }

    highlightMatch(text) {
        const query = document.getElementById('locationInput').value.trim();
        if (!query) return text;

        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    async selectSuggestion(suggestion) {
        try {
            const locationInput = document.getElementById('locationInput');
            if (locationInput) {
                locationInput.value = suggestion.description;
            }

            this.hideSuggestions();
            this.showLoading('Getting location details...');

            const locationDetails = await this.fetchPlaceDetails(suggestion.placeId);
            
            if (locationDetails) {
                await this.loadWeatherForLocation(locationDetails);
                this.saveUserPreferences();
                
                history.pushState(
                    { location: locationDetails }, 
                    `Weather for ${locationDetails.name}`, 
                    `?city=${encodeURIComponent(locationDetails.name)}`
                );
            }

        } catch (error) {
            Utils.debugLog('Suggestion selection error', error, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async fetchPlaceDetails(placeId) {
        try {
            const response = await fetch(`/api/places/details/${placeId}`);
            
            if (!response.ok) {
                throw new Error(`Place details API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (Utils.isValidCoordinates(data.lat, data.lon)) {
                return data;
            } else {
                throw new Error('Invalid coordinates in place details');
            }
            
        } catch (error) {
            Utils.debugLog('Place details error', error, 'error');
            return null;
        }
    }

    // Keyboard Navigation

    handleKeyboardNavigation(e) {
        const suggestionsContainer = this.getSuggestionsContainer();
        if (!suggestionsContainer || suggestionsContainer.style.display === 'none') {
            return;
        }

        const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
        if (suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.min(this.selectedSuggestionIndex + 1, suggestions.length - 1);
                this.highlightSuggestion(this.selectedSuggestionIndex);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
                this.highlightSuggestion(this.selectedSuggestionIndex);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.selectedSuggestionIndex >= 0 && this.autocompleteResults[this.selectedSuggestionIndex]) {
                    this.selectSuggestion(this.autocompleteResults[this.selectedSuggestionIndex]);
                } else {
                    this.handleLocationSearch();
                }
                break;

            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    highlightSuggestion(index) {
        const suggestions = document.querySelectorAll('.suggestion-item');
        
        suggestions.forEach(item => item.classList.remove('highlighted'));
        
        if (index >= 0 && suggestions[index]) {
            suggestions[index].classList.add('highlighted');
            this.selectedSuggestionIndex = index;
        } else {
            this.selectedSuggestionIndex = -1;
        }
    }

    // Suggestions Management

    getSuggestionsContainer() {
        let container = document.getElementById('autocomplete-suggestions');
        
        if (!container) {
            container = this.createSuggestionsContainer();
        }
        
        return container;
    }

    createSuggestionsContainer() {
        const container = document.createElement('div');
        container.id = 'autocomplete-suggestions';
        container.className = 'autocomplete-suggestions';
        
        const leftSection = document.querySelector('.left-section');
        
        if (leftSection) {
            leftSection.style.position = 'relative';
            leftSection.appendChild(container);
        }
        
        return container;
    }

    showSuggestions() {
        const container = this.getSuggestionsContainer();
        if (container) {
            container.style.display = 'block';
        }
    }

    hideSuggestions() {
        const container = this.getSuggestionsContainer();
        if (container) {
            container.style.display = 'none';
        }
        this.selectedSuggestionIndex = -1;
    }

    showLoadingSuggestions() {
        const container = this.getSuggestionsContainer();
        if (container) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'suggestion-loading';
            loadingDiv.textContent = 'Searching locations...';
            
            container.innerHTML = '';
            container.appendChild(loadingDiv);
            container.style.display = 'block';
        }
    }

    showNoSuggestions() {
        const container = this.getSuggestionsContainer();
        if (container) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'suggestion-empty';
            emptyDiv.textContent = 'No locations found';
            
            container.innerHTML = '';
            container.appendChild(emptyDiv);
            container.style.display = 'block';
        }
    }

    showCoordinatePreview(lat, lon) {
        const container = this.getSuggestionsContainer();
        if (container) {
            const div = document.createElement('div');
            div.className = 'suggestion-item coordinate-preview';
            
            const mainDiv = document.createElement('div');
            mainDiv.className = 'suggestion-main';
            mainDiv.textContent = `📍 Coordinates: ${lat}, ${lon}`;
            
            const secondaryDiv = document.createElement('div');
            secondaryDiv.className = 'suggestion-secondary';
            secondaryDiv.textContent = 'Click to search this location';
            
            div.appendChild(mainDiv);
            div.appendChild(secondaryDiv);
            
            div.addEventListener('click', () => {
                this.handleLocationSearch();
            });
            
            container.innerHTML = '';
            container.appendChild(div);
            container.style.display = 'block';
        }
    }

    // Search and Location Handling

    async handleLocationSearch() {
        const locationInput = document.getElementById('locationInput');
        const query = locationInput.value.trim();
        
        if (!query) return;

        const sanitizedQuery = Utils.sanitizeCityName(query);
        
        if (!sanitizedQuery || !Utils.isValidCityName(sanitizedQuery)) return;

        this.hideSuggestions();
        this.showLoading('Searching location...');
        
        try {
            const location = await this.geocodeLocation(sanitizedQuery);
            
            if (location) {
                await this.loadWeatherForLocation(location);
                this.saveUserPreferences();
                
                history.pushState(
                    { location: location }, 
                    `Weather for ${location.name}`, 
                    `?city=${encodeURIComponent(location.name)}`
                );
            }
            
        } catch (error) {
            Utils.debugLog('Location search error', error, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async geocodeLocation(query) {
        try {
            if (!query || typeof query !== 'string') {
                throw new Error('Invalid query parameter');
            }

            const sanitizedQuery = Utils.sanitizeCityName(query.trim());
            
            if (!Utils.isValidCityName(sanitizedQuery)) {
                throw new Error('Invalid city name format');
            }

            const coordMatch = sanitizedQuery.match(/^(-?\d{1,3}\.?\d*),?\s*(-?\d{1,3}\.?\d*)$/);
            
            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lon = parseFloat(coordMatch[2]);
                
                if (Utils.isValidCoordinates(lat, lon)) {
                    return await this.reverseGeocode(lat, lon);
                } else {
                    throw new Error('Invalid coordinates range');
                }
            }
            
            const response = await fetch(`/api/geocode/${encodeURIComponent(sanitizedQuery)}`);
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data || !Utils.isValidCoordinates(data.lat, data.lon)) {
                throw new Error('Invalid response data');
            }
            
            return data;
            
        } catch (error) {
            Utils.debugLog('Geocoding error', error, 'error');
            return null;
        }
    }

    // Weather Data Loading

    async loadWeatherForLocation(location) {
        if (!location || !Utils.isValidCoordinates(location.lat, location.lon)) {
            return;
        }

        this.currentLocation = location;
        this.showLoading('Loading weather data...');

        try {
            const [currentWeather, hourlyForecast, dailyForecast, airPollution] = await Promise.all([
                this.fetchCurrentWeather(location.lat, location.lon),
                this.fetchHourlyForecast(location.lat, location.lon),
                this.fetchDailyForecast(location.lat, location.lon),
                this.fetchAirPollution(location.lat, location.lon)
            ]);

            this.lastHourlyData = hourlyForecast;

            this.updateLocationDisplay(location);
            this.updateCurrentWeather(currentWeather);
            this.updateHourlyForecast(hourlyForecast);
            this.updateDailyForecast(dailyForecast);
            this.updateAirQuality(airPollution);

            this.currentWeather = currentWeather;

            if (window.backgroundController) {
                window.backgroundController.setLocation(location);
                window.backgroundController.setWeather(currentWeather);
            }

            if (window.realtimeUpdater) {
                if (!window.realtimeUpdater.isActive) {
                    Utils.debugLog('Starting realtime updater...');
                    window.realtimeUpdater.start();
                } else {
                    Utils.debugLog('Realtime updater already active');
                }
            } 
            else {
                Utils.debugLog('Realtime updater not found!', 'error');
            }
            
            Utils.debugLog(`Weather loaded for ${location.name}`, {
                location,
                current: currentWeather,
                hourly: hourlyForecast?.length,
                daily: dailyForecast?.length
            });

        } catch (error) {
            Utils.debugLog('Weather loading error', error, 'error');
        } finally {
            this.hideLoading();
        }        
    }

    async fetchCurrentWeather(lat, lon) {
        return await window.weatherAPI.getCurrentWeather(lat, lon);
    }

    async fetchHourlyForecast(lat, lon) {
        return await window.weatherAPI.getHourlyForecast(lat, lon);
    }

    async fetchDailyForecast(lat, lon) {
        return await window.weatherAPI.getDailyForecast(lat, lon);
    }

    async fetchAirPollution(lat, lon) {
        return await window.weatherAPI.getAirPollution(lat, lon);
    }

    // Update UI

    updateLocationDisplay(location) {
        const locationElement = document.getElementById('locationName');
        if (locationElement) {
            const parts = [location.name, location.state, location.country].filter(part => part && part !== 'undefined');
            const displayName = parts.join(', ');
            locationElement.textContent = displayName;
        }
    }

    updateCurrentWeather(weather) {
        if (!weather) return;

        if (window.backgroundController) {
        window.backgroundController.setWeather(weather);
        Utils.debugLog('🌈 Background updated for weather condition:', weather.condition);
    }

        const tempElement = document.getElementById('currentTemp');
        if (tempElement) {
            tempElement.textContent = Utils.formatTemperature(weather.temp);
        }

        // Update weather icon
        const iconElement = document.getElementById('mainWeatherIcon');
        if (iconElement && weather.iconCode) {
            iconElement.innerHTML = '';
            
            const iconImg = document.createElement('img');
            iconImg.src = `https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`;
            iconImg.alt = weather.description;
            iconImg.onerror = () => {
                iconElement.innerHTML = Utils.getWeatherEmoji(weather.condition);
            };
            
            iconElement.appendChild(iconImg);
        }

        const conditionElement = document.getElementById('currentCondition');
        if (conditionElement) {
            conditionElement.textContent = weather.condition;
        }

        const descriptionElement = document.getElementById('currentDescription');
        if (descriptionElement) {
            descriptionElement.textContent = Utils.enhanceWeatherDescription(weather.description);
        }

        this.updateWeatherDetail('feelsLike', Utils.formatTemperature(weather.feelsLike));
        this.updateWeatherDetail('humidity', Utils.formatPercentage(weather.humidity));
        
        if (this.lastHourlyData && this.lastHourlyData.length > 0) {
            const precip24h = this.lastHourlyData[0].precipitation || 0;
            this.updateWeatherDetail('precipitation', `${precip24h} mm`);
        }
        
        this.updateWeatherDetail('visibility', Utils.formatDistance(weather.visibility * 1000));
        this.updateWeatherDetail('uvIndex', weather.uvIndex);
        this.updateWeatherDetail('windInfo', `${weather.windSpeed} km/h ${Utils.getWindDirection(weather.windDirection)}`);
    }

    updateWeatherDetail(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateHourlyForecast(hourlyData) {
        if (!hourlyData || !Array.isArray(hourlyData)) return;

        const container = document.getElementById('hourlyContainer');
        const hourlyContainerInner = container?.querySelector('.hourly-container');
        
        if (!hourlyContainerInner) return;

        hourlyContainerInner.innerHTML = '';

        hourlyData.slice(0, 24).forEach((hour, index) => {
            if (!hour || typeof hour.temp !== 'number') return;
            
            const hourElement = this.createHourlyItem(hour, index);
            hourlyContainerInner.appendChild(hourElement);
        });
    }

    createHourlyItem(hour, index) {
        const div = document.createElement('div');
        div.className = 'hourly-item';

        const timeDiv = document.createElement('div');
        timeDiv.className = 'time';
        timeDiv.textContent = Utils.formatTime(hour.time);

        const iconDiv = document.createElement('div');
        iconDiv.className = 'weather-icon hourly-icon';
        
        const iconImg = document.createElement('img');
        iconImg.src = `https://openweathermap.org/img/wn/${hour.iconCode}.png`;
        iconImg.alt = hour.description;
        iconImg.onerror = () => {
            iconDiv.innerHTML = Utils.getWeatherEmoji(hour.condition);
        };
        iconDiv.appendChild(iconImg);

        const tempDiv = document.createElement('div');
        tempDiv.className = 'temp';
        tempDiv.textContent = Utils.formatTemperature(hour.temp);

        const precipDiv = document.createElement('div');
        precipDiv.className = 'precipitation';
        precipDiv.textContent = Utils.formatPercentage(hour.precipitation);

        div.appendChild(timeDiv);
        div.appendChild(iconDiv);
        div.appendChild(tempDiv);
        div.appendChild(precipDiv);

        return div;
    }

    updateDailyForecast(dailyData) {
        if (!dailyData || !Array.isArray(dailyData)) return;

        const container = document.getElementById('dailyContainer');
        
        if (!container) return;

        container.innerHTML = '';

        dailyData.slice(0, 10).forEach((day, index) => {
            if (!day || typeof day.tempMax !== 'number' || typeof day.tempMin !== 'number') return;
            
            const dayElement = this.createDailyItem(day, index, dailyData.slice(0, 10));
            container.appendChild(dayElement);
        });
    }

    createDailyItem(day, index, allDays) {
        const dayElement = document.createElement('div');
        dayElement.className = 'daily-item';

        const leftSection = document.createElement('div');
        leftSection.className = 'daily-left';

        const dayName = document.createElement('div');
        dayName.className = 'daily-day';
        const date = new Date(day.date);
        
        if (index === 0) {
            dayName.textContent = 'Today';
        } else {
            dayName.textContent = date.toLocaleDateString('en-US', { weekday: 'short' });
        }

        const iconElement = document.createElement('div');
        iconElement.className = 'daily-weather-icon';
        
        const iconImg = document.createElement('img');
        iconImg.src = `https://openweathermap.org/img/wn/${day.iconCode}.png`;
        iconImg.alt = day.description;
        iconImg.onerror = () => {
            iconElement.innerHTML = Utils.getWeatherEmoji(day.condition);
        };
        iconElement.appendChild(iconImg);

        leftSection.appendChild(dayName);
        leftSection.appendChild(iconElement);

        const rightSection = document.createElement('div');
        rightSection.className = 'daily-right';

        const precipitation = document.createElement('div');
        precipitation.className = 'daily-precipitation';
        const precipPercent = day.precipitation ? Math.round(day.precipitation) : 0;
        precipitation.textContent = precipPercent > 0 ? precipPercent + '%' : '';

        const tempRange = document.createElement('div');
        tempRange.className = 'daily-temp-range';

        const tempLow = document.createElement('div');
        tempLow.className = 'daily-temp-low';
        tempLow.textContent = Math.round(day.tempMin) + '°';

        const tempBarContainer = document.createElement('div');
        tempBarContainer.className = 'daily-temp-bar-container';

        const allTemps = allDays.flatMap(d => [d.tempMin, d.tempMax]);
        const globalMin = Math.min(...allTemps);
        const globalMax = Math.max(...allTemps);
        const tempRangeSpan = globalMax - globalMin;

        const minPosition = tempRangeSpan > 0 ? ((day.tempMin - globalMin) / tempRangeSpan) * 100 : 0;
        const maxPosition = tempRangeSpan > 0 ? ((day.tempMax - globalMin) / tempRangeSpan) * 100 : 100;
        const barWidth = maxPosition - minPosition;

        const tempBar = document.createElement('div');
        tempBar.className = 'daily-temp-bar';
        tempBar.style.left = minPosition + '%';
        tempBar.style.width = barWidth + '%';

        const lowDot = document.createElement('div');
        lowDot.className = 'temp-dot temp-dot-low';
        lowDot.style.left = minPosition + '%';

        const highDot = document.createElement('div');
        highDot.className = 'temp-dot temp-dot-high';
        highDot.style.left = maxPosition + '%';

        tempBarContainer.appendChild(tempBar);
        tempBarContainer.appendChild(lowDot);
        tempBarContainer.appendChild(highDot);

        const tempHigh = document.createElement('div');
        tempHigh.className = 'daily-temp-high';
        tempHigh.textContent = Math.round(day.tempMax) + '°';

        tempRange.appendChild(tempLow);
        tempRange.appendChild(tempBarContainer);
        tempRange.appendChild(tempHigh);

        rightSection.appendChild(precipitation);
        rightSection.appendChild(tempRange);

        dayElement.appendChild(leftSection);
        dayElement.appendChild(rightSection);

        return dayElement;
    }

    updateAirQuality(airData) {
        const container = document.getElementById('airQuality');
        if (!container) return;

        if (!airData) {
            container.textContent = '--';
            return;
        }

        const aqiInfo = Utils.getAQIInfo(airData.aqi);
        container.textContent = `${airData.aqi} - ${aqiInfo.text}`;
        container.style.color = aqiInfo.color;
    }

    async refreshAllWeatherData() {
    if (!this.currentLocation) {
        Utils.debugLog('No current location for refresh', 'warning');
        return false;
    }

    Utils.debugLog('Refreshing all weather data...');

    try {
        const [currentWeather, hourlyForecast, dailyForecast, airPollution] = await Promise.all([
            this.fetchCurrentWeather(this.currentLocation.lat, this.currentLocation.lon),
            this.fetchHourlyForecast(this.currentLocation.lat, this.currentLocation.lon),
            this.fetchDailyForecast(this.currentLocation.lat, this.currentLocation.lon),
            this.fetchAirPollution(this.currentLocation.lat, this.currentLocation.lon)
        ]);

        this.lastHourlyData = hourlyForecast;

        this.updateCurrentWeather(currentWeather);
        this.updateHourlyForecast(hourlyForecast);
        this.updateDailyForecast(dailyForecast);
        this.updateAirQuality(airPollution);

        this.currentWeather = currentWeather;

        if (window.backgroundController) {
            window.backgroundController.setWeather(currentWeather);
        }

        Utils.debugLog('All weather data refreshed successfully');
        return true;

        } 
        catch (error) {
        Utils.debugLog('Weather refresh error', error, 'error');
        return false;
        }
    }

    // User Preferences Management

    async loadDefaultLocation() {
        const urlParams = new URLSearchParams(window.location.search);
        const cityParam = urlParams.get('city');
        
        if (cityParam) {
            const location = await this.geocodeLocation(cityParam);
            if (location) {
                await this.loadWeatherForLocation(location);
                return;
            }
        }

        const savedLocation = Utils.loadFromStorage('lastLocation');
        if (savedLocation) {
            await this.loadWeatherForLocation(savedLocation);
            return;
        }

        if (navigator.geolocation) {
            this.showLoading('Getting your location...');
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    try {
                        const location = await this.reverseGeocode(latitude, longitude);
                        if (location) {
                            await this.loadWeatherForLocation(location);
                        } else {
                            throw new Error('Reverse geocoding failed');
                        }
                    } catch (error) {
                        Utils.debugLog('Reverse geocoding error', error, 'warn');
                        await this.loadFallbackLocation();
                    } finally {
                        this.hideLoading();
                    }
                },
                async (error) => {
                    Utils.debugLog('Geolocation error', error, 'warn');
                    await this.loadFallbackLocation();
                    this.hideLoading();
                },
                { timeout: 10000, enableHighAccuracy: false }
            );
        } else {
            await this.loadFallbackLocation();
        }
    }

    async reverseGeocode(lat, lon) {
    try {
        const response = await fetch(`/api/geocode/${lat},${lon}`);
        if (response.ok) {
            const data = await response.json();
            return {
                name: data.name || 'Current Location',
                country: data.country || '',
                state: data.state || '',
                lat: lat,
                lon: lon
            };
        }
    } catch (error) {
        Utils.debugLog('Reverse geocoding failed', error, 'warn');
    }
    
    return {
        name: 'Current Location',
        country: '',
        state: '',
        lat: lat,
        lon: lon
    };
}

    async loadFallbackLocation() {
        const fallbackLocation = {
            name: 'Zurich',
            country: 'CH',
            state: '',
            lat: 47.3769,
            lon: 8.5417
        };
        
        await this.loadWeatherForLocation(fallbackLocation);
    }

    saveUserPreferences() {
        if (this.currentLocation) {
            Utils.saveToStorage('lastLocation', this.currentLocation);
        }
        
        Utils.saveToStorage('temperatureUnit', this.temperatureUnit);
    }

    loadUserPreferences() {
        const savedUnit = Utils.loadFromStorage('temperatureUnit', 'C');
        this.temperatureUnit = savedUnit;
    }

    // State Management

    showLoading(message = 'Loading...') {
        this.isLoading = true;
        
        const locationElement = document.getElementById('locationName');
        if (locationElement) {
            locationElement.textContent = message;
        }

        // Update containers with loading messages
        const hourlyContainer = document.getElementById('hourlyContainer')?.querySelector('.hourly-container');
        if (hourlyContainer) {
            hourlyContainer.innerHTML = '<div class="loading-message">Loading hourly forecast...</div>';
        }

        const dailyContainer = document.getElementById('dailyContainer');
        if (dailyContainer) {
            dailyContainer.innerHTML = '<div class="loading-message">Loading daily forecast...</div>';
        }
    }

    hideLoading() {
        this.isLoading = false;
    }

    async refreshWeatherData() {
        if (!this.currentLocation || this.isLoading) return;

        Utils.debugLog('Refreshing weather data');
        
        if (window.weatherAPI) {
            const lat = this.currentLocation.lat;
            const lon = this.currentLocation.lon;
            const keysToDelete = [
                `current_${lat}_${lon}`,
                `hourly_${lat}_${lon}`,
                `daily_${lat}_${lon}`,
                `pollution_${lat}_${lon}`
            ];
            
            keysToDelete.forEach(key => {
                window.weatherAPI.cache.delete(key);
            });
        }
        
        await this.loadWeatherForLocation(this.currentLocation);
    }

    static debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

if (!Utils.debounce) {
    Utils.debounce = WeatherApp.debounce;
}

document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
    Utils.debugLog('SkyLi Weather App started');
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherApp;
}