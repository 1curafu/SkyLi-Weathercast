const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { lat, lon } = event.queryStringParameters;
  
  if (!lat || !lon) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing lat or lon parameters' })
    };
  }
  
  try {
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!OPENWEATHER_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing OpenWeather API key' })
      };
    }

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
    }
    
    const windDirections = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const windDirectionIndex = Math.round((weatherData.wind?.deg || 0) / 22.5) % 16;
    
    const formattedWeather = {
      temp: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0].main,
      description: weatherData.weather[0].description,
      iconCode: weatherData.weather[0].icon,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      windSpeed: Math.round((weatherData.wind?.speed || 0) * 3.6),
      windDirection: windDirections[windDirectionIndex],
      visibility: Math.round((weatherData.visibility || 0) / 1000),
      uvIndex: uvIndex,
      feelsLike: Math.round(weatherData.main.feels_like),
      sunrise: weatherData.sys.sunrise,
      sunset: weatherData.sys.sunset,
      timestamp: Date.now()
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(formattedWeather)
    };
    
  } catch (error) {
    console.error('Current weather error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch current weather',
        message: error.message 
      })
    };
  }
};