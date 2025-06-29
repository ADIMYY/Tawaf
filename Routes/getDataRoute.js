import express from 'express';

import { 
    getDataFromQrcode,
    getUserByPassport ,
    getDataById,
} from '../Controllers/getDataController.js';

const router = express.Router();

router.get('/Qrcode', getDataFromQrcode);
router.get('/:passport', getUserByPassport);
router.get('/:id', getDataById);

export default router;