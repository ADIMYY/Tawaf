import express from 'express';

import { getPrayTimes } from '../Controllers/prayTimeController.js';
import { protect } from '../Controllers/authController.js';

const router = express.Router();

router.route('/').get(protect, getPrayTimes);

export default router;