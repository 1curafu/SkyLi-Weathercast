class BackgroundController {
    constructor() {
        this.currentWeather = null;
        this.currentTime = null;
        this.isDay = true;
        this.transitionDuration = 1500;
        this.currentLocation = null;
        
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

    async updateTimeOfDay(location = null) {
        if (location) {
            this.currentLocation = location;
        }

        let hour;
        
        if (this.currentLocation && this.currentLocation.lat && this.currentLocation.lon) {
            try {
                const response = await fetch(`http://worldtimeapi.org/api/timezone`);
                
                if (response.ok) {
                    const now = new Date();
                    let timezoneOffset = Math.round(this.currentLocation.lon / 15);
                    
                    const cityTimezones = {
                        'new york': -5, 'los angeles': -8, 'chicago': -6, 'denver': -7, 'seattle': -8,
                        'miami': -5, 'boston': -5, 'san francisco': -8, 'las vegas': -8, 'phoenix': -7,
                        'atlanta': -5, 'houston': -6, 'dallas': -6, 'philadelphia': -5, 'detroit': -5,
                        
                        'london': 0, 'paris': 1, 'berlin': 1, 'rome': 1, 'madrid': 1, 'amsterdam': 1,
                        'zurich': 1, 'vienna': 1, 'prague': 1, 'budapest': 1, 'warsaw': 1, 'stockholm': 1,
                        'oslo': 1, 'copenhagen': 1, 'helsinki': 2, 'athens': 2, 'istanbul': 3,
                        
                        'tokyo': 9, 'sydney': 10, 'melbourne': 10, 'mumbai': 5.5, 'dubai': 4,
                        'moscow': 3, 'beijing': 8, 'singapore': 8, 'bangkok': 7, 'jakarta': 7,
                        'seoul': 9, 'hong kong': 8, 'shanghai': 8, 'manila': 8, 'kuala lumpur': 8,
                        'taipei': 8, 'hanoi': 7, 'ho chi minh': 7, 'yangon': 6.5, 'dhaka': 6,
                        
                        'cairo': 2, 'johannesburg': 2, 'lagos': 1, 'nairobi': 3, 'casablanca': 1,
                        'tunis': 1, 'algiers': 1, 'addis ababa': 3, 'kinshasa': 1,
                        
                        'sao paulo': -3, 'rio de janeiro': -3, 'buenos aires': -3, 'lima': -5,
                        'bogota': -5, 'caracas': -4, 'santiago': -4, 'mexico city': -6,
                        'guatemala city': -6, 'san jose': -6, 'panama city': -5, 'quito': -5,
                        
                        'toronto': -5, 'vancouver': -8, 'montreal': -5, 'calgary': -7, 'ottawa': -5,
                        'winnipeg': -6, 'halifax': -4, 'edmonton': -7,
                        
                        'perth': 8, 'brisbane': 10, 'adelaide': 9.5, 'canberra': 10, 'darwin': 9.5,
                        'auckland': 12, 'wellington': 12, 'christchurch': 12, 'suva': 12,
                        
                        'reykjavik': 0, 'dublin': 0, 'edinburgh': 0, 'cardiff': 0, 'belfast': 0
                    };
                    
                    const locationName = (this.currentLocation.name || '').toLowerCase();
                    for (const [city, offset] of Object.entries(cityTimezones)) {
                        if (locationName.includes(city)) {
                            timezoneOffset = offset;
                            console.log(`🏙️ Using known timezone for ${city}: UTC${offset >= 0 ? '+' : ''}${offset}`);
                            break;
                        }
                    }
                    
                    const month = now.getMonth() + 1;
                    const isDST = month >= 3 && month <= 10;
                    
                    if (isDST) {
                        if (this.currentLocation.lon > -130 && this.currentLocation.lon < -60 && 
                            this.currentLocation.lat > 25 && this.currentLocation.lat < 60) {
                            if (!locationName.includes('arizona') && !locationName.includes('hawaii')) {
                                timezoneOffset += 1;
                                console.log('🌞 Applied North America DST (+1 hour)');
                            }
                        }
                        else if (this.currentLocation.lon > -10 && this.currentLocation.lon < 40 && 
                                 this.currentLocation.lat > 35 && this.currentLocation.lat < 70) {
                            timezoneOffset += 1;
                            console.log('🌞 Applied Europe DST (+1 hour)');
                        }
                        else if (this.currentLocation.lon > 110 && this.currentLocation.lon < 160 && 
                                 this.currentLocation.lat < -10 && this.currentLocation.lat > -45) {
                            const isAustralianDST = month >= 10 || month <= 3;
                            if (isAustralianDST) {
                                timezoneOffset += 1;
                                console.log('🌞 Applied Australia DST (+1 hour)');
                            }
                        }
                    }
                    
                    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                    const locationTime = new Date(utc + (timezoneOffset * 3600000));
                    hour = locationTime.getHours();
                    
                    console.log(`🌍 Accurate time for ${this.currentLocation.name}: ${locationTime.toLocaleTimeString()} (UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})`);
                } else {
                    throw new Error('WorldTimeAPI failed');
                }
            } catch (error) {
                console.warn('Using fallback timezone calculation');
                const now = new Date();
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const timezoneOffset = Math.round(this.currentLocation.lon / 15);
                const locationTime = new Date(utc + (timezoneOffset * 3600000));
                hour = locationTime.getHours();
            }
        } else {
            const now = new Date();
            hour = now.getHours();
        }
        
        this.isDay = hour >= 6 && hour < 18;
        this.currentTime = hour;
        
        console.log(`🕐 Location time: ${hour}:00, isDay: ${this.isDay} for ${this.currentLocation?.name || 'unknown location'}`);
        
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
        
        console.log(`🌈 Background updated: ${condition} (${timeOfDay}) for ${this.currentLocation?.name || 'unknown location'}`);
    }

    setLocation(location) {
        console.log(`📍 Setting location: ${location.name}`);
        this.currentLocation = location;
        this.updateTimeOfDay(location);
    }

    setWeather(weather) {
        this.updateWeather(weather);
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
                    //this.createSunElements(container);
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
        const sun = document.createElement('div');
        sun.className = 'sun-element';
        sun.textContent = '☀️';
        container.appendChild(sun);

        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            ray.className = 'sun-ray';
            ray.style.transform = `rotate(${i * 45}deg)`;
            ray.style.animationDelay = `${i * 0.1}s`;
            container.appendChild(ray);
        }

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