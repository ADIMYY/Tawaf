// utils/geocoding.js
import axios from "axios";

export const reverseGeocode = async (lat, lon, lang) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${lang}`;
    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "TawaafApp/1.0 (contact@abdoadimy.com)"
            },
            timeout: 5000,
        });
        return {
            city: response.data.address.city || response.data.address.town || response.data.address.village,
            country: response.data.address.country,
        };
    } catch (error) {
        console.error("Reverse geocoding failed:", error.message);
        return { city: null, country: null }; // fallback
    }
};