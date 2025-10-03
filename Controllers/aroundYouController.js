import asyncHandler from "express-async-handler";
import AroundYou from "../Model/aroundYouModel.js";
import appError from "../Utils/appError.js";

// Format phone numbers for arabic script
const formatPhoneNumber = (phone, lang) => {
    if (lang !== 'ar' || !phone || phone === "Unavailable") return phone;

    return phone.replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
};

// Normalize city name for consistent translation keys
const normalizeCityName = (city) => {
    const mapping = { 'mekka': 'mecca', 'makkah': 'mecca', 'jeddah': 'jeddah' };
    const normalized = city.trim().toLowerCase();
    return mapping[normalized] || normalized;
};

// Generic translator for amenity lists (restaurants, cafes, etc.)
const translateAmenities = (amenities, type, t, lang) => {
    return amenities.map(item => ({
        _id: item._id,
        name: t(`aroundYou.${type}.${item._id}.name`, item.name),
        typeOfFood: item.typeOfFood
            ? t(`aroundYou.${type}.${item._id}.typeOfFood`, item.typeOfFood)
            : undefined,
        category: item.category
            ? t(`aroundYou.${type}.${item._id}.category`, item.category)
            : undefined,
        workSchedules: t(`aroundYou.${type}.${item._id}.workSchedules`, item.workSchedules),
        phone: item.phone ? formatPhoneNumber(item.phone, lang) : undefined,
        location: t(`aroundYou.${type}.${item._id}.location`, item.location),
        image: item.image,
        locationUrl: item.locationUrl,
    })).filter(Boolean); // Ensure no undefined items
};

// Translate full AroundYou document
const translateAroundYouData = (data, t, lang) => {
    const translated = [];

    for (const entry of data) {
        const cityKey = normalizeCityName(entry.city);

        translated.push({
            _id: entry._id,
            city: t(`aroundYou.cities.${cityKey}`, entry.city),
            restaurants: translateAmenities(entry.restaurants, 'restaurants', t, lang),
            cafes: translateAmenities(entry.cafes, 'cafes', t, lang),
            supermarkets: translateAmenities(entry.supermarkets, 'supermarkets', t, lang),
            hotels: translateAmenities(entry.hotels, 'hotels', t, lang),
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            __v: entry.__v,
        });
    }

    return translated;
};


export const getAroundYou = asyncHandler(async (req, res, next) => {
    const { city, lng: lang = 'en' } = req.query;

    // Use existing t function from i18next middleware
    const t = req.t || ((key) => key.split('.').pop()); // fallback: extract last part of key

    try {
        // Build case-insensitive query
        const query = city ? { city: new RegExp(`^${city}$`, 'i') } : {};

        const rawData = await AroundYou.find(query);
        if (!rawData.length) {
            return next(new appError(t('error.noDataFound', 'No data found for the specified city'), 404));
        }

        const translatedData = translateAroundYouData(rawData, t, lang);

        res.status(200).json({
            status: 'success',
            data: translatedData,
            direction: lang === 'ar' ? 'rtl' : 'ltr',
        });
    } catch (error) {
        console.error('AroundYou API Error:', error.message, error.stack);
        return next(new appError(
            t('error.failedToFetchData', 'Failed to fetch nearby data'),
            500
        ));
    }
});