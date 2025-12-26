import express from 'express';

import { getWeather } from '../Controllers/weatherController.js';
import { weatherValidator } from '../Utils/validator/weatherValidator.js';

const router = express.Router();

router.route('/:lat/:lon')
    .get(
        weatherValidator, 
        getWeather
    );

export default router;