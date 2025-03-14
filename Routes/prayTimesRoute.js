import express from 'express';

import { getPrayTimes } from '../Controllers/prayTimeController.js';

const router = express.Router();

router.route('/:lat/:lon').get(getPrayTimes);

export default router;