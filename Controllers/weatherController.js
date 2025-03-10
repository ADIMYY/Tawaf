import asyncHandler from "express-async-handler";
import axios from "axios";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const TOMORROW_API_CONFIG = {
    BASE_URL: 'https://api.tomorrow.io/v4/weather/forecast',
    API_KEY: process.env.WEATHER_API_KEY || 'OjVUTgatB1eWcTaiU6LQFmA4otnVT0uI',
};

// Utility functions
const formatters = {
    windSpeed: (speedInMS) => (speedInMS * 3.6).toFixed(1),
    percentage: (value) => parseFloat(value).toFixed(1),
    time: (isoString) => {
        if (!isoString) return null;
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (error) {
            console.error('Error formatting time:', error);
            return null;
        }
    }
};

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
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability', 'sunriseTime', 'sunsetTime']
        });

        const dailyData = response.timelines.daily[0]?.values;
        if (!dailyData) throw new Error('Daily weather data not found in response');

        const minutelyResponse = await this.fetchWeatherData(lat, lon, {
            timesteps: 'minutely',
            fields: ['temperature', 'windSpeed', 'humidity', 'precipitationProbability']
        });

        const minutelyData = minutelyResponse.timelines.minutely[0]?.values;

        return {
            temperature: minutelyData.temperature,
            windSpeed: formatters.windSpeed(minutelyData.windSpeed),
            humidity: formatters.percentage(minutelyData.humidity),
            rainChance: formatters.percentage(minutelyData.precipitationProbability),
            sunrise: formatters.time(dailyData.sunriseTime),
            sunset: formatters.time(dailyData.sunsetTime)
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
                weatherCode: day.values.weatherCodeMax,
                sunrise: formatters.time(day.values.sunriseTime),
                sunset: formatters.time(day.values.sunsetTime),
                rainChance
            };
        });
    },

    // Helper function to fetch weather data
    async fetchWeatherData(lat, lon, params) {
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
    }
};

// Controller to get weather data
export const getWeather = asyncHandler(async (req, res, next) => {
    try {
        // Extract latitude and longitude from request body
        const { lat, lon } = req.params;

        // Validate the coordinates
        if (!lat || !lon) {
            return res.status(400).json({
                error: 'Latitude and longitude are required in the request body'
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

        const [current, dailyTemperatures] = await Promise.all([
            weatherClient.getCurrentWeather(latitude, longitude),
            weatherClient.getWeatherForecast(latitude, longitude)
        ]);

        res.status(200).json({
            location: {
                lat: latitude,
                lon: longitude
            },
            current,
            dailyTemperatures
        });
    } catch (error) {
        console.error('Weather API Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to fetch weather data',
            details: error.response?.data || error.message
        });
    }
});