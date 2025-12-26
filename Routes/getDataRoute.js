import express from 'express';

import { 
    getDataFromQrcode,
    getUserByPassport ,
    getDataById,
    getDataByName,
} from '../Controllers/getDataController.js';

import {
    getDataByIdValidator,
    getDataByNameValidator,
    getDataFromQrcodeValidator,
    getUserByPassportValidator
} from '../Utils/validator/getDataValidator.js'

const router = express.Router();

router.get(
    '/Qrcode', 
    getDataFromQrcodeValidator , 
    getDataFromQrcode
);

router.get(
    '/passport/:passport', 
    getUserByPassportValidator , 
    getUserByPassport
);

router.get(
    '/id/:id', 
    getDataByIdValidator , 
    getDataById
);

router.post(
    '/name', 
    getDataByNameValidator , 
    getDataByName
);

export default router;