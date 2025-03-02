import express from 'express';

import { getWeather } from '../Controllers/weatherController.js';
import { protect } from '../Controllers/authController.js';

const router = express.Router();

router.route('/').get(protect, getWeather);

export default router;