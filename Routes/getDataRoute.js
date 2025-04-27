import express from 'express';

import { 
    getDataFromQrcode,
    getUserByPassport 
} from '../Controllers/getDataController.js';

const router = express.Router();

router.get('/Qrcode', getDataFromQrcode);
router.get('/:passport', getUserByPassport);

export default router;