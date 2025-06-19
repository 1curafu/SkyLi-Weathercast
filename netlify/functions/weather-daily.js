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
      throw new Error(`Daily forecast API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Group by day and get daily highs/lows
    const dailyMap = new Map();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();
      
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          date: dayKey,
          day: date.toLocaleDateString('en', { weekday: 'short' }),
          temps: [],
          conditions: [],
          icons: [],
          precipitation: []
        });
      }
      
      const dayData = dailyMap.get(dayKey);
      dayData.temps.push(item.main.temp);
      dayData.conditions.push(item.weather[0].main);
      dayData.icons.push(item.weather[0].icon);
      dayData.precipitation.push(item.pop || 0);
    });
    
    const dailyForecast = Array.from(dailyMap.values()).slice(0, 10).map(day => {
      const maxTemp = Math.round(Math.max(...day.temps));
      const minTemp = Math.round(Math.min(...day.temps));
      const avgPrecipitation = Math.round((day.precipitation.reduce((a, b) => a + b, 0) / day.precipitation.length) * 100);
      
      // Get most common condition and icon
      const conditionCounts = {};
      day.conditions.forEach(condition => {
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      });
      const mostCommonCondition = Object.keys(conditionCounts).reduce((a, b) => 
        conditionCounts[a] > conditionCounts[b] ? a : b
      );
      
      const iconCounts = {};
      day.icons.forEach(icon => {
        iconCounts[icon] = (iconCounts[icon] || 0) + 1;
      });
      const mostCommonIcon = Object.keys(iconCounts).reduce((a, b) => 
        iconCounts[a] > iconCounts[b] ? a : b
      );
      
      return {
        day: day.day,
        maxTemp,
        minTemp,
        condition: mostCommonCondition,
        iconCode: mostCommonIcon,
        precipitation: avgPrecipitation
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
      body: JSON.stringify(dailyForecast)
    };
    
  } catch (error) {
    console.error('Daily forecast error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch daily forecast',
        message: error.message 
      })
    };
  }
};