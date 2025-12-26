import express from 'express';

import { getPrayTimes } from '../Controllers/prayTimeController.js';
import { prayTimesValidator } from '../Utils/validator/prayTimesValidator.js';

const router = express.Router();

router.get(
    '/:lat/:lon', 
    prayTimesValidator, 
    getPrayTimes
);

export default router;