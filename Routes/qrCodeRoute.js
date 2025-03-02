import express from 'express';

import { getDataFromQrcode, getDataFromPassport } from '../Controllers/qrcodeController.js';

const router = express.Router();

router.get('/Qrcode', getDataFromQrcode);
router.get('/', getDataFromPassport);

export default router;