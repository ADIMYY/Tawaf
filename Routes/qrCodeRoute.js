import express from 'express';

import { getDataFromQrcode } from '../Controllers/qrcodeController.js';

const router = express.Router();

router.get('/', getDataFromQrcode);

export default router;