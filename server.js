const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!OPENWEATHER_API_KEY) {
    console.error('OPENWEATHER_API_KEY is required');
    process.exit(1);
}

if (!GOOGLE_PLACES_API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is required');
    process.exit(1);
}

console.log('SkyLi Weather Server Starting...');

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        features: [
            'Current Weather',
            'Hourly Forecast (24 hours)',
            'Daily Forecast (10 days)',
            'Air Pollution',
            'Geocoding',
            'Places Autocomplete'
        ]
    });
});

app.get('/api/geocode/:query', async (req, res) => {
    try {
        const { query } = req.params;
        console.log(`Geocoding: ${query}`);
        
        const url = `https://pro.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            return res.status(404).json({ error: 'Location not found' });
        }
        
        const location = data[0];
        
        console.log(`OpenWeather found: ${location.name}, ${location.country} (${location.lat}, ${location.lon})`);
        
        res.json({
            name: `${location.name}, ${location.country}`,
            lat: location.lat,
            lon: location.lon,
            country: location.country,
            state: location.state || null
        });
        
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ 
            error: 'Failed to geocode location',
            message: error.message 
        });
    }
});

app.get('/api/weather/current/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        
        console.log(`Getting current weather for ${lat}, ${lon}`);
        
        const [weatherResponse, uvResponse] = await Promise.all([
            fetch(`https://pro.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
            fetch(`https://pro.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`)
        ]);
        
        if (!weatherResponse.ok) {
            throw new Error(`Current weather API error: ${weatherResponse.status}`);
        }
        
        const weatherData = await weatherResponse.json();
        
        let uvIndex = 0;
        if (uvResponse.ok) {
            const uvData = await uvResponse.json();
            uvIndex = Math.round(uvData.value || 0);
        } else {
            console.log(`UV Index API failed: ${uvResponse.status}`);
        }
        
        const formattedWeather = {
            temp: Math.round(weatherData.main.temp),
            condition: weatherData.weather[0].main,
            description: weatherData.weather[0].description,
            iconCode: weatherData.weather[0].icon,
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            windSpeed: Math.round((weatherData.wind?.speed || 0) * 3.6),
            windDirection: weatherData.wind?.deg || 0,
            visibility: Math.round((weatherData.visibility || 0) / 1000),
            uvIndex: uvIndex,
            feelsLike: Math.round(weatherData.main.feels_like),
            sunrise: weatherData.sys.sunrise,
            sunset: weatherData.sys.sunset,
            timestamp: Date.now()
        };
        
        console.log(`Current weather: ${formattedWeather.temp}°C, UV: ${uvIndex}`);
        res.json(formattedWeather);
        
    } catch (error) {
        console.error('Current weather error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch current weather',
            message: error.message 
        });
    }
});

app.get('/api/forecast/hourly/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        
        console.log(`Getting hourly forecast for ${lat}, ${lon}`);
        
        const url = `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=24`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Hourly forecast API error: ${response.status}`);
        }
        
        const data = await response.json();

        let total24hPrecip = 0;
        data.list.forEach(hour => {
            if (hour.rain && hour.rain['1h']) {
                total24hPrecip += hour.rain['1h'];
            }
            if (hour.snow && hour.snow['1h']) {
                total24hPrecip += hour.snow['1h'];
            }
        });
        
        const hourlyData = data.list.slice(0, 24).map(hour => ({
            time: hour.dt * 1000,
            temp: Math.round(hour.main.temp),
            condition: hour.weather[0].main,
            description: hour.weather[0].description,
            iconCode: hour.weather[0].icon,
            precipitation: Math.round(total24hPrecip * 100) / 100,
            humidity: hour.main.humidity,
            windSpeed: Math.round((hour.wind?.speed || 0) * 3.6),
            windDirection: hour.wind?.deg || 0,
            feelsLike: Math.round(hour.main.feels_like),
            pressure: hour.main.pressure
        }));
        
        console.log(`Hourly forecast: ${hourlyData.length} entries`);
        res.json(hourlyData);
        
    } catch (error) {
        console.error('Hourly forecast error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch hourly forecast',
            message: error.message 
        });
    }
});

app.get('/api/forecast/daily/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        
        console.log(`Getting daily forecast for ${lat}, ${lon}`);
        
        const url = `https://pro.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=10`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Daily forecast API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const dailyData = data.list.slice(0, 10).map(day => {
            let precipitation = 0;
            
            if (day.pop !== undefined) {
                precipitation = Math.round(day.pop * 100);
            } else if (day.rain !== undefined) {
                precipitation = day.rain;
            } else if (day.snow !== undefined) {
                precipitation = day.snow;
            } else if (day.precipitation !== undefined) {
                precipitation = Math.round(day.precipitation * 100);
            }
            
            console.log(`Day ${new Date(day.dt * 1000).toDateString()}: precipitation = ${precipitation}%`);
            
            return {
                date: day.dt * 1000,
                tempMax: Math.round(day.temp.max),
                tempMin: Math.round(day.temp.min),
                condition: day.weather[0].main,
                description: day.weather[0].description,
                iconCode: day.weather[0].icon,
                precipitation: precipitation,
                humidity: day.humidity,
                pressure: day.pressure,
                windSpeed: Math.round((day.speed || 0) * 3.6)
            };
        });
        
        console.log(`Daily forecast: ${dailyData.length} days`);
        res.json(dailyData);
        
    } catch (error) {
        console.error('Daily forecast error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch daily forecast',
            message: error.message 
        });
    }
});

app.get('/api/pollution/:lat/:lon', async (req, res) => {
    try {
        const { lat, lon } = req.params;
        
        console.log(`Getting air pollution for ${lat}, ${lon}`);
        
        const url = `https://pro.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Air pollution API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        
        const aqiLabels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
        
        const pollutionData = {
            aqi: aqi,
            label: aqiLabels[aqi - 1] || 'Unknown',
            components: {
                co: components.co,
                no2: components.no2,
                o3: components.o3,
                pm2_5: components.pm2_5,
                pm10: components.pm10,
                so2: components.so2
            },
            timestamp: Date.now()
        };
        
        console.log(`Air pollution: ${pollutionData.label} (${aqi})`);
        res.json(pollutionData);
        
    } catch (error) {
        console.error('Air pollution error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch air pollution data',
            message: error.message 
        });
    }
});

app.get('/api/places/autocomplete/:query', async (req, res) => {
    try {
        const { query } = req.params;
        
        console.log(`Google Places Autocomplete: ${query}`);
        
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Places API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            throw new Error(`Places API status: ${data.status}`);
        }
        
        const suggestions = data.predictions.map(prediction => ({
            placeId: prediction.place_id,
            description: prediction.description,
            mainText: prediction.structured_formatting.main_text,
            secondaryText: prediction.structured_formatting.secondary_text,
            types: prediction.types
        }));
        
        console.log(`Found ${suggestions.length} suggestions`);
        res.json({ predictions: suggestions });
        
    } catch (error) {
        console.error('Places autocomplete error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch place suggestions',
            message: error.message 
        });
    }
});

app.get('/api/places/details/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;
        
        console.log(`Google Places Details: ${placeId}`);
        
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Places details API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'OK') {
            throw new Error(`Places details status: ${data.status}`);
        }
        
        const place = data.result;
        
        const placeDetails = {
            name: place.formatted_address,
            lat: place.geometry.location.lat,
            lon: place.geometry.location.lng
        };
        
        console.log(`Place details: ${placeDetails.name} (${placeDetails.lat}, ${placeDetails.lon})`);
        res.json(placeDetails);
        
    } catch (error) {
        console.error('Places details error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch place details',
            message: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`SkyLi Weather Server running on http://localhost:${PORT}`);
});