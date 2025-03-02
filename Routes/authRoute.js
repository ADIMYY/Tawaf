import express from 'express';

import { 
    signup, 
    login, 
    forgotPassword,
    verifyResetCodePassword,
    resetPassword,
    uploadUserImage,
    resizeImage,
} from '../Controllers/authController.js';

import { signupValidator, loginValidator } from '../Utils/validator/authValidatir.js';

const router = express.Router();

router.route('/signup').post(uploadUserImage, resizeImage, signupValidator , signup);
router.post('/login', loginValidator , login);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyResetCode', verifyResetCodePassword);
router.put('/resetpassword', resetPassword);

export default router;