import asyncHandler from "express-async-handler";
import Emergency from "../Model/emergencyModel.js";
import appError from "../Utils/appError.js";

// Utility function to format phone numbers
const formatPhoneNumber = (phone, lang) => {
    if (lang === 'ar') {
        return phone.replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
    return phone;
};

// Utility function to translate emergency data
const translateEmergencyData = (emergencies, t, lang) => {
    return emergencies.map(emergency => ({
        _id: emergency._id,
        city: t(`emergency.cities.${emergency.city.toLowerCase()}`, emergency.city),
        emergency: {
            hospitals: emergency.emergency.hospitals.map(hospital => ({
                name: t(`emergency.hospitals.${hospital._id}.name`, hospital.name),
                location: t(`emergency.hospitals.${hospital._id}.location`, hospital.location),
                phone: formatPhoneNumber(hospital.phone, lang),
                email: hospital.email,
                photo: hospital.photo,
                locationUrl: hospital.locationUrl,
                _id: hospital._id
            })),
            police: {
                photo: emergency.emergency.police.photo,
                unified_numbers: {
                    security_patrols: formatPhoneNumber(emergency.emergency.police.unified_numbers.security_patrols, lang),
                    civil_defense: formatPhoneNumber(emergency.emergency.police.unified_numbers.civil_defense, lang),
                    road_security: formatPhoneNumber(emergency.emergency.police.unified_numbers.road_security, lang),
                    traffic: formatPhoneNumber(emergency.emergency.police.unified_numbers.traffic, lang),
                    passport: formatPhoneNumber(emergency.emergency.police.unified_numbers.passport, lang),
                    drug_control: formatPhoneNumber(emergency.emergency.police.unified_numbers.drug_control, lang),
                    water_emergency: formatPhoneNumber(emergency.emergency.police.unified_numbers.water_emergency, lang),
                    electricity_emergency: formatPhoneNumber(emergency.emergency.police.unified_numbers.electricity_emergency, lang),
                    _id: emergency.emergency.police.unified_numbers._id
                },
                stations: emergency.emergency.police.stations.map(station => ({
                    name: t(`emergency.police.stations.${station._id}.name`, station.name),
                    location: t(`emergency.police.stations.${station._id}.location`, station.location),
                    phone: formatPhoneNumber(station.phone, lang),
                    locationUrl: station.locationUrl,
                    _id: station._id
                })),
                _id: emergency.emergency.police._id
            },
            ambulance: {
                saudi_red_crescent: {
                    phone: formatPhoneNumber(emergency.emergency.ambulance.saudi_red_crescent.phone, lang),
                    email: emergency.emergency.ambulance.saudi_red_crescent.email,
                    photo: emergency.emergency.ambulance.saudi_red_crescent.photo,
                    locationUrl: emergency.emergency.ambulance.saudi_red_crescent.locationUrl
                },
                emergency_number: formatPhoneNumber(emergency.emergency.ambulance.emergency_number, lang),
                _id: emergency.emergency.ambulance._id
            },
            _id: emergency.emergency._id
        },
        __v: emergency.__v
    }));
};

export const getAllEmergencies = asyncHandler(async (req, res, next) => {
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

        // Build query based on city parameter
        const query = req.query.city ? { city: req.query.city } : {};
        const emergencies = await Emergency.find(query);

        if (!emergencies || emergencies.length === 0) {
            return next(new appError(t('error.noEmergenciesFound'), 404));
        }

        // Translate the emergency data
        const translatedEmergencies = translateEmergencyData(emergencies, t, lang);

        res.status(200).json({
            status: 'success',
            data: translatedEmergencies,
            direction: lang === 'ar' ? 'rtl' : 'ltr'
        });
    } catch (error) {
        console.error('Emergency API Error:', error.message);
        return next(new appError(t('error.failedToFetchEmergencies') || 'Failed to fetch emergency data', 500));
    }
});