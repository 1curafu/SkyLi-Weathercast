require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoints for organized structure
app.get('/api/weather/current', async (req, res) => {
    const { lat, lng } = req.query;
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Weather fetch failed' });
    }
});

app.get('/api/weather/forecast', async (req, res) => {
    const { lat, lng } = req.query;
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Forecast fetch failed' });
    }
});

// Serve Google Places key
app.get('/api/config', (req, res) => {
    res.json({
        googlePlacesKey: process.env.GOOGLE_PLACES_API_KEY
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'Server is running!', 
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/weather/current',
            '/api/weather/forecast', 
            '/api/config',
            '/api/health'
        ]
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 SkyLi Weather Server running on http://localhost:${PORT}`);
});