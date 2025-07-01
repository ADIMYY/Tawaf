import express from 'express';

import { 
    getDataFromQrcode,
    getUserByPassport ,
    getDataById,
} from '../Controllers/getDataController.js';

const router = express.Router();

router.get('/Qrcode', getDataFromQrcode);
router.get('/passport/:passport', getUserByPassport);
router.get('/id/:id', getDataById);

export default router;