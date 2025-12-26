import axios from "axios";

const geocodeCache = new Map();
const cache_TTS_MS = 10 * 60 * 1000; // 10 minutes

export const reverseGeocode = async (lat, lon, lang = 'en') => {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        throw new Error('Invalid latitude or longitude');
    }

    const cleanLang = lang?.substring(0, 2).toLowerCase() || 'en';

    const cacheKey = `${lat.toFixed(6)},${lon.toFixed(6)},${cleanLang}`;
    const now = Date.now();

    if (geocodeCache.has(cacheKey)) {
        const cached = geocodeCache.get(cacheKey);
        if (now - cached.timestamp < cache_TTS_MS) {
            return { city: cached.city, country: cached.country };
        }
        geocodeCache.delete(cacheKey); // expired
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${lang}`;
    
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "TawaafApp/1.0 (+https://tawaf-sooty.vercel.app; contact@abdoadimy.com)"
            },
            timeout: 5000,
        });
        
        const address = response.data.address || {};

        const city = 
            address.city || 
            address.town || 
            address.village || 
            address.hamlet || 
            address.suburb || 
            address.neighborhood ||
            null;

        const country = address.country || null;

        geocodeCache.set(cacheKey, {
            city,
            country,
            timestamp: now,
        });

        return { city, country };
        
    } catch (error) {
        console.error("Reverse geocoding failed:", error.message);
        return { city: null, country: null }; // fallback
    }
};