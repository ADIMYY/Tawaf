import asyncHandler from "express-async-handler";
import { PrayerTimes, CalculationMethod, Coordinates } from 'adhan';
import appError from "../Utils/appError.js";

//! Helper function to format prayer times
const formatTime = (time) => {
    return time
        ? time.toLocaleTimeString('en-GB', { timeZone: 'Asia/Riyadh', hour12: true })
        : null;
};

//! Controller to get prayer times
export const getPrayTimes = asyncHandler(async (req, res, next) => {
    // Parse latitude and longitude from environment variables
    const latitude = parseFloat(process.env.LAT);
    const longitude = parseFloat(process.env.LON);

    //! Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
        return next(new appError('Invalid latitude or longitude in environment variables', 400));
    }

    //! Create coordinates object
    const coordinates = new Coordinates(latitude, longitude);

    //! Define calculation method for prayer times
    const params = CalculationMethod.UmmAlQura();

    //! Calculate prayer times for today
    const today = new Date();
    const prayerTimes = new PrayerTimes(coordinates, today, params);

    //! Format prayer times for response
    const formattedPrayerTimes = {
        fajr: formatTime(prayerTimes.fajr),
        sunrise: formatTime(prayerTimes.sunrise),
        dhuhr: formatTime(prayerTimes.dhuhr),
        asr: formatTime(prayerTimes.asr),
        maghrib: formatTime(prayerTimes.maghrib),
        isha: formatTime(prayerTimes.isha),
    };

    //! Send response
    res.status(200).json({
        status: 'success',
        data: formattedPrayerTimes,
    });
});