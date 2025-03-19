import express from 'express';

import { getDataFromQrcode, getDataFromPassport } from '../Controllers/getDataController.js';

const router = express.Router();

router.get('/Qrcode', getDataFromQrcode);
router.get('/:passport', getDataFromPassport);

export default router;