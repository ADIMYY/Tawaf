// controllers/weatherController.js
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import tzlookup from 'tz-lookup';
import AppError from '../Utils/appError.js';
import { reverseGeocode } from '../Utils/geocode.js';

// =======================
// Constants
// =======================
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'OjVUTgatB1eWcTaiU6LQFmA4otnVT0uI';
const TOMORROW_BASE_URL = 'https://api.tomorrow.io/v4/weather/forecast';

// Trim any accidental whitespace from URLs
const weatherIcons = {
    snowyWindyClouds: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023691/1_zwgvxp.png',
    partlySunnyWithRain: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023690/2_gqgpf3.png',
    partlySunnyWithThunderstorms: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023693/3_zzuqh3.png',
    cloudyWithSnow: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023692/4_lu5a3x.png',
    sunnyClearSky: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023693/5_lzbeao.png',
    overcastClouds: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023692/6_pon5zm.png',
    partlySunnyWithRain2: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023693/7_hix73d.png'
};

// In-memory cache with TTL (prevent memory leaks)
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const weatherCache = new Map();

// Utility: Safe translation fallback
const safeT = (t, key, defaultValue) => {
    if (typeof t === 'function') {
        const result = t(key);
        if (result && result !== key) return result;
    }
    return defaultValue || (Array.isArray(key) ? key[0] : key).split('.').pop();
};

// =======================
// Formatter Utilities
// =======================
const formatters = {
    windSpeed: (speedInMS, lang) => {
        const value = speedInMS ? (speedInMS * 3.6).toFixed(1) : '0.0';
        return lang === 'ar' ? value.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : value;
    },
    percentage: (value, lang) => {
        const formatted = parseFloat(value ?? 0).toFixed(1);
        return lang === 'ar' ? formatted.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : formatted;
    },
    temperature: (value, lang) => {
        const formatted = parseFloat(value ?? 0).toFixed(1);
        return lang === 'ar' ? formatted.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : formatted;
    },
    time: (isoString, lat, lon, lang) => {
        if (!isoString) return lang === 'ar' ? '—' : '--';
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return lang === 'ar' ? 'غير معروف' : 'Unknown';
            const timeZone = tzlookup(lat, lon);
            return date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                timeZone,
                hour12: true,
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch (error) {
            console.warn('Time formatting failed:', error.message);
            return lang === 'ar' ? 'خطأ' : 'Error';
        }
    }
};

// =======================
// Get Day Part (Morning, Afternoon, etc.)
// =======================
const getDayPart = (hour, t) => {
    if (hour >= 5 && hour < 12) return safeT(t, 'weather.timeOfDay.morning', 'Morning');
    if (hour >= 12 && hour < 17) return safeT(t, 'weather.timeOfDay.afternoon', 'Afternoon');
    if (hour >= 17 && hour < 22) return safeT(t, 'weather.timeOfDay.evening', 'Evening');
    return safeT(t, 'weather.timeOfDay.night', 'Night');
};

// =======================
// Weather Code Mapping
// =======================
const getWeatherDescription = (code, t) => {
    const map = {
        1000: safeT(t, 'weather.weatherDescription.Clear, sunny', 'Clear, sunny'),
        1100: safeT(t, 'weather.weatherDescription.Mostly clear', 'Mostly clear'),
        1101: safeT(t, 'weather.weatherDescription.Partly cloudy', 'Partly cloudy'),
        1102: safeT(t, 'weather.weatherDescription.Mostly cloudy', 'Mostly cloudy'),
        1001: safeT(t, 'weather.weatherDescription.Cloudy', 'Cloudy'),
        2000: safeT(t, 'weather.weatherDescription.Fog', 'Fog'),
        2100: safeT(t, 'weather.weatherDescription.Light fog', 'Light fog'),
        4000: safeT(t, 'weather.weatherDescription.Drizzle', 'Drizzle'),
        4001: safeT(t, 'weather.weatherDescription.Rain', 'Rain'),
        4200: safeT(t, 'weather.weatherDescription.Light rain', 'Light rain'),
        4201: safeT(t, 'weather.weatherDescription.Heavy rain', 'Heavy rain'),
        5000: safeT(t, 'weather.weatherDescription.Snow', 'Snow'),
        5001: safeT(t, 'weather.weatherDescription.Flurries', 'Flurries'),
        5100: safeT(t, 'weather.weatherDescription.Light snow', 'Light snow'),
        5101: safeT(t, 'weather.weatherDescription.Heavy snow', 'Heavy snow'),
        6000: safeT(t, 'weather.weatherDescription.Freezing drizzle', 'Freezing drizzle'),
        6001: safeT(t, 'weather.weatherDescription.Freezing rain', 'Freezing rain'),
        6200: safeT(t, 'weather.weatherDescription.Light freezing rain', 'Light freezing rain'),
        6201: safeT(t, 'weather.weatherDescription.Heavy freezing rain', 'Heavy freezing rain'),
        7000: safeT(t, 'weather.weatherDescription.Ice pellets', 'Ice pellets'),
        7101: safeT(t, 'weather.weatherDescription.Heavy ice pellets', 'Heavy ice pellets'),
        7102: safeT(t, 'weather.weatherDescription.Light ice pellets', 'Light ice pellets'),
        8000: safeT(t, 'weather.weatherDescription.Thunderstorm', 'Thunderstorm')
    };
    return map[code] || safeT(t, 'weather.weatherDescription.Unknown', 'Unknown');
};

const getWeatherIcon = (code) => {
    const iconMap = {
        1000: weatherIcons.sunnyClearSky,
        1100: weatherIcons.partlySunnyWithRain2,
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
        8000: weatherIcons.partlySunnyWithThunderstorms
    };
    return iconMap[code] || weatherIcons.sunnyClearSky;
};

// =======================
// Generate Current Weather Summary
// =======================
const getCurrentWeatherSummary = (data, t, lang) => {
    const baseDesc = getWeatherDescription(data.weatherCode, t);
    const temp = parseFloat(data.temperature?.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]) || 0);
    const rainChance = parseFloat(data.rainChance?.replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]) || 0);

    let tempDesc = temp >= 30 ? 'hot' :
                    temp >= 20 ? 'warm' :
                    temp >= 10 ? 'cool' : 'cold';
    tempDesc = safeT(t, `weather.temp.${tempDesc}`, tempDesc);

    let precipDesc = rainChance > 70 ? 'high chance of precipitation' :
                    rainChance > 30 ? 'moderate chance of precipitation' :
                    rainChance > 10 ? 'slight chance of precipitation' : 'dry conditions';
    precipDesc = safeT(t, `weather.precip.${precipDesc}`, precipDesc);

    return lang === 'ar'
        ? `${baseDesc} مع درجات حرارة ${tempDesc} و${precipDesc}`
        : `${baseDesc} with ${tempDesc} temperatures and ${precipDesc}`;
};

// =======================
// Weather Service Client
// =======================
class WeatherClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: TOMORROW_BASE_URL,
            headers: { 'Accept': 'application/json' }
        });
    }

    async fetch(params, retries = 3) {
        try {
            const response = await this.client.get('', {
                params: { apikey: this.apiKey, ...params },
                timeout: 10000
            });
            return response.data;
        } catch (error) {
            if (retries > 0 && error.response?.status === 429) {
                const delay = 1000 * Math.pow(2, 3 - retries);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetch(params, retries - 1);
            }
            throw error;
        }
    }

    async getCurrentAndForecast(lat, lon, t, lang) {
        const [hourlyRes, dailyRes] = await Promise.all([
            this.fetch({
                location: `${lat},${lon}`,
                timesteps: 'hourly',
                fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'weatherCode'],
                startTime: 'now',
                endTime: 'nowPlus24h'
            }),
            this.fetch({
                location: `${lat},${lon}`,
                timesteps: 'daily',
                fields: [
                    'temperatureAvg', 'temperatureMax', 'temperatureMin',
                    'sunriseTime', 'sunsetTime', 'precipitationProbability', 'weatherCode'
                ],
                startTime: 'now',
                endTime: 'nowPlus7d'
            })
        ]);

        const now = new Date();
        const currentHour = now.getHours();
        const timeZone = tzlookup(lat, lon);

        // Extract current values
        const currentValues = hourlyRes.timelines.hourly[0]?.values || {};
        const dailyValues = dailyRes.timelines.daily[0]?.values || {};

        const current = {
            temperature: formatters.temperature(currentValues.temperature, lang),
            windSpeed: formatters.windSpeed(currentValues.windSpeed, lang),
            humidity: formatters.percentage(currentValues.humidity, lang),
            rainChance: formatters.percentage(currentValues.precipitationProbability, lang),
            sunrise: formatters.time(dailyValues.sunriseTime, lat, lon, lang),
            sunset: formatters.time(dailyValues.sunsetTime, lat, lon, lang),
            weatherCode: currentValues.weatherCode || dailyValues.weatherCode || 1000,
            icon: getWeatherIcon(currentValues.weatherCode || 1000)
        };

        // Parse hourly data for day parts
        const currentDayTemperatures = { morning: null, afternoon: null, evening: null, night: null };
        for (const hour of hourlyRes.timelines.hourly) {
            const h = new Date(hour.time).getHours();
            const part = getDayPart(h, t);
            const temp = formatters.temperature(hour.values.temperature, lang);

            if (part === safeT(t, 'weather.timeOfDay.morning')) currentDayTemperatures.morning = temp;
            else if (part === safeT(t, 'weather.timeOfDay.afternoon')) currentDayTemperatures.afternoon = temp;
            else if (part === safeT(t, 'weather.timeOfDay.evening')) currentDayTemperatures.evening = temp;
            else if (part === safeT(t, 'weather.timeOfDay.night')) currentDayTemperatures.night = temp;
        }

        // Build forecast
        const dailyTemperatures = dailyRes.timelines.daily.map(day => {
            const date = new Date(day.time);
            const dayName = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' }).format(date);
            const localizedDay = safeT(t, `weather.dayName.${dayName}`, dayName);
            return {
                dayName: localizedDay,
                date: date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'),
                temperature: {
                    avg: formatters.temperature(day.values.temperatureAvg, lang),
                    max: formatters.temperature(day.values.temperatureMax, lang),
                    min: formatters.temperature(day.values.temperatureMin, lang)
                },
                weatherCode: day.values.weatherCode || 1000,
                weatherDescription: getWeatherDescription(day.values.weatherCode, t),
                icon: getWeatherIcon(day.values.weatherCode),
                sunrise: formatters.time(day.values.sunriseTime, lat, lon, lang),
                sunset: formatters.time(day.values.sunsetTime, lat, lon, lang),
                rainChance: formatters.percentage(day.values.precipitationProbability, lang)
            };
        });

        return {
            current: {
                ...current,
                description: getCurrentWeatherSummary(current, t, lang)
            },
            currentDayTemperatures,
            dailyTemperatures
        };
    }
}

// =======================
// Controller: Get Weather
// =======================
export const getWeather = asyncHandler(async (req, res, next) => {
    const { lat, lon } = req.params;
    const lang = req.query.lng || 'en';
    const t = req.t || ((key) => key); // Fallback translator

    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (!lat || !lon || isNaN(latitude) || isNaN(longitude)) {
        return next(new AppError(safeT(t, 'error.missingCoordinates', 'Missing or invalid coordinates'), 400));
    }

    if (latitude < -90 || latitude > 90) {
        return next(new AppError(safeT(t, 'error.invalidLatitude', 'Invalid latitude'), 400));
    }

    if (longitude < -180 || longitude > 180) {
        return next(new AppError(safeT(t, 'error.invalidLongitude', 'Invalid longitude'), 400));
    }

    // Check cache
    const cacheKey = `${latitude},${longitude},${lang}`;
    const cached = weatherCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return res.status(200).json(cached.data);
    }

    try {
        // Initialize client
        const weatherClient = new WeatherClient(WEATHER_API_KEY);
        const { current, currentDayTemperatures, dailyTemperatures } = await weatherClient.getCurrentAndForecast(
            latitude, longitude, t, lang
        );

        // Reverse geocode
        let locationStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
            const geoData = await reverseGeocode(latitude, longitude, lang);
            if (geoData.city || geoData.country) {
                locationStr = [geoData.city, geoData.country].filter(Boolean).join(', ');
            }
        } catch (err) {
            console.warn(`Geocoding failed for [${latitude}, ${longitude}]:`, err.message);
        }

        // Prepare response
        const responseData = {
            location: locationStr,
            current,
            currentDayTemperatures,
            dailyTemperatures,
            direction: lang === 'ar' ? 'rtl' : 'ltr'
        };

        // Cache response
        weatherCache.set(cacheKey, {
            timestamp: now,
            ...responseData
        });

        // Cleanup old entries (optional)
        if (weatherCache.size > 100) {
            const firstKey = weatherCache.keys().next().value;
            weatherCache.delete(firstKey);
        }

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            return next(new AppError(safeT(t, 'error.invalidApiKey', 'Weather service configuration error.'), 500));
        }
        if (error.response?.status === 429) {
            return next(new AppError(safeT(t, 'error.rateLimitExceeded', 'Too many requests. Please try again later.'), 429));
        }
        return next(new AppError(safeT(t, 'error.failedToFetchWeather', 'Failed to retrieve weather data.'), 500));
    }
});