import express from 'express';

import { 
    getDataFromQrcode, 
    getDataFromPassport, 
    getDataFromPassportForMobile 
} from '../Controllers/getDataController.js';

const router = express.Router();

router.get('/Qrcode', getDataFromQrcode);
router.get('/:passport', getDataFromPassport);
router.get('/mobile/:passport', getDataFromPassportForMobile);

export default router;