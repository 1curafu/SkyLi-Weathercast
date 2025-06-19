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

    const response = await fetch(
      `https://pro.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Hourly forecast API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const hourlyForecast = data.list.slice(0, 24).map(item => {
      const date = new Date(item.dt * 1000);
      return {
        time: date.getHours(),
        temp: Math.round(item.main.temp),
        condition: item.weather[0].main,
        iconCode: item.weather[0].icon,
        precipitation: Math.round((item.pop || 0) * 100),
        timestamp: item.dt
      };
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(hourlyForecast)
    };
    
  } catch (error) {
    console.error('Hourly forecast error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch hourly forecast',
        message: error.message 
      })
    };
  }
};