const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const { placeId } = event.queryStringParameters;
  
  if (!placeId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing placeId parameter' })
    };
  }
  
  try {
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!GOOGLE_PLACES_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Google Places API key' })
      };
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,geometry,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Places Details API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Places Details API status: ${data.status}`);
    }
    
    const place = data.result;
    
    const placeDetails = {
      name: place.name,
      lat: place.geometry.location.lat,
      lon: place.geometry.location.lng,
      formattedAddress: place.formatted_address
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(placeDetails)
    };
    
  } catch (error) {
    console.error('Places details error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch place details',
        message: error.message 
      })
    };
  }
};