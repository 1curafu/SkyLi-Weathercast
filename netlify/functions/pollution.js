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
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Air pollution API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.list || data.list.length === 0) {
      throw new Error('No pollution data available');
    }
    
    const pollution = data.list[0];
    const aqi = pollution.main.aqi;
    
    const aqiLabels = {
      1: 'Good',
      2: 'Fair', 
      3: 'Moderate',
      4: 'Poor',
      5: 'Very Poor'
    };
    
    const airQuality = {
      aqi: aqi,
      label: aqiLabels[aqi] || 'Unknown',
      components: {
        co: pollution.components.co,
        no: pollution.components.no,
        no2: pollution.components.no2,
        o3: pollution.components.o3,
        so2: pollution.components.so2,
        pm2_5: pollution.components.pm2_5,
        pm10: pollution.components.pm10,
        nh3: pollution.components.nh3
      },
      timestamp: pollution.dt
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(airQuality)
    };
    
  } catch (error) {
    console.error('Air pollution error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch air pollution data',
        message: error.message 
      })
    };
  }
};