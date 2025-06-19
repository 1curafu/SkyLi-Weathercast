# ☁️ SkyLi - Weathercast

**SkyLi - Weathercast** is a dynamic weather web application that provides real-time updates, location-based forecasts, and sleek animated backgrounds based on weather conditions. Built for usability and performance, it's perfect for everyday users and weather enthusiasts alike.

> 🔗 Live Demo: [SkyLi - Weathercast](https://skyli-weathercast.onrender.com)

---

## 🚀 Features

- 🌤 Real-time weather data from OpenWeather API
- 🗺 Location auto-detect and search (Google Places)
- 🎨 Dynamic animated background visuals
- 🧩 Modular JavaScript components
- 📱 Mobile-first responsive design
- 💾 Lightweight, fast, and accessible
- ☁️ Deployed via Render

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3 (custom + animations), Vanilla JS
- **Backend:** Node.js (Express server)
- **APIs:** OpenWeather API, Google Places API
- **Deployment:** [Render](https://render.com)

---

## 📦 Project Structure

```
SkyLi-Weathercast/
├── public/
│   ├── assets/                # Icons and favicons
│   ├── css/                   # Stylesheets
│   ├── js/                    # Modular JavaScript files
│   ├── index.html             # Entry point
├── server.js                  # Express server setup
├── package.json               # Project config and dependencies
├── .env.example               # Environment variable guide
```

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SkyLi-Weathercast.git
cd SkyLi-Weathercast
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and set your API keys:

```bash
cp .env.example .env
```

```
OPENWEATHER_API_KEY=your_openweather_key
GOOGLE_API_KEY=your_google_places_key
```

### 4. Run the App

```bash
npm start
```

App runs at: `http://localhost:3000`

---

## 🧪 Development

- Auto-reloading with `nodemon`
- Modular code for easy extension
- Designed for rapid prototyping

---

## ✨ Contributing

Pull requests are welcome! Please:
- Use consistent code style
- Submit small atomic commits
- Clearly describe your changes

---

## 🛡 License

MIT License. See `LICENSE` file.

---

## 🙏 Credits

Built with ❤️ by [Mykhailo Khimich](https://github.com/1curafu) and [Amin Salem](https://github.com/Reverse2Amin)

Weather data by [OpenWeather](https://openweathermap.org/)  

Places API by [Google Developers](https://developers.google.com/maps/documentation/places/web-service/overview)

---

## 🌐 Live URL

➡️ **https://skyli-weathercast.onrender.com**

---
