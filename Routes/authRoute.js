import express from 'express';

import { 
    signup, 
    login, 
    forgotPassword,
    verifyResetCodePassword,
    resetPassword,
    uploadImages,
    resizeImage,
} from '../Controllers/authController.js';

import { 
    signupValidator, 
    loginValidator,
    forgotPasswordValidator,
    verifyResetCodeValidator,
    resetPasswordValidator,
} from '../Utils/validator/authValidator.js';

const router = express.Router();

router.route('/signup')
    .post(uploadImages, resizeImage, signupValidator , signup);

router.route('/login')
    .post(loginValidator, login);

router.route('/forgotPassword')
    .post(forgotPasswordValidator, forgotPassword);

router.route('/verifyResetCode')
    .post(verifyResetCodeValidator, verifyResetCodePassword);

router.route('/resetpassword')
    .put(resetPasswordValidator, resetPassword);

export default router;