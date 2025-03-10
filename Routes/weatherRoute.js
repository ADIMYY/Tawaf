import express from 'express';

import { getWeather } from '../Controllers/weatherController.js';
import { protect } from '../Controllers/authController.js';

const router = express.Router();

router.route('/:lat/:lon').get(protect, getWeather);

export default router;