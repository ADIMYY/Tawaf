import express from 'express';

import { getPrayTimes } from '../Controllers/prayTimeController.js';
import { protect } from '../Controllers/authController.js';

const router = express.Router();

router.route('/:lat/:lon').get(protect, getPrayTimes);

export default router;