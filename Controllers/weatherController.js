import asyncHandler from "express-async-handler";
import tzlookup from "tz-lookup";
import axios from "axios";
import dotenv from 'dotenv';
import { reverseGeocode } from "../Utils/geocode.js";

// Load environment variables
dotenv.config();

// Constants
const TOMORROW_API_CONFIG = {
    BASE_URL: 'https://api.tomorrow.io/v4/weather/forecast ',
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
        const value = speedInMS ? (speedInMS * 3.6).toFixed(1) : '0.0';
        return lang === 'ar' ? value.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : value;
    },
    percentage: (value, lang) => {
        const formatted = parseFloat(value ?? 0).toFixed(1);
        return lang === 'ar' ? formatted.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : formatted;
    },
    temperature: (value, lang) => {
        const formatted = parseFloat(value ?? 0).toFixed(1);
        return lang === 'ar' ? formatted.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : formatted;
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
            console.error('Error formatting time:', error.message);
            return lang === 'ar' ? 'خطأ في الوقت' : 'Time error';
        }
    }
};

// Get day part based on hour
const getDayPart = (hour, t) => {
    if (hour >= 5 && hour < 12) return t('weather.timeOfDay.morning') ?? 'Morning';
    if (hour >= 12 && hour < 17) return t('weather.timeOfDay.afternoon') ?? 'Afternoon';
    if (hour >= 17 && hour < 22) return t('weather.timeOfDay.evening') ?? 'Evening';
    return t('weather.timeOfDay.night') ?? 'Night';
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
    return descriptions[weatherCode] ?? t('weather.weatherDescription.Unknown') ?? 'Unknown';
};

// Map weather code to icon URL
const getWeatherIcon = (weatherCode) => {
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
        8000: weatherIcons.partlySunnyWithThunderstorms,
    };
    return iconMap[weatherCode] ?? weatherIcons.sunnyClearSky;
};

// Generate current weather description
const getCurrentWeatherDescription = (data, t, lang) => {
    const baseDescription = getWeatherDescription(data.weatherCode, t);
    let tempDescription = '';
    const temperature = parseFloat(data[t('weather.temperature')] ?? 0);
    if (temperature >= 30) {
        tempDescription = t('weather.weatherDescription.hot') ?? 'hot';
    } else if (temperature >= 20) {
        tempDescription = t('weather.weatherDescription.warm') ?? 'warm';
    } else if (temperature >= 10) {
        tempDescription = t('weather.weatherDescription.cool') ?? 'cool';
    } else {
        tempDescription = t('weather.weatherDescription.cold') ?? 'cold';
    }
    let precipDescription = '';
    const rainChance = parseFloat(data[t('weather.rainChance')] ?? 0);
    if (rainChance > 70) {
        precipDescription = t('weather.weatherDescription.high chance of precipitation') ?? 'high chance of precipitation';
    } else if (rainChance > 30) {
        precipDescription = t('weather.weatherDescription.moderate chance of precipitation') ?? 'moderate chance of precipitation';
    } else if (rainChance > 10) {
        precipDescription = t('weather.weatherDescription.slight chance of precipitation') ?? 'slight chance of precipitation';
    } else {
        precipDescription = t('weather.weatherDescription.dry conditions') ?? 'dry conditions';
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
    },

    async getCurrentWeather(lat, lon, t, lang) {
        const dailyResponse = await this.fetchWeatherData(lat, lon, {
            timesteps: 'daily',
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'sunriseTime', 'sunsetTime', 'weatherCode']
        });

        const dailyData = dailyResponse.timelines.daily[0]?.values;
        if (!dailyData) throw new Error(t('error.dailyWeatherDataNotFound') ?? 'Daily weather data not found');

        const minutelyResponse = await this.fetchWeatherData(lat, lon, {
            timesteps: 'minutely',
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'weatherCode']
        });

        const minutelyData = minutelyResponse.timelines.minutely[0]?.values;

        // Fetch hourly forecast to get current day's temperature variations
        const hourlyResponse = await this.fetchWeatherData(lat, lon, {
            timesteps: 'hourly',
            fields: ['temperature']
        });

        const currentDayTemperatures = {
            morning: null,
            afternoon: null,
            evening: null,
            night: null
        };

        hourlyResponse.timelines.hourly.forEach(hour => {
            const hourDate = new Date(hour.time);
            const hourOfDay = hourDate.getHours();
            const temp = hour.values.temperature;

            const partOfDay = getDayPart(hourOfDay, t); // Use existing helper function

            if (partOfDay === t('weather.timeOfDay.morning')) {
                currentDayTemperatures.morning = formatters.temperature(temp, lang);
            } else if (partOfDay === t('weather.timeOfDay.afternoon')) {
                currentDayTemperatures.afternoon = formatters.temperature(temp, lang);
            } else if (partOfDay === t('weather.timeOfDay.evening')) {
                currentDayTemperatures.evening = formatters.temperature(temp, lang);
            } else if (partOfDay === t('weather.timeOfDay.night')) {
                currentDayTemperatures.night = formatters.temperature(temp, lang);
            }
        });

        const weatherCode = minutelyData?.weatherCode ?? dailyData?.weatherCode ?? 1000;

        const currentData = {
            temperature: formatters.temperature(minutelyData?.temperature ?? 0, lang),
            windSpeed: formatters.windSpeed(minutelyData?.windSpeed ?? 0, lang),
            humidity: formatters.percentage(minutelyData?.humidity ?? 0, lang),
            rainChance: formatters.percentage(minutelyData?.precipitationProbability ?? 0, lang),
            sunrise: formatters.time(dailyData?.sunriseTime, lat, lon, lang),
            sunset: formatters.time(dailyData?.sunsetTime, lat, lon, lang),
            weatherCode: weatherCode,
            icon: getWeatherIcon(weatherCode),
        };

        return {
            ...currentData,
            [t('weather.description')]: getCurrentWeatherDescription(currentData, t, lang)
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
            const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' });
            const localizedDay = t(`weather.dayName.${dayKey}`) ?? dayKey;
            const precipitationProbability = day.values.precipitationProbability ?? 0;
            const rainChance = formatters.percentage(precipitationProbability, lang);
            return {
                dayName: localizedDay,
                date: date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'),
                temperature: {
                    avg: formatters.temperature(day.values.temperatureAvg ?? 0, lang),
                    max: formatters.temperature(day.values.temperatureMax ?? 0, lang),
                    min: formatters.temperature(day.values.temperatureMin ?? 0, lang)
                },
                weatherCode: day.values.weatherCode ?? day.values.weatherCodeMax ?? 1000,
                weatherDescription: getWeatherDescription(day.values.weatherCode ?? 1000, t),
                icon: getWeatherIcon(day.values.weatherCode ?? 1000),
                sunrise: formatters.time(day.values.sunriseTime, lat, lon, lang),
                sunset: formatters.time(day.values.sunsetTime, lat, lon, lang),
                rainChance
            };
        });
    }
};

// Controller to get weather data
export const getWeather = asyncHandler(async (req, res, next) => {
    let t = req.t || ((key) => key);
    try {
        // Extract language from query parameter (e.g., ?lng=en or ?lng=ar)
        const lang = req.query.lng || 'en'; // Default to English if no language is provided
        req.i18n.changeLanguage(lang); // Change language based on query parameter
        t = req.t; // i18next translation function

        // Extract latitude and longitude from request parameters
        const { lat, lon } = req.params;

        // Validate the coordinates
        if (!lat || !lon) {
            return res.status(400).json({
                error: t('error.missingCoordinates') ?? 'Missing coordinates'
            });
        }

        // Convert to numbers and validate ranges
        const latitude = Number(lat);
        const longitude = Number(lon);
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            return res.status(400).json({
                error: t('error.invalidLatitude') ?? 'Invalid latitude'
            });
        }
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: t('error.invalidLongitude') ?? 'Invalid longitude'
            });
        }

        // Check cache
        const cacheKey = `${latitude},${longitude},${lang}`;
        if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < 10 * 60 * 1000) {
            return res.status(200).json(cache[cacheKey].data);
        }

        // Fetch weather data
        const [current, dailyTemperatures] = await Promise.all([
            weatherClient.getCurrentWeather(latitude, longitude, t, lang),
            weatherClient.getWeatherForecast(latitude, longitude, t, lang)
        ]);

        const locationData = await reverseGeocode(latitude, longitude, lang);

        const hourlyResponse = await weatherClient.fetchWeatherData(latitude, longitude, {
            timesteps: 'hourly',
            fields: ['temperature']
        });

        const currentDayTemperatures = {
            morning: null,
            afternoon: null,
            evening: null,
            night: null
        };

        hourlyResponse.timelines.hourly.forEach(hour => {
            const hourDate = new Date(hour.time);
            const hourOfDay = hourDate.getHours();
            const temp = hour.values.temperature;

            const partOfDay = getDayPart(hourOfDay, t);

            if (partOfDay === t('weather.timeOfDay.morning')) {
                currentDayTemperatures.morning = formatters.temperature(temp, lang);
            } else if (partOfDay === t('weather.timeOfDay.afternoon')) {
                currentDayTemperatures.afternoon = formatters.temperature(temp, lang);
            } else if (partOfDay === t('weather.timeOfDay.evening')) {
                currentDayTemperatures.evening = formatters.temperature(temp, lang);
            } else if (partOfDay === t('weather.timeOfDay.night')) {
                currentDayTemperatures.night = formatters.temperature(temp, lang);
            }
        });

        const responseData = {
            location: `${locationData.city}, ${locationData.country}`,
            current,
            dailyTemperatures,
            currentDayTemperatures,  // Added here only
            direction: lang === 'ar' ? 'rtl' : 'ltr'
        };

        // Update cache
        cache[cacheKey] = {
            timestamp: Date.now(),
            data: responseData
        };
        console.log(responseData.current.windSpeed);

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        if (error.response?.status === 429) {
            return res.status(429).json({
                error: t('error.rateLimitExceeded') ?? 'Rate limit exceeded. Please try again later.'
            });
        }
        res.status(500).json({
            error: t('error.failedToFetchWeather') ?? 'Failed to fetch weather data',
            details: error.response?.data || error.message
        });
    }
});