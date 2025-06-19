const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { query } = event.queryStringParameters;
  
  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing query parameter' })
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
    
    // Check if query is coordinates (lat,lon format)
    const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    
    let url;
    if (coordMatch) {
      const lat = coordMatch[1];
      const lon = coordMatch[2];
      url = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`;
    } else {
      url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Location not found' })
      };
    }
    
    const location = data[0];
    
    const formattedLocation = {
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      country: location.country,
      state: location.state || null,
      displayName: location.state ? 
        `${location.name}, ${location.state}, ${location.country}` : 
        `${location.name}, ${location.country}`
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(formattedLocation)
    };
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to geocode location',
        message: error.message 
      })
    };
  }
};