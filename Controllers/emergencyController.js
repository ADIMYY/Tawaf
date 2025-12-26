import asyncHandler from "express-async-handler";
import Emergency from "../Model/emergencyModel.js";
import AppError from "../Utils/appError.js";

// Utility function to format phone numbers
const formatPhoneNumber = (phone, lang) => {
    if (lang !== 'ar' || !phone) return phone;
    return phone.replace(/[0-9]/g, digit => '٠١٢٣٤٥٦٧٨٩'[digit]);
};

// Generic translator for lists
const translateList = (items, type, t, lang) => {
    return items?.map(item => ({
        _id: item._id,
        name: t(`emergency.${type}.${item._id}.name`, item.name),
        location: t(`emergency.${type}.${item._id}.location`, item.location),
        phone: item.phone ? formatPhoneNumber(item.phone, lang) : nudefined,
        email: item.email || undefined,
        photo: item.photo || undefined,
        locationUrl: item.locationUrl || undefined,
    })) || [];
}

// Translate unified emergency numbers (like police hotlines)
const translateUnifiedNumbers = (numbers, t, lang) => {
    if (!numbers) return [];
    const translated = {};

    for (const [key, value] of Object.entries(numbers)) {
        if (key === '_id') continue;
        translated[key] = typeof value === 'string'
            ? formatPhoneNumber(value, lang)
            : value;
    }

    return { ...translated, _id: numbers._id };
};

// Translate ambulance service data
const translateAmbulance = (ambulance, t, lang) => {
    if (!ambulance) return {};
    return {
        saudi_red_crescent: ambulance.saudi_red_crescent ? {
            phone: formatPhoneNumber(ambulance.saudi_red_crescent.phone, lang),
            email: ambulance.saudi_red_crescent.email,
            photo: ambulance.saudi_red_crescent.photo,
            locationUrl: ambulance.saudi_red_crescent.locationUrl
        } : undefined,
        emergency_number: ambulance.emergency_number
            ? formatPhoneNumber(ambulance.emergency_number, lang)
            : undefined,
        _id: ambulance._id
    };
};

// translate full emergency data structure
const translateEmergencyData = (emergencies, t, lang) => {
    return emergencies.map(emergency => {
        const cityKey = `emergency.cities.${(emergency.city || '').toLowerCase()}`;
        const cityName = t(cityKey, emergency.city);

        const emergencyServices = emergency.emergency || {};

        return {
            _id: emergency._id,
            city: cityName,
            emergency: {
                hospitals: translateList(emergencyServices.hospitals, 'hospitals', t, lang),
                police: emergencyServices.police ? {
                    photo: emergencyServices.police.photo,
                    unified_numbers: emergencyServices.police.unified_numbers
                        ? translateUnifiedNumbers(emergencyServices.police.unified_numbers, t, lang)
                        : {},
                    stations: translateList(emergencyServices.police.stations, 'police.stations', t, lang),
                    _id: emergencyServices.police._id
                } : undefined,
                ambulance: translateAmbulance(emergencyServices.ambulance, t, lang),
                _id: emergencyServices._id
            },
            __v: emergency.__v,
            createdAt: emergency.createdAt,
            updatedAt: emergency.updatedAt
        };
    });
};

export const getAllEmergencies = asyncHandler(async (req, res, next) => {
    const { city, lang = 'en' } = req.query;

    // Use translation function from i18next; fallback to key extractor
    const t = req.t || ((key, defaultValue) => {
        const finalKey = Array.isArray(key) ? key[0] : key;
        return defaultValue || finalKey.split('.').pop();
    });

    try {
        // Build case-sensitive city filter
        const query = city
            ? { city: new RegExp(`^${city.trim()}`, 'i') }
            : {};

        const emergencies = await Emergency.find(query);

        if (!emergencies.length === 0) {
            return next(new AppError(
                t('error.noEmergenciesFound', 'No emergency data found for the specified city.'),
                404
            ));
        }

        const translatedData = translateEmergencyData(emergencies, t, lang);

        res.status(200).json({
            status: 'success',
            data: translatedData,
            direction: lang === 'ar' ? 'rtl' : 'ltr',
        })
    } catch (error) {
        console.error('Emergency API Error:', error.message, error.stack);
        return next(new AppError(
            t('error.failedToFetchEmergencies', 'Failed to fetch emergency data.'),
            500
        ));
    }
});