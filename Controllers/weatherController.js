import asyncHandler from "express-async-handler";
import tzlookup from "tz-lookup";
import axios from "axios";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const TOMORROW_API_CONFIG = {
    BASE_URL: 'https://api.tomorrow.io/v4/weather/forecast',
    API_KEY: process.env.WEATHER_API_KEY || 'OjVUTgatB1eWcTaiU6LQFmA4otnVT0uI',
};

const weatherIcons = {
    snowyWindyClouds: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023691/1_zwgvxp.png',
    partlySunnyWithRain: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023690/2_gqgpf3.png',
    partlySunnyWithThunderstorms: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023693/3_zzuqh3.png',
    cloudyWithSnow: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023692/4_lu5a3x.png',
    sunnyClearSky: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023693/5_lzbeao.png',
    overcastClouds: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023692/6_pon5zm.png',
    partlySunnyWithRain: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023693/7_hix73d.png',
};

// Utility functions
const formatters = {
    windSpeed: (speedInMS) => (speedInMS * 3.6).toFixed(1),
    percentage: (value) => parseFloat(value).toFixed(1),
    time: (isoString, lat, lon) => {
        if (!isoString) return null;
        
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return null;

            const timezoneOffset = Math.round(lon / 15);

            const utcHours = date.getUTCHours();
            const utcMinutes = date.getUTCMinutes();

            // Ensure hours wrap correctly with modulo
            let localHours = (utcHours + timezoneOffset + 24) % 24;

            const period = localHours < 12 ? 'AM' : 'PM';
            const hours12 = localHours % 12 || 12;
            const minutes = utcMinutes.toString().padStart(2, '0');

            return `${hours12}:${minutes} ${period}`;
        } catch (error) {
            console.error('Error formatting time:', error.message);
            return null;
        }
    }
};

// Weather code to description mapping
const getWeatherDescription = (weatherCode) => {
    const descriptions = {
        1000: 'Clear, sunny',
        1100: 'Mostly clear',
        1101: 'Partly cloudy',
        1102: 'Mostly cloudy',
        1001: 'Cloudy',
        2000: 'Fog',
        2100: 'Light fog',
        4000: 'Drizzle',
        4001: 'Rain',
        4200: 'Light rain',
        4201: 'Heavy rain',
        5000: 'Snow',
        5001: 'Flurries',
        5100: 'Light snow',
        5101: 'Heavy snow',
        6000: 'Freezing drizzle',
        6001: 'Freezing rain',
        6200: 'Light freezing rain',
        6201: 'Heavy freezing rain',
        7000: 'Ice pellets',
        7101: 'Heavy ice pellets',
        7102: 'Light ice pellets',
        8000: 'Thunderstorm',
    };
    return descriptions[weatherCode] || 'Unknown';
};

// Map weather code to icon URL
const getWeatherIcon = (weatherCode) => {
    const iconMap = {
        1000: weatherIcons.sunnyClearSky,
        1100: weatherIcons.partlySunnyWithRain,
        1101: weatherIcons.partlySunnyWithRain,
        1102: weatherIcons.overcastClouds,
        1001: weatherIcons.overcastClouds,
        2000: weatherIcons.overcastClouds,
        2100: weatherIcons.overcastClouds,
        4000: weatherIcons.partlySunnyWithRain,
        4001: weatherIcons.partlySunnyWithRain,
        4200: weatherIcons.partlySunnyWithRain,
        4201: weatherIcons.partlySunnyWithThunderstorms,
        5000: weatherIcons.cloudyWithSnow,
        5001: weatherIcons.cloudyWithSnow,
        5100: weatherIcons.cloudyWithSnow,
        5101: weatherIcons.cloudyWithSnow,
        6000: weatherIcons.partlySunnyWithRain,
        6001: weatherIcons.partlySunnyWithRain,
        6200: weatherIcons.partlySunnyWithRain,
        6201: weatherIcons.partlySunnyWithRain,
        7000: weatherIcons.cloudyWithSnow,
        7101: weatherIcons.cloudyWithSnow,
        7102: weatherIcons.cloudyWithSnow,
        8000: weatherIcons.partlySunnyWithThunderstorms,
    };
    return iconMap[weatherCode] || weatherIcons.sunnyClearSky; // Default to sunny if no match
};

// Get day part based on hour
const getDayPart = (hour) => {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
};

// Generate current weather description
const getCurrentWeatherDescription = (data) => {
    const baseDescription = getWeatherDescription(data.weatherCode);
    let tempDescription = '';
    if (data.temperature >= 30) {
        tempDescription = 'hot';
    } else if (data.temperature >= 20) {
        tempDescription = 'warm';
    } else if (data.temperature >= 10) {
        tempDescription = 'cool';
    } else {
        tempDescription = 'cold';
    }
    let precipDescription = '';
    if (parseFloat(data.rainChance) > 70) {
        precipDescription = 'high chance of precipitation';
    } else if (parseFloat(data.rainChance) > 30) {
        precipDescription = 'moderate chance of precipitation';
    } else if (parseFloat(data.rainChance) > 10) {
        precipDescription = 'slight chance of precipitation';
    } else {
        precipDescription = 'dry conditions';
    }
    return `${baseDescription} with ${tempDescription} temperatures and ${precipDescription}`;
};

// Cache for weather data
const cache = {};

// API client
const weatherClient = {
    headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'application/json'
    },
    // Fetch current weather data
    async getCurrentWeather(lat, lon) {
        const response = await this.fetchWeatherData(lat, lon, {
            timesteps: 'daily',
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'sunriseTime', 'sunsetTime', 'weatherCode']
        });
        const dailyData = response.timelines.daily[0]?.values;
        if (!dailyData) throw new Error('Daily weather data not found in response');
        const minutelyResponse = await this.fetchWeatherData(lat, lon, {
            timesteps: 'minutely',
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'weatherCode']
        });
        const minutelyData = minutelyResponse.timelines.minutely[0]?.values;
        const weatherCode = minutelyData.weatherCode || dailyData.weatherCode;
        const currentData = {
            temperature: minutelyData.temperature,
            windSpeed: formatters.windSpeed(minutelyData.windSpeed),
            humidity: formatters.percentage(minutelyData.humidity),
            rainChance: formatters.percentage(minutelyData.precipitationProbability),
            sunrise: formatters.time(dailyData.sunriseTime, lat, lon),
            sunset: formatters.time(dailyData.sunsetTime, lat, lon),
            weatherCode: weatherCode,
            icon: getWeatherIcon(weatherCode), // Add weather icon
        };
        return {
            ...currentData,
            description: getCurrentWeatherDescription(currentData),
        };
    },
    // Fetch weather forecast data
    async getWeatherForecast(lat, lon) {
        const response = await this.fetchWeatherData(lat, lon, {
            timesteps: '1d',
            startTime: 'now',
            endTime: 'nowPlus7d',
            fields: ['temperature', 'weatherCode', 'sunriseTime', 'sunsetTime', 'precipitationProbability']
        });
        return response.timelines.daily.map(day => {
            const date = new Date(day.time);
            const precipitationProbability = day.values.precipitationProbability;
            const rainChance = precipitationProbability !== null && !isNaN(precipitationProbability)
                ? formatters.percentage(precipitationProbability)
                : "0.0";
            return {
                dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                date: date.toLocaleDateString(),
                temperature: {
                    avg: day.values.temperatureAvg,
                    max: day.values.temperatureMax,
                    min: day.values.temperatureMin
                },
                weatherCode: day.values.weatherCode || day.values.weatherCodeMax,
                weatherDescription: getWeatherDescription(day.values.weatherCode || day.values.weatherCodeMax),
                icon: getWeatherIcon(day.values.weatherCode || day.values.weatherCodeMax), // Add weather icon
                sunrise: formatters.time(day.values.sunriseTime, lat, lon),
                sunset: formatters.time(day.values.sunsetTime, lat, lon),
                rainChance
            };
        });
    },
    // Fetch hourly forecast for today to fill in missing day parts
    async getHourlyForecastForToday(lat, lon) {
        const response = await this.fetchWeatherData(lat, lon, {
            timesteps: '1h',
            startTime: 'now',
            endTime: 'nowPlus1d',
            fields: ['temperature']
        });
        if (!response.timelines?.hourly || response.timelines.hourly.length === 0) {
            throw new Error('Hourly forecast data not found in response');
        }
        const dayPartForecasts = {
            morning: [],
            afternoon: [],
            evening: [],
            night: []
        };
        response.timelines.hourly.forEach(hour => {
            const date = new Date(hour.time);
            const utcHour = date.getUTCHours();
            const timezoneOffset = Math.round(lon / 15);
            const localHour = (utcHour + timezoneOffset + 24) % 24;
            const dayPart = getDayPart(localHour);
            dayPartForecasts[dayPart].push(hour.values.temperature);
        });
        const result = {};
        Object.keys(dayPartForecasts).forEach(part => {
            const temps = dayPartForecasts[part];
            result[part] = temps.length > 0
                ? parseFloat((temps.reduce((sum, temp) => sum + temp, 0) / temps.length).toFixed(1))
                : null;
        });
        return result;
    },
    // Fetch day part temperatures (morning, afternoon, evening, night)
    async getDayPartTemperatures(lat, lon) {
        const response = await this.fetchWeatherData(lat, lon, {
            timesteps: '1h',
            startTime: 'now',
            endTime: 'nowPlus7d',
            fields: ['temperature']
        });
        const hourlyData = response.timelines.hourly;
        if (!hourlyData || hourlyData.length === 0) {
            throw new Error('Hourly forecast data not found in response');
        }
        const dailyPartTemps = {};
        hourlyData.forEach(hour => {
            const date = new Date(hour.time);
            const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            const utcHour = date.getUTCHours();
            const timezoneOffset = Math.round(lon / 15);
            const localHour = (utcHour + timezoneOffset + 24) % 24;
            const dayPart = getDayPart(localHour);
            if (!dailyPartTemps[dayKey]) {
                dailyPartTemps[dayKey] = {
                    morning: { temps: [], avg: null },
                    afternoon: { temps: [], avg: null },
                    evening: { temps: [], avg: null },
                    night: { temps: [], avg: null }
                };
            }
            dailyPartTemps[dayKey][dayPart].temps.push(hour.values.temperature);
        });
        Object.keys(dailyPartTemps).forEach(day => {
            Object.keys(dailyPartTemps[day]).forEach(part => {
                const temps = dailyPartTemps[day][part].temps;
                if (temps.length > 0) {
                    dailyPartTemps[day][part].avg =
                        parseFloat((temps.reduce((sum, temp) => sum + temp, 0) / temps.length).toFixed(1));
                }
            });
        });
        return dailyPartTemps;
    },
    // Helper function to fetch weather data with retry logic
    async fetchWeatherData(lat, lon, params) {
        const retryFetch = async (retries = 3, delay = 1000) => {
            try {
                const response = await axios.get(TOMORROW_API_CONFIG.BASE_URL, {
                    params: {
                        location: `${lat},${lon}`,
                        apikey: TOMORROW_API_CONFIG.API_KEY,
                        units: 'metric',
                        ...params
                    },
                    headers: this.headers
                });
                return response.data;
            } catch (error) {
                if (retries > 0 && error.response?.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return retryFetch(retries - 1, delay * 2);
                }
                throw error;
            }
        };
        return retryFetch();
    }
};

// Controller to get weather data
export const getWeather = asyncHandler(async (req, res, next) => {
    try {
        // Extract latitude and longitude from request parameters
        const { lat, lon } = req.params;
        // Validate the coordinates
        if (!lat || !lon) {
            return res.status(400).json({
                error: 'Latitude and longitude are required in the request parameters'
            });
        }
        // Convert to numbers and validate ranges
        const latitude = Number(lat);
        const longitude = Number(lon);
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            return res.status(400).json({
                error: 'Invalid latitude value. Must be between -90 and 90'
            });
        }
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: 'Invalid longitude value. Must be between -180 and 180'
            });
        }
        // Check cache
        const cacheKey = `${latitude},${longitude}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 10 * 60 * 1000) {
            return res.status(200).json(cache[cacheKey].data);
        }
        // Fetch weather data
        const [current, dailyTemperatures, dayPartTemps, hourlyForecasts] = await Promise.all([
            weatherClient.getCurrentWeather(latitude, longitude),
            weatherClient.getWeatherForecast(latitude, longitude),
            weatherClient.getDayPartTemperatures(latitude, longitude),
            weatherClient.getHourlyForecastForToday(latitude, longitude)
        ]);
        // Get today's date formatted as YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        // Extract only current day's temperatures from dayPartTemps
        const currentDayTemps = dayPartTemps[today] || {};
        // Combine actual recorded temperatures with forecast temperatures for missing parts
        const currentDayTemperatures = {
            morning: currentDayTemps.morning?.avg || hourlyForecasts.morning || dailyTemperatures[0]?.temperature?.avg || null,
            afternoon: currentDayTemps.afternoon?.avg || hourlyForecasts.afternoon || dailyTemperatures[0]?.temperature?.avg || null,
            evening: currentDayTemps.evening?.avg || hourlyForecasts.evening || dailyTemperatures[0]?.temperature?.avg || null,
            night: currentDayTemps.night?.avg || hourlyForecasts.night || dailyTemperatures[0]?.temperature?.avg || null
        };

        const timeZone = tzlookup(latitude, longitude);
        
        const responseData = {
            location: timeZone,
            current,
            dailyTemperatures,
            currentDayTemperatures
        };
        // Update cache
        cache[cacheKey] = {
            timestamp: Date.now(),
            data: responseData
        };
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        if (error.response?.status === 429) {
            return res.status(429).json({
                error: 'Rate limit exceeded. Please try again later.'
            });
        }
        res.status(500).json({
            error: 'Failed to fetch weather data',
            details: error.response?.data || error.message
        });
    }
});