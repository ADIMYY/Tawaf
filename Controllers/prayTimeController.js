import asyncHandler from "express-async-handler";
import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';
import appError from "../Utils/appError.js";
import tzlookup from 'tz-lookup'; // To dynamically get the timezone based on coordinates

//! Helper function to format prayer times
const formatTime = (time, timeZone) => {
    return time
        ? time.toLocaleTimeString('en-US', { timeZone, hour12: true })
        : null;
};

//! Controller to get prayer times for any place based on latitude and longitude
export const getPrayTimes = asyncHandler(async (req, res, next) => {
    try {
        console.log(req.protocol);
        // Extract latitude and longitude from request parameters
        const latitude = parseFloat(req.params.lat);
        const longitude = parseFloat(req.params.lon);

        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude)) {
            return next(new appError('Invalid latitude or longitude provided', 400));
        }

        // Create coordinates object
        const coordinates = new Coordinates(latitude, longitude);

        // Determine the timezone for the given coordinates
        const timeZone = tzlookup(latitude, longitude);

        // Define calculation method for prayer times (Umm Al-Qura method)
        const params = CalculationMethod.UmmAlQura();

        // Calculate prayer times for today
        const today = new Date();
        const prayerTimes = new PrayerTimes(coordinates, today, params);

        // Format prayer times for response with the correct timezone
        const formattedPrayerTimes = {
            fajr: formatTime(prayerTimes.fajr, timeZone),
            sunrise: formatTime(prayerTimes.sunrise, timeZone),
            dhuhr: formatTime(prayerTimes.dhuhr, timeZone),
            asr: formatTime(prayerTimes.asr, timeZone),
            maghrib: formatTime(prayerTimes.maghrib, timeZone),
            isha: formatTime(prayerTimes.isha, timeZone),
        };

        // Send response
        res.status(200).json({
            status: 'success',
            data: {
                timeZone,
                prayerTimes: formattedPrayerTimes,
            },
        });
    } catch (error) {
        return next(new appError('Failed to calculate prayer times', 500));
    }
});