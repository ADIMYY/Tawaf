import asyncHandler from 'express-async-handler';
import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';
import AppError from '../Utils/appError.js';
import tzlookup from 'tz-lookup';
import { reverseGeocode } from '../Utils/geocode.js';

// Format time based on locale and timezone
const formatTime = (date, timeZone, lang) => {
    if (!date || !timeZone) return null;

    try {
        return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone
        }).format(date);
    } catch (error) {
        console.warn('Time formatting failed:', error.message);
        return null;
    }
};

//Get prayer times for given coordinates
export const getPrayTimes = asyncHandler(async (req, res, next) => {
    // Extract query params
    const { lng: lang = 'en' } = req.query;

    // Safely use translation function
    const t = req.t || ((key, defaultValue) => {
        const k = Array.isArray(key) ? key[0] : key;
        return defaultValue || k.split('.').pop();
    });

    // Parse and validate coordinates
    const lat = parseFloat(req.params.lat);
    const lon = parseFloat(req.params.lon);

    if (isNaN(lat) || isNaN(lon)) {
        return next(new AppError(t('error.invalidCoordinates', 'Invalid latitude or longitude.'), 400));
    }

    if (lat < -90 || lat > 90) {
        return next(new AppError(t('error.invalidLatitude', 'Latitude must be between -90 and 90.'), 400));
    }

    if (lon < -180 || lon > 180) {
        return next(new AppError(t('error.invalidLongitude', 'Longitude must be between -180 and 180.'), 400));
    }

    let timeZone;
    try {
        timeZone = tzlookup(lat, lon);
    } catch (err) {
        return next(new AppError(t('error.timezoneNotFound', 'Could not determine timezone for these coordinates.'), 500));
    }

    // Set up calculation parameters (Umm Al-Qura method)
    const coordinates = new Coordinates(lat, lon);
    const params = CalculationMethod.UmmAlQura();
    const date = new Date(); // Today

    // Calculate prayer times
    const times = new PrayerTimes(coordinates, date, params);

    // Format response
    const formattedPrayerTimes = {
        [t('prayTimes.fajr')]: formatTime(times.fajr, timeZone, lang),
        [t('prayTimes.sunrise')]: formatTime(times.sunrise, timeZone, lang),
        [t('prayTimes.dhuhr')]: formatTime(times.dhuhr, timeZone, lang),
        [t('prayTimes.asr')]: formatTime(times.asr, timeZone, lang),
        [t('prayTimes.maghrib')]: formatTime(times.maghrib, timeZone, lang),
        [t('prayTimes.isha')]: formatTime(times.isha, timeZone, lang),
        [t('prayTimes.midnight')]: formatTime(times.midnight, timeZone, lang)
    };

    // Reverse geocode for human-readable location
    let locationLabel = `${lat.toFixed(4)}, ${lon.toFixed(4)}`; // Fallback
    try {
        const geoData = await reverseGeocode(lat, lon, lang);
        if (geoData && (geoData.city || geoData.region || geoData.country)) {
            locationLabel = [
                geoData.city,
                geoData.region,
                geoData.country
            ].filter(Boolean).join(', ');
        }
    } catch (error) {
        console.warn(`Reverse geocoding failed for [${lat}, ${lon}]:`, error.message);
    }

    // Success response
    res.status(200).json({
        status: 'success',
        data: {
            location: locationLabel,
            coordinates: { lat, lon },
            timeZone,
            calculationMethod: 'Umm Al-Qura',
            date: date.toISOString().split('T')[0],
            prayerTimes: formattedPrayerTimes
        },
        direction: lang === 'ar' ? 'rtl' : 'ltr'
    });
});