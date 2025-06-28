import i18next from "i18next";
import backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

i18next
    .use(backend)
    .use(middleware.LanguageDetector)
    .init({
        backend: {
            loadPath: path.join(__dirname, 'locales/{{lng}}/{{ns}}.json'),
        },
        fallbackLng: "en",
        preload: ["en", "ar"],
        ns: ["translation", "aroundYou"], // Add aroundYou namespace
        defaultNS: "translation",
        detection: {
            order: ["querystring", "header"],
            lookupQuerystring: "lng",
        },
        debug: process.env.NODE_ENV === 'development', // Enable debug in development
    });

export default i18next;