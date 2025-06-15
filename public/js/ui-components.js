// Weather Icons
function getWeatherIconUrl(iconCode, size = '2x') {
    const baseUrl = 'https://openweathermap.org/img/wn';
    return `${baseUrl}/${iconCode}@${size}.png`;
}

// Fallback
const weatherIconsEmoji = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '🌨️',
    'mist': '🌫️',
    'fog': '🌫️',
    'haze': '🌫️',
    'smoke': '🌫️',
    'dust': '🌫️',
    'sand': '🌫️',
    'ash': '🌫️',
    'squall': '💨',
    'tornado': '🌪️'
};

// Get weather icon
function getWeatherIcon(iconCode, condition) {
    if (iconCode) {
        return getWeatherIconUrl(iconCode);
    }
    
    // Fallback to emoji
    const lowerCondition = condition?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(weatherIconsEmoji)) {
        if (lowerCondition.includes(key)) {
            return icon;
        }
    }
    return '🌤️';
}

// Create weather icon element (img or emoji)
function createWeatherIconElement(iconCode, condition, size = 'medium') {
    const iconElement = document.createElement('div');
    iconElement.className = 'weather-icon';
    
    if (iconCode) {
        // Use OpenWeather API icon
        const iconImg = document.createElement('img');
        iconImg.src = getWeatherIconUrl(iconCode);
        iconImg.alt = condition || 'Weather condition';
        
        // Set sizes based on usage
        switch (size) {
            case 'small':
                iconImg.style.width = '24px';
                iconImg.style.height = '24px';
                break;
            case 'medium':
                iconImg.style.width = '32px';
                iconImg.style.height = '32px';
                break;
            case 'large':
                iconImg.style.width = '48px';
                iconImg.style.height = '48px';
                break;
            default:
                iconImg.style.width = '32px';
                iconImg.style.height = '32px';
        }
        
        iconImg.onerror = function() {
            iconElement.innerHTML = '';
            iconElement.textContent = getWeatherIcon(null, condition);
            iconElement.style.fontSize = size === 'large' ? '24px' : size === 'small' ? '16px' : '20px';
        };
        
        iconElement.appendChild(iconImg);
    } else {
        iconElement.textContent = getWeatherIcon(null, condition);
        iconElement.style.fontSize = size === 'large' ? '24px' : size === 'small' ? '16px' : '20px';
    }
    
    return iconElement;
}

//Current weather display
function updateCurrentWeather(data) {
    document.getElementById('currentTemp').textContent = `${Math.round(data.temp)}°`;
    document.getElementById('currentCondition').textContent = data.condition;
    document.getElementById('currentDescription').textContent = data.description;
    
    // Update main weather icon if there's a container for it
    const mainIconContainer = document.getElementById('mainWeatherIcon');
    if (mainIconContainer && data.iconCode) {
        mainIconContainer.innerHTML = '';
        const iconElement = createWeatherIconElement(data.iconCode, data.condition, 'large');
        mainIconContainer.appendChild(iconElement);
    }
}

// Update weather details
function updateWeatherDetails(data) {
    document.getElementById('feelsLike').textContent = `${Math.round(data.feelsLike)}°`;
    document.getElementById('precipitation').textContent = `${data.precipitation}%`;
    document.getElementById('visibility').textContent = `${data.visibility} km`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
}

// Update additional info cards
function updateAdditionalInfo(data) {
    document.getElementById('uvIndex').textContent = data.uvIndex || '--';
    document.getElementById('windInfo').textContent = `${data.windSpeed} km/h ${data.windDirection || ''}`;

//air quality
    if (data.airQuality && document.getElementById('airQuality')) {
       const aqiElement = document.getElementById('airQuality');
        aqiElement.textContent = `${data.airQuality.aqiText} (${data.airQuality.aqi})`;
    }
}

// Hourly forecast
function createHourlyForecastItems(hourlyData) {
    const container = document.querySelector('.hourly-container');
    if (!container) {
        console.error('Hourly container not found');
        return;
    }
    
    container.replaceChildren();
    
    hourlyData.forEach(hour => {
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        
        // Time element
        const timeDiv = document.createElement('div');
        timeDiv.className = 'hourly-time';
        timeDiv.textContent = formatTime(hour.time);
        
        // Icon element
        const iconDiv = createWeatherIconElement(hour.iconCode, hour.condition, 'medium');
        iconDiv.className = 'hourly-icon';
        
        // Temperature element
        const tempDiv = document.createElement('div');
        tempDiv.className = 'hourly-temp';
        tempDiv.textContent = `${Math.round(hour.temp)}°`;
        
        // Append elements
        hourlyItem.appendChild(timeDiv);
        hourlyItem.appendChild(iconDiv);
        hourlyItem.appendChild(tempDiv);
        
        container.appendChild(hourlyItem);
    });
}

// Daily forecast
function createDailyForecastItems(dailyData) {
    const container = document.getElementById('dailyContainer');
    if (!container) {
        console.error('Daily container not found');
        return;
    }
    
    container.replaceChildren();
    
    dailyData.forEach(day => {
        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';
        
        const leftDiv = document.createElement('div');
        leftDiv.className = 'daily-left';
        leftDiv.style.display = 'flex';
        leftDiv.style.alignItems = 'center';
        leftDiv.style.gap = '10px';
        
        const daySpan = document.createElement('span');
        daySpan.className = 'daily-day';
        daySpan.textContent = formatDay(day.date);
        
        const iconElement = createWeatherIconElement(day.iconCode, day.condition, 'small');
        iconElement.className = 'daily-icon';
        
        leftDiv.appendChild(daySpan);
        leftDiv.appendChild(iconElement);
        
        // Right section (temperatures)
        const rightDiv = document.createElement('div');
        rightDiv.className = 'daily-temps';
        rightDiv.style.display = 'flex';
        rightDiv.style.gap = '8px';
        
        const highTemp = document.createElement('span');
        highTemp.className = 'temp-high';
        highTemp.textContent = `${Math.round(day.tempMax)}°`;
        
        const lowTemp = document.createElement('span');
        lowTemp.className = 'temp-low';
        lowTemp.textContent = `${Math.round(day.tempMin)}°`;
        
        rightDiv.appendChild(highTemp);
        rightDiv.appendChild(lowTemp);
        
        // Append sections to main item
        dailyItem.appendChild(leftDiv);
        dailyItem.appendChild(rightDiv);
        
        container.appendChild(dailyItem);
    });
}

// Format time for hourly display (12 PM, 1 PM, etc.)
function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours} ${ampm}`;
}

// Format day for daily display (Today, Tomorrow, Mon, Tue, etc.)
function formatDay(timestamp) {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
}

// Show loading state
function showLoadingState() {
    const hourlyContainer = document.querySelector('.hourly-container');
    const dailyContainer = document.getElementById('dailyContainer');
    
    if (hourlyContainer) {
        hourlyContainer.innerHTML = '<div class="loading-message">Loading hourly forecast...</div>';
    }
    
    if (dailyContainer) {
        dailyContainer.innerHTML = '<div class="loading-message">Loading daily forecast...</div>';
    }
    
    // Reset other displays
    const currentTemp = document.getElementById('currentTemp');
    const currentCondition = document.getElementById('currentCondition');
    const currentDescription = document.getElementById('currentDescription');
    
    if (currentTemp) currentTemp.textContent = '--°';
    if (currentCondition) currentCondition.textContent = 'Loading...';
    if (currentDescription) currentDescription.textContent = 'Fetching weather data';
}

// Show error state
function showErrorState(message = 'Unable to fetch weather data') {
    const hourlyContainer = document.querySelector('.hourly-container');
    const dailyContainer = document.getElementById('dailyContainer');
    
    if (hourlyContainer) {
        hourlyContainer.innerHTML = `<div class="loading-message">❌ ${message}</div>`;
    }
    
    if (dailyContainer) {
        dailyContainer.innerHTML = `<div class="loading-message">❌ ${message}</div>`;
    }
    
    const currentCondition = document.getElementById('currentCondition');
    const currentDescription = document.getElementById('currentDescription');
    
    if (currentCondition) currentCondition.textContent = 'Error';
    if (currentDescription) currentDescription.textContent = message;
}

// Utility function to update location display
function updateLocationDisplay(location) {
    const locationElement = document.getElementById('locationName');
    if (locationElement && location) {
        locationElement.textContent = `${location.name}, ${location.country}`;
    }
}

window.UIComponents = {
    updateCurrentWeather,
    updateWeatherDetails,
    updateAdditionalInfo,
    updateLocationDisplay,
    createHourlyForecastItems,
    createDailyForecastItems,
    showLoadingState,
    showErrorState,
    getWeatherIcon,
    getWeatherIconUrl,
    createWeatherIconElement,
    formatTime,
    formatDay
};