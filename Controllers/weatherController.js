import asyncHandler from "express-async-handler";
import tzlookup from "tz-lookup";
import axios from "axios";
import dotenv from 'dotenv';
import { reverseGeocode } from "../Utils/geocode.js";

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
    partlySunnyWithRain2: 'https://res.cloudinary.com/dyd5lvwhc/image/upload/v1744023693/7_hix73d.png',
};

// Utility functions
const formatters = {
    windSpeed: (speedInMS, lang) => {
        const value = (speedInMS * 3.6).toFixed(1);
        return lang === 'ar' ? value.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : value;
    },
    percentage: (value, lang) => {
        const formatted = parseFloat(value).toFixed(1);
        return lang === 'ar' ? formatted.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : formatted;
    },
    temperature: (value, lang) => {
        const formatted = parseFloat(value).toFixed(1);
        return lang === 'ar' ? formatted.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : formatted;
    },
    time: (isoString, lat, lon, lang) => {
        if (!isoString) return null;
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return null; // Fixed typo (Vaz -> return null)
            const timeZone = tzlookup(lat, lon);
            return date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                timeZone,
                hour12: true,
                hour: 'numeric',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting time:', error.message);
            return null;
        }
    }
};

// Weather code to description mapping
const getWeatherDescription = (weatherCode, t) => {
    const descriptions = {
        1000: t('weather.weatherDescription.Clear, sunny'),
        1100: t('weather.weatherDescription.Mostly clear'),
        1101: t('weather.weatherDescription.Partly cloudy'),
        1102: t('weather.weatherDescription.Mostly cloudy'),
        1001: t('weather.weatherDescription.Cloudy'),
        2000: t('weather.weatherDescription.Fog'),
        2100: t('weather.weatherDescription.Light fog'),
        4000: t('weather.weatherDescription.Drizzle'),
        4001: t('weather.weatherDescription.Rain'),
        4200: t('weather.weatherDescription.Light rain'),
        4201: t('weather.weatherDescription.Heavy rain'),
        5000: t('weather.weatherDescription.Snow'),
        5001: t('weather.weatherDescription.Flurries'),
        5100: t('weather.weatherDescription.Light snow'),
        5101: t('weather.weatherDescription.Heavy snow'),
        6000: t('weather.weatherDescription.Freezing drizzle'),
        6001: t('weather.weatherDescription.Freezing rain'),
        6200: t('weather.weatherDescription.Light freezing rain'),
        6201: t('weather.weatherDescription.Heavy freezing rain'),
        7000: t('weather.weatherDescription.Ice pellets'),
        7101: t('weather.weatherDescription.Heavy ice pellets'),
        7102: t('weather.weatherDescription.Light ice pellets'),
        8000: t('weather.weatherDescription.Thunderstorm'),
    };
    return descriptions[weatherCode] || t('weather.weatherDescription.Unknown');
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
    return iconMap[weatherCode] || weatherIcons.sunnyClearSky;
};

// Get day part based on hour
const getDayPart = (hour, t) => {
    if (hour >= 5 && hour < 12) return t('weather.timeOfDay.morning');
    if (hour >= 12 && hour < 17) return t('weather.timeOfDay.afternoon');
    if (hour >= 17 && hour < 22) return t('weather.timeOfDay.evening');
    return t('weather.timeOfDay.night');
};

// Generate current weather description
const getCurrentWeatherDescription = (data, t, lang) => {
    const baseDescription = getWeatherDescription(data.weatherCode, t);
    let tempDescription = '';
    const temperature = parseFloat(data[t('weather.temperature')]);
    if (temperature >= 30) {
        tempDescription = t('weather.weatherDescription.hot');
    } else if (temperature >= 20) {
        tempDescription = t('weather.weatherDescription.warm');
    } else if (temperature >= 10) {
        tempDescription = t('weather.weatherDescription.cool');
    } else {
        tempDescription = t('weather.weatherDescription.cold');
    }
    let precipDescription = '';
    const rainChance = parseFloat(data[t('weather.rainChance')]);
    if (rainChance > 70) {
        precipDescription = t('weather.weatherDescription.high chance of precipitation');
    } else if (rainChance > 30) {
        precipDescription = t('weather.weatherDescription.moderate chance of precipitation');
    } else if (rainChance > 10) {
        precipDescription = t('weather.weatherDescription.slight chance of precipitation');
    } else {
        precipDescription = t('weather.weatherDescription.dry conditions');
    }
    return lang === 'ar'
        ? `${baseDescription} مع درجات حرارة ${tempDescription} و${precipDescription}`
        : `${baseDescription} with ${tempDescription} temperatures and ${precipDescription}`;
};

// Cache for weather data
const cache = {};

// API client
const weatherClient = {
    headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'application/json'
    },
    async getCurrentWeather(lat, lon, t, lang) {
        const response = await this.fetchWeatherData(lat, lon, {
            timesteps: 'daily',
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'sunriseTime', 'sunsetTime', 'weatherCode']
        });
        const dailyData = response.timelines.daily[0]?.values;
        if (!dailyData) throw new Error(t('error.dailyWeatherDataNotFound') || 'Daily weather data not found');
        const minutelyResponse = await this.fetchWeatherData(lat, lon, {
            timesteps: 'minutely',
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'weatherCode']
        });
        const minutelyData = minutelyResponse.timelines.minutely[0]?.values;
        const weatherCode = minutelyData.weatherCode || dailyData.weatherCode;
        const currentData = {
            [t('weather.temperature')]: formatters.temperature(minutelyData.temperature, lang),
            [t('weather.windSpeed')]: formatters.windSpeed(minutelyData.windSpeed, lang),
            [t('weather.humidity')]: formatters.percentage(minutelyData.humidity, lang),
            [t('weather.rainChance')]: formatters.percentage(minutelyData.precipitationProbability, lang),
            [t('weather.sunrise')]: formatters.time(dailyData.sunriseTime, lat, lon, lang),
            [t('weather.sunset')]: formatters.time(dailyData.sunsetTime, lat, lon, lang),
            weatherCode: weatherCode,
            icon: getWeatherIcon(weatherCode),
        };
        return {
            ...currentData,
            [t('weather.description')]: getCurrentWeatherDescription(currentData, t, lang),
        };
    },
    async getWeatherForecast(lat, lon, t, lang) {
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
                ? formatters.percentage(precipitationProbability, lang)
                : lang === 'ar' ? "٠٫٠" : "0.0";
            return {
                [t('weather.dayName', { returnObjects: true })[date.toLocaleDateString('en-US', { weekday: 'long' })] || date.toLocaleDateString('en-US', { weekday: 'long' })]: {
                    date: date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'),
                    temperature: {
                        avg: formatters.temperature(day.values.temperatureAvg, lang),
                        max: formatters.temperature(day.values.temperatureMax, lang),
                        min: formatters.temperature(day.values.temperatureMin, lang)
                    },
                    weatherCode: day.values.weatherCode || day.values.weatherCodeMax,
                    [t('weather.description')]: getWeatherDescription(day.values.weatherCode || day.values.weatherCodeMax, t),
                    icon: getWeatherIcon(day.values.weatherCode || day.values.weatherCodeMax),
                    [t('weather.sunrise')]: formatters.time(day.values.sunriseTime, lat, lon, lang),
                    [t('weather.sunset')]: formatters.time(day.values.sunsetTime, lat, lon, lang),
                    [t('weather.rainChance')]: rainChance
                }
            };
        });
    },
    async getHourlyForecastForToday(lat, lon, t, lang) {
        const response = await this.fetchWeatherData(lat, lon, {
            timesteps: '1h',
            startTime: 'now',
            endTime: 'nowPlus1d',
            fields: ['temperature']
        });
        if (!response.timelines?.hourly || response.timelines.hourly.length === 0) {
            throw new Error(t('error.hourlyForecastDataNotFound') || 'Hourly forecast data not found');
        }
        const dayPartForecasts = {
            [t('weather.timeOfDay.morning')]: [],
            [t('weather.timeOfDay.afternoon')]: [],
            [t('weather.timeOfDay.evening')]: [],
            [t('weather.timeOfDay.night')]: []
        };
        response.timelines.hourly.forEach(hour => {
            const date = new Date(hour.time);
            const utcHour = date.getUTCHours();
            const timezoneOffset = Math.round(lon / 15);
            const localHour = (utcHour + timezoneOffset + 24) % 24;
            const dayPart = getDayPart(localHour, t);
            dayPartForecasts[dayPart].push(hour.values.temperature);
        });
        const result = {};
        Object.keys(dayPartForecasts).forEach(part => {
            const temps = dayPartForecasts[part];
            result[part] = temps.length > 0
                ? formatters.temperature(
                    (temps.reduce((sum, temp) => sum + temp, 0) / temps.length).toFixed(1),
                    lang
                  )
                : null;
        });
        return result;
    },
    async getDayPartTemperatures(lat, lon, t, lang) {
        const response = await this.fetchWeatherData(lat, lon, {
            timesteps: '1h',
            startTime: 'now',
            endTime: 'nowPlus7d',
            fields: ['temperature']
        });
        const hourlyData = response.timelines.hourly;
        if (!hourlyData || hourlyData.length === 0) {
            throw new Error(t('error.hourlyForecastDataNotFound') || 'Hourly forecast data not found');
        }
        const dailyPartTemps = {};
        hourlyData.forEach(hour => {
            const date = new Date(hour.time);
            const dayKey = date.toISOString().split('T')[0];
            const utcHour = date.getUTCHours();
            const timezoneOffset = Math.round(lon / 15);
            const localHour = (utcHour + timezoneOffset + 24) % 24;
            const dayPart = getDayPart(localHour, t);
            if (!dailyPartTemps[dayKey]) {
                dailyPartTemps[dayKey] = {
                    [t('weather.timeOfDay.morning')]: { temps: [], avg: null },
                    [t('weather.timeOfDay.afternoon')]: { temps: [], avg: null },
                    [t('weather.timeOfDay.evening')]: { temps: [], avg: null },
                    [t('weather.timeOfDay.night')]: { temps: [], avg: null }
                };
            }
            dailyPartTemps[dayKey][dayPart].temps.push(hour.values.temperature);
        });
        Object.keys(dailyPartTemps).forEach(day => {
            Object.keys(dailyPartTemps[day]).forEach(part => {
                const temps = dailyPartTemps[day][part].temps;
                if (temps.length > 0) {
                    dailyPartTemps[day][part].avg = formatters.temperature(
                        (temps.reduce((sum, temp) => sum + temp, 0) / temps.length).toFixed(1),
                        lang
                    );
                }
            });
        });
        return dailyPartTemps;
    },
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
        // Extract language from query parameter (e.g., ?lng=en or ?lng=ar)
        const lang = req.query.lng || 'en'; // Default to English if no language is provided
        req.i18n.changeLanguage(lang); // Change language based on query parameter
        const t = req.t; // i18next translation function

        // Extract latitude and longitude from request parameters
        const { lat, lon } = req.params;
        // Validate the coordinates
        if (!lat || !lon) {
            return res.status(400).json({
                error: t('error.missingCoordinates')
            });
        }
        // Convert to numbers and validate ranges
        const latitude = Number(lat);
        const longitude = Number(lon);
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            return res.status(400).json({
                error: t('error.invalidLatitude')
            });
        }
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: t('error.invalidLongitude')
            });
        }
        // Check cache
        const cacheKey = `${latitude},${longitude},${lang}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 10 * 60 * 1000) {
            return res.status(200).json(cache[cacheKey].data);
        }
        // Fetch weather data
        const [current, dailyTemperatures, dayPartTemps, hourlyForecasts] = await Promise.all([
            weatherClient.getCurrentWeather(latitude, longitude, t, lang),
            weatherClient.getWeatherForecast(latitude, longitude, t, lang),
            weatherClient.getDayPartTemperatures(latitude, longitude, t, lang),
            weatherClient.getHourlyForecastForToday(latitude, longitude, t, lang)
        ]);
        // Get today's date formatted as YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        // Extract only current day's temperatures from dayPartTemps
        const currentDayTemps = dayPartTemps[today] || {};
        // Combine actual recorded temperatures with forecast temperatures for missing parts
        const currentDayTemperatures = {
            [t('weather.timeOfDay.morning')]: currentDayTemps[t('weather.timeOfDay.morning')]?.avg || hourlyForecasts[t('weather.timeOfDay.morning')] || formatters.temperature(dailyTemperatures[0]?.temperature?.avg, lang) || null,
            [t('weather.timeOfDay.afternoon')]: currentDayTemps[t('weather.timeOfDay.afternoon')]?.avg || hourlyForecasts[t('weather.timeOfDay.afternoon')] || formatters.temperature(dailyTemperatures[0]?.temperature?.avg, lang) || null,
            [t('weather.timeOfDay.evening')]: currentDayTemps[t('weather.timeOfDay.evening')]?.avg || hourlyForecasts[t('weather.timeOfDay.evening')] || formatters.temperature(dailyTemperatures[0]?.temperature?.avg, lang) || null,
            [t('weather.timeOfDay.night')]: currentDayTemps[t('weather.timeOfDay.night')]?.avg || hourlyForecasts[t('weather.timeOfDay.night')] || formatters.temperature(dailyTemperatures[0]?.temperature?.avg, lang) || null
        };

        const locationData = await reverseGeocode(latitude, longitude, lang);
        
        const responseData = {
            location: `${locationData.city}, ${locationData.country}`,
            current,
            dailyTemperatures,
            currentDayTemperatures,
            direction: lang === 'ar' ? 'rtl' : 'ltr'
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
                error: t('error.rateLimitExceeded') || 'Rate limit exceeded. Please try again later.'
            });
        }
        res.status(500).json({
            error: t('error.failedToFetchWeather') || 'Failed to fetch weather data',
            details: error.response?.data || error.message
        });
    }
});