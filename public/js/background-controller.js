class BackgroundController {
    constructor() {
        this.currentWeather = null;
        this.currentTime = null;
        this.isDay = true;
        this.transitionDuration = 1500;
        
        this.init();
    }

    init() {
        this.createBackgroundElements();
        this.updateTimeOfDay();
        
        setInterval(() => {
            this.updateTimeOfDay();
        }, 60000);
    }

    createBackgroundElements() {
        const existingBg = document.getElementById('dynamic-background');
        if (existingBg) {
            existingBg.remove();
        }

        const backgroundContainer = document.createElement('div');
        backgroundContainer.id = 'dynamic-background';
        backgroundContainer.className = 'dynamic-background';
        
        const gradientLayer = document.createElement('div');
        gradientLayer.className = 'background-gradient';
        gradientLayer.id = 'background-gradient';
        
        const particleLayer = document.createElement('div');
        particleLayer.className = 'background-particles';
        particleLayer.id = 'background-particles';
        
        backgroundContainer.appendChild(gradientLayer);
        backgroundContainer.appendChild(particleLayer);
        
        document.body.insertBefore(backgroundContainer, document.body.firstChild);
    }

    updateTimeOfDay() {
        const now = new Date();
        const hour = now.getHours();
        
        this.isDay = hour >= 6 && hour < 18;
        this.currentTime = hour;
        
        if (this.currentWeather) {
            this.updateBackground(this.currentWeather);
        }
    }

    updateWeather(weather) {
        if (!weather || !weather.condition) return;
        
        this.currentWeather = weather;
        this.updateBackground(weather);
    }

    updateBackground(weather) {
        const condition = this.getWeatherCondition(weather.condition);
        const timeOfDay = this.isDay ? 'day' : 'night';
        
        this.applyBackground(condition, timeOfDay);
        this.createWeatherParticles(condition, timeOfDay);
        
        console.log(`🌈 Background updated: ${condition} (${timeOfDay})`);
    }

    getWeatherCondition(condition) {
        if (!condition) return 'clear';
        
        const conditionLower = condition.toLowerCase();
        
        if (conditionLower.includes('clear')) return 'clear';
        if (conditionLower.includes('cloud')) return 'clouds';
        if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 'rain';
        if (conditionLower.includes('snow')) return 'snow';
        if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return 'thunderstorm';
        if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze')) return 'mist';
        
        return 'clear';
    }

    applyBackground(condition, timeOfDay) {
        const gradientElement = document.getElementById('background-gradient');
        if (!gradientElement) return;

        gradientElement.className = 'background-gradient';
        
        const backgroundClass = this.getBackgroundClass(condition, timeOfDay);
        gradientElement.classList.add(backgroundClass);
        
        const animationClass = this.getAnimationClass(condition, timeOfDay);
        gradientElement.classList.add(animationClass);
    }

    getBackgroundClass(condition, timeOfDay) {
        const classMap = {
            'clear': timeOfDay === 'day' ? 'clear-day' : 'clear-night',
            'clouds': timeOfDay === 'day' ? 'cloudy-day' : 'cloudy-night',
            'rain': timeOfDay === 'day' ? 'rainy-day' : 'rainy-night',
            'snow': timeOfDay === 'day' ? 'snowy-day' : 'snowy-night',
            'thunderstorm': timeOfDay === 'day' ? 'stormy-day' : 'stormy-night',
            'mist': timeOfDay === 'day' ? 'misty-day' : 'misty-night'
        };
        
        return classMap[condition] || 'clear-day';
    }

    getAnimationClass(condition, timeOfDay) {
        const animationMap = {
            'clear': timeOfDay === 'day' ? 'sunny-day' : 'starry-night',
            'clouds': timeOfDay === 'day' ? 'cloudy-day' : 'cloudy-night',
            'rain': timeOfDay === 'day' ? 'rainy-day' : 'stormy-night',
            'snow': timeOfDay === 'day' ? 'snowy-day' : 'snowy-night',
            'thunderstorm': timeOfDay === 'day' ? 'storm-day' : 'storm-night',
            'mist': timeOfDay === 'day' ? 'misty-day' : 'misty-night'
        };
        
        return animationMap[condition] || 'sunny-day';
    }

    createWeatherParticles(condition, timeOfDay) {
        const particleContainer = document.getElementById('background-particles');
        if (!particleContainer) return;

        this.fadeOutParticles(particleContainer, () => {
            this.generateParticles(particleContainer, condition, timeOfDay);
        });
    }

    fadeOutParticles(container, callback) {
        const existingParticles = container.children;
        if (existingParticles.length === 0) {
            callback();
            return;
        }

        Array.from(existingParticles).forEach(particle => {
            particle.style.transition = 'opacity 500ms ease-out';
            particle.style.opacity = '0';
        });

        setTimeout(() => {
            container.innerHTML = '';
            callback();
        }, 500);
    }

    generateParticles(container, condition, timeOfDay) {
        switch (condition) {
            case 'clear':
                if (timeOfDay === 'day') {
                    this.createSunElements(container);
                } else {
                    this.createStars(container);
                }
                break;
            case 'rain':
                this.createRaindrops(container, timeOfDay === 'night' ? 200 : 120);
                break;
            case 'snow':
                this.createSnowflakes(container, timeOfDay === 'night' ? 40 : 60);
                break;
            case 'clouds':
                this.createFloatingClouds(container, timeOfDay === 'night');
                break;
            case 'thunderstorm':
                this.createRaindrops(container, 150);
                this.createLightningEffect(container, timeOfDay === 'night');
                break;
            case 'mist':
                this.createFogEffect(container, timeOfDay === 'night');
                break;
        }
    }

    createSunElements(container) {
        // sun
        const sun = document.createElement('div');
        sun.className = 'sun-element';
        sun.textContent = '☀️';
        container.appendChild(sun);

        // sun rays
        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            ray.className = 'sun-ray';
            ray.style.transform = `rotate(${i * 45}deg)`;
            ray.style.animationDelay = `${i * 0.1}s`;
            container.appendChild(ray);
        }

        // light sparkles
        for (let i = 0; i < 20; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'light-sparkle';
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 100 + '%';
            sparkle.style.animationDelay = Math.random() * 3 + 's';
            container.appendChild(sparkle);
        }
    }

    createRaindrops(container, count) {
        for (let i = 0; i < count; i++) {
            const raindrop = document.createElement('div');
            raindrop.className = 'raindrop';
            raindrop.style.left = Math.random() * 100 + '%';
            raindrop.style.animationDelay = Math.random() * 2 + 's';
            raindrop.style.animationDuration = (Math.random() * 0.5 + 0.3) + 's';
            raindrop.style.opacity = Math.random() * 0.7 + 0.3;
            container.appendChild(raindrop);
        }

        // rain splash effects
        for (let i = 0; i < 10; i++) {
            const splash = document.createElement('div');
            splash.className = 'rain-splash';
            splash.style.left = Math.random() * 100 + '%';
            splash.style.animationDelay = Math.random() * 3 + 's';
            container.appendChild(splash);
        }
    }

    createSnowflakes(container, count) {
        const snowflakeShapes = ['❄', '❅', '❆', '*'];
        
        for (let i = 0; i < count; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = snowflakeShapes[Math.floor(Math.random() * snowflakeShapes.length)];
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDelay = Math.random() * 5 + 's';
            snowflake.style.animationDuration = (Math.random() * 4 + 3) + 's';
            snowflake.style.fontSize = (Math.random() * 15 + 10) + 'px';
            snowflake.style.opacity = Math.random() * 0.8 + 0.2;
            container.appendChild(snowflake);
        }
    }

    createStars(container) {
        for (let i = 0; i < 150; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 5 + 's';
            star.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            const size = Math.random() * 3 + 1;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            
            container.appendChild(star);
        }

        setTimeout(() => {
            this.createShootingStars(container);
        }, 2000);
    }

    createShootingStars(container) {
        const createShootingStar = () => {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            shootingStar.style.left = Math.random() * 50 + '%';
            shootingStar.style.top = Math.random() * 30 + '%';
            container.appendChild(shootingStar);

            setTimeout(() => {
                if (shootingStar.parentNode) {
                    shootingStar.remove();
                }
            }, 2000);
        };

        setInterval(createShootingStar, Math.random() * 10000 + 10000);
    }

    createFloatingClouds(container, isNight) {
        const cloudCount = isNight ? 3 : 6;
        const cloudEmojis = ['☁', '⛅', '🌤'];
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = document.createElement('div');
            cloud.className = isNight ? 'night-cloud' : 'floating-cloud';
            cloud.textContent = cloudEmojis[Math.floor(Math.random() * cloudEmojis.length)];
            cloud.style.top = Math.random() * 60 + '%';
            cloud.style.left = '-20%';
            cloud.style.animationDelay = Math.random() * 10 + 's';
            cloud.style.animationDuration = (Math.random() * 15 + 20) + 's';
            cloud.style.fontSize = (Math.random() * 25 + 30) + 'px';
            container.appendChild(cloud);
        }
    }

    createLightningEffect(container, isIntense) {
        const lightning = document.createElement('div');
        lightning.className = 'lightning-effect';
        container.appendChild(lightning);
        
        const flashInterval = isIntense ? 3000 : 5000;
        
        const createFlash = () => {
            if (Math.random() < 0.2) {
                lightning.style.opacity = '0.9';
                
                setTimeout(() => {
                    lightning.style.opacity = '0';
                }, isIntense ? 200 : 100);
                
                console.log('⚡ Lightning flash!');
            }
        };
        
        setInterval(createFlash, flashInterval);
    }

    createFogEffect(container, isNight) {
        const fogLayers = isNight ? 2 : 4;
        
        for (let i = 0; i < fogLayers; i++) {
            const fog = document.createElement('div');
            fog.className = 'fog-layer';
            fog.style.animationDelay = i * 3 + 's';
            fog.style.opacity = isNight ? 0.4 + (i * 0.1) : 0.2 + (i * 0.1);
            container.appendChild(fog);
        }
    }

    setWeather(weather) {
        this.updateWeather(weather);
    }

    setTransitionDuration(duration) {
        this.transitionDuration = duration;
    }

    getCurrentBackground() {
        if (!this.currentWeather) return null;
        
        const condition = this.getWeatherCondition(this.currentWeather.condition);
        const timeOfDay = this.isDay ? 'day' : 'night';
        
        return { condition, timeOfDay };
    }
}

window.backgroundController = new BackgroundController();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundController;
}