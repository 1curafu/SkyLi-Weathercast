const weatherIcons = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '🌨️',
    'mist': '🌫️',
    'fog': '🌫️',
    'haze': '🌫️'
};

function getWeatherIcon(condition) {
    const lowerCondition = condition.toLowerCase();
    for (const [key, icon] of Object.entries(weatherIcons)) {
        if (lowerCondition.includes(key)) {
            return icon;
        }
    }
    return '❓'; // Default icon if no match found
}

//Updating current weather display
function updateCurrentWeather(data) {
    document.getElementById('currentTemp').textContent = `${Math.round(data.temp)}°`;
    document.getElementById('currentCondition').textContent = data.condition;
    document.getElementById('currentDescription').textContent = data.description;
}

//Upadting weather details display
function updateWeatherDetails(data) {
    document.getElementById('feelsLike').textContent = `${Math.round(data.feelsLike)}°`;
    document.getElementById('precipitation').textContent = `${data.precipitation}%`;
    document.getElementById('visibility').textContent = `${data.visibility} km`;
    document.getElementById('humidity').textContent = `${data.humidity}%`;
}

//Add info

function updateAdditionalInfo(data){
    document.getElementById('uvIndex').textContent = data.uvIndex || '--';
    document.getElementById('windInfo').textContent = `${data.windSpeed} km/h ${data.windDirection || ''}`;
}

//24 hourds forecast

function createHourlyForecastItems(hourlyData) {
    const container = document.querySelector('.hourly-container');
    container.replaceChildren(); // Clear existing items

    hourlyData.forEach(hour => {
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';

        const timeDiv = document.createElement('div');
        timeDiv.textContent = formatTime(hour.time);

        const iconDiv = document.createElement('div');
        iconDiv.textContent = getWeatherIcon(hour.condition);

        const tempDiv = document.createElement('div');
        tempDiv.textContent = `${Math.round(hour.temp)}°`;
        
        // Append the elements to the hourly item
        hourlyItem.appendChild(timeDiv);
        hourlyItem.appendChild(iconDiv);
        hourlyItem.appendChild(tempDiv);
        // Append the hourly item to the container
        container.appendChild(hourlyItem);
    });
}


//daily forecast

function createDailyForecastItems(dailyData) {
    const container = document.getElementById('dailyContainer');
    container.replaceChildren();

    dailyData.forEach(day => {
        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';

        const leftDiv = document.createElement('div');
        const daySpan = document.createElement('span');
        daySpan.textContent = formatDay(day.date);
        const iconSpan = document.createElement('span');
        iconSpan.textContent = getWeatherIcon(day.condition);
        leftDiv.appendChild(daySpan);
        leftDiv.appendChild(iconSpan);
        leftDiv.appendChild(document.createTextNode(''));

        const rightDiv = document.createElement('div');
        const highTemp = document.createElement('span');
        highTemp.textContent = `${Math.round(day.tempMax)}°`;
        const lowTemp = document.createElement('span');
        lowTemp.textContent = `${Math.round(day.tempMin)}°`;

        rightDiv.appendChild(highTemp);
        rightDiv.appendChild(lowTemp);

        dailyItem.appendChild(leftDiv);
        dailyItem.appendChild(rightDiv);

        container.appendChild(dailyItem);
    });
}

//format time

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert to 12-hour format
    return `${displayHours}:00 ${ampm}`;
}

//format day
function formatDay(timestamp) {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tommorrow = new Date(today);
    tommorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    else if (date.toDateString() === tommorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
}

//state

function showLoadingState() {
    document.querySelector('.hourly-container').innerHTML = '<div class="loading-message">Loading hourly forecast...</div>';
    document.getElementById('dailyContainer').innerHTML = '<div class="loading-message">Loading daily forecast...</div>';

    document.getElementById('currentTemp').textContent = '--°';
    document.getElementById('currentCondition').textContent = 'Loading...';
    document.getElementById('currentDescription').textContent = 'Fetching weather data';
}

//error

function showErrorState(message = 'Unable to fetch weather data'){
    document.querySelector('.hourly-container').innerHTML = `<div class="loading-message">❌ ${message}</div>`;
    document.getElementById('dailyContainer').innerHTML = `<div class="loading-message">❌ ${message}</div>`;
    
    document.getElementById('currentCondition').textContent = 'Error';
    document.getElementById('currentDescription').textContent = message;
}

window.UIComponents = {
    getWeatherIcon,
    updateCurrentWeather,
    updateWeatherDetails,
    updateAdditionalInfo,
    createHourlyForecastItems,
    createDailyForecastItems,
    formatTime,
    formatDay,
    showLoadingState,
    showErrorState
};