function formatTime(timestamp, format = '12h') {
    const date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);

    date.setMinutes(0, 0, 0);
    
    const options = {
        hour: 'numeric',
        hour12: format === '12h'
    };
    return date.toLocaleTimeString('en-US', options);
}

function formatDay(timestamp) {

    const date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
    const today = new Date();
    
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (inputDate.getTime() === todayDate.getTime()) return 'Today';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
}

function isToday(timestamp) {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function isPast(timestamp) {
    return timestamp < getCurrentTimestamp();
}

function formatTemperature(temp) {
    if (temp === null || temp === undefined) return '--°';
    return Math.round(temp) + '°C';
}

function getWeatherCategory(condition) {
    const condition_lower = condition.toLowerCase();
    
    if (condition_lower.includes('clear')) return 'clear';
    if (condition_lower.includes('cloud')) return 'cloudy';
    if (condition_lower.includes('rain') || condition_lower.includes('drizzle')) return 'rainy';
    if (condition_lower.includes('snow')) return 'snowy';
    if (condition_lower.includes('storm') || condition_lower.includes('thunder')) return 'stormy';
    if (condition_lower.includes('mist') || condition_lower.includes('fog')) return 'misty';
    
    return 'default';
}

function getWeatherEmoji(condition) {
    const category = getWeatherCategory(condition);
    
    const emojis = {
        clear: '☀️',
        cloudy: '☁️',
        rainy: '🌧️',
        snowy: '❄️',
        stormy: '⛈️',
        misty: '🌫️',
        default: '🌤️'
    };
    
    return emojis[category] || emojis.default;
}

function enhanceWeatherDescription(description) {
    if (!description) return 'Weather information unavailable';
    
    return description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function getWindDirection(degrees) {
    if (degrees === null || degrees === undefined) return 'N/A';
    
    const directions = [
        'N', 'NNE', 'NE', 'ENE',
        'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW',
        'W', 'WNW', 'NW', 'NNW'
    ];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function getWindDescription(speed) {
    if (speed === null || speed === undefined) return 'No data';
    
    if (speed < 1) return 'Calm';
    if (speed < 6) return 'Light air';
    if (speed < 12) return 'Light breeze';
    if (speed < 20) return 'Gentle breeze';
    if (speed < 29) return 'Moderate breeze';
    if (speed < 39) return 'Fresh breeze';
    if (speed < 50) return 'Strong breeze';
    if (speed < 62) return 'Near gale';
    if (speed < 75) return 'Gale';
    if (speed < 89) return 'Strong gale';
    if (speed < 103) return 'Storm';
    return 'Hurricane';
}

function convertWindSpeed(speed, unit = 'kmh') {
    if (speed === null || speed === undefined) return 0;
    
    switch (unit) {
        case 'mph':
            return Math.round(speed * 2.237);
        case 'ms':
            return Math.round(speed * 10) / 10;
        case 'kmh':
        default:
            return Math.round(speed * 3.6);
    }
}

function getAQIInfo(aqi) {
    if (aqi === null || aqi === undefined) {
        return { text: 'No data', color: '#666666' };
    }
    
    const aqiLevels = {
        1: { text: 'Good', color: '#00e400' },
        2: { text: 'Fair', color: '#ffff00' },
        3: { text: 'Moderate', color: '#ff7e00' },
        4: { text: 'Poor', color: '#ff0000' },
        5: { text: 'Very Poor', color: '#8f3f97' }
    };
    
    return aqiLevels[aqi] || { text: 'Unknown', color: '#666666' };
}

function isValidCoordinates(lat, lon) {
    return (
        lat !== null && lat !== undefined &&
        lon !== null && lon !== undefined &&
        lat >= -90 && lat <= 90 &&
        lon >= -180 && lon <= 180 &&
        !isNaN(lat) && !isNaN(lon)
    );
}

function isValidCityName(name) {
    if (!name || typeof name !== 'string') return false;
    
    const cityRegex = /^[a-zA-Z\u00C0-\u017F\s\-',\.]+$/;
    return cityRegex.test(name.trim()) && name.trim().length >= 2 && name.trim().length <= 100;
}

function sanitizeCityName(name) {
    if (!name || typeof name !== 'string') return '';
    
    return name
        .trim()
        .replace(/[^a-zA-Z\u00C0-\u017F\s\-',\.0-9]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 100);
}

function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return Number(num).toFixed(decimals);
}

function formatPercentage(value) {
    if (value === null || value === undefined || isNaN(value)) return '--%';
    return Math.round(value) + '%';
}

function formatDistance(meters) {
    if (meters === null || meters === undefined || isNaN(meters)) return '-- km';
    
    if (meters >= 1000) {
        return (meters / 1000).toFixed(1) + ' km';
    } else {
        return Math.round(meters) + ' m';
    }
}

function capitalizeWords(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

function getMostFrequent(arr) {
    if (!arr || arr.length === 0) return null;
    
    const frequency = {};
    let maxCount = 0;
    let mostFrequent = arr[0];
    
    for (const item of arr) {
        frequency[item] = (frequency[item] || 0) + 1;
        if (frequency[item] > maxCount) {
            maxCount = frequency[item];
            mostFrequent = item;
        }
    }
    
    return mostFrequent;
}

function removeDuplicates(arr) {
    return [...new Set(arr)];
}

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
        return false;
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
        return false;
    }
}

function debounce(func, wait) {
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

function debugLog(message, data = null, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] SkyLi:`;
    
    if (level === 'error') {
        console.error(prefix, message, data);
    } else if (level === 'warn') {
        console.warn(prefix, message, data);
    } else {
        console.log(prefix, message, data);
    }
}

window.Utils = {
    formatTime,
    formatDay,
    getCurrentTimestamp,
    isToday,
    isPast,
    formatTemperature,
    getWeatherCategory,
    getWeatherEmoji,
    enhanceWeatherDescription,
    getWindDirection,
    getWindDescription,
    convertWindSpeed,
    getAQIInfo,
    isValidCoordinates,
    isValidCityName,
    sanitizeCityName,
    formatNumber,
    formatPercentage,
    formatDistance,
    capitalizeWords,
    getMostFrequent,
    removeDuplicates,
    saveToStorage,
    loadFromStorage,
    removeFromStorage,
    debounce,
    debugLog
};