import asyncHandler from "express-async-handler";
import AroundYou from "../Model/aroundYouModel.js";
import appError from "../Utils/appError.js";

// Utility function to format phone numbers
const formatPhoneNumber = (phone, lang) => {
    if (lang === 'ar' && phone !== "Unavailable") {
        return phone.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
    return phone;
};

// Utility function to translate AroundYou data
const translateAroundYouData = (aroundYouData, t, lang) => {
    return aroundYouData.map(data => ({
        _id: data._id,
        city: t(`aroundYou.cities.${data.city.toLowerCase().replace('mekka', 'mecca')}`, data.city),
        restaurants: data.restaurants.map(restaurant => ({
            name: t(`aroundYou.restaurants.${restaurant._id}.name`, restaurant.name),
            typeOfFood: t(`aroundYou.restaurants.${restaurant._id}.typeOfFood`, restaurant.typeOfFood),
            workSchedules: t(`aroundYou.restaurants.${restaurant._id}.workSchedules`, restaurant.workSchedules),
            phone: formatPhoneNumber(restaurant.phone, lang),
            location: t(`aroundYou.restaurants.${restaurant._id}.location`, restaurant.location),
            image: restaurant.image,
            locationUrl: restaurant.locationUrl,
            _id: restaurant._id
        })),
        cafes: data.cafes.map(cafe => ({
            name: t(`aroundYou.cafes.${cafe._id}.name`, cafe.name),
            workSchedules: t(`aroundYou.cafes.${cafe._id}.workSchedules`, cafe.workSchedules),
            phone: formatPhoneNumber(cafe.phone, lang),
            location: t(`aroundYou.cafes.${cafe._id}.location`, cafe.location),
            image: cafe.image,
            locationUrl: cafe.locationUrl,
            _id: cafe._id
        })),
        supermarkets: data.supermarkets.map(supermarket => ({
            name: t(`aroundYou.supermarkets.${supermarket._id}.name`, supermarket.name),
            workSchedules: t(`aroundYou.supermarkets.${supermarket._id}.workSchedules`, supermarket.workSchedules),
            phone: formatPhoneNumber(supermarket.phone, lang),
            location: t(`aroundYou.supermarkets.${supermarket._id}.location`, supermarket.location),
            image: supermarket.image,
            locationUrl: supermarket.locationUrl,
            _id: supermarket._id
        })),
        hotels: data.hotels.map(hotel => ({
            name: t(`aroundYou.hotels.${hotel._id}.name`, hotel.name),
            category: t(`aroundYou.hotels.${hotel._id}.category`, hotel.category),
            phone: formatPhoneNumber(hotel.phone, lang),
            location: t(`aroundYou.hotels.${hotel._id}.location`, hotel.location),
            image: hotel.image,
            locationUrl: hotel.locationUrl,
            _id: hotel._id
        })),
        __v: data.__v,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
    }));
};

export const getAroundYou = asyncHandler(async (req, res, next) => {
    // Set up translation
    let t = (key) => key; // Fallback translation function
    const lang = req.query.lng || 'en';
    try {
        if (req.i18n && req.t) {
            req.i18n.changeLanguage(lang);
            t = req.t;
        } else {
            console.warn('i18next middleware not properly initialized');
        }

        // Build query based on city parameter (case-insensitive)
        const query = req.query.city ? { city: new RegExp(`^${req.query.city}$`, 'i') } : {};
        const aroundYouData = await AroundYou.find(query);

        if (!aroundYouData || aroundYouData.length === 0) {
            return next(new appError(t('error.noDataFound'), 404));
        }

        // Translate the data
        const translatedData = translateAroundYouData(aroundYouData, t, lang);

        res.status(200).json({
            status: 'success',
            data: translatedData,
            direction: lang === 'ar' ? 'rtl' : 'ltr'
        });
    } catch (error) {
        console.error('AroundYou API Error:', error.message);
        return next(new appError(t('error.failedToFetchData') || 'Failed to fetch data', 500));
    }
});