import slugify from 'slugify';
import { check, body } from 'express-validator';

import validatorMiddleware from '../../Middleware/validatorMiddleware.js';
import User from '../../Model/userModel.js';



export const signupValidator = [
    body('name')
        .notEmpty()
        .withMessage('User Name Required')
        .isLength({ min: 3 })
        .withMessage('Too short user name')
        .custom((val, {req}) => {
            req.body.slug = slugify(val);
            return true;
        }),
    check('email')
        .notEmpty()
        .withMessage('Email required')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom(async (val) => {
            await User.findOne({ email: val }).then(user => {
                if (user) {
                    throw new Error('E-mail already in use');
                }
            });
            return true;
        }),
    check('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('password must be at least 8 characters')
        .custom((pass, {req}) => {
            if (pass !== req.body.passwordConfirmation)
                throw new Error('password confirmation incorrect');
            return true;
        }),
    check('passwordConfirmation')
        .notEmpty()
        .withMessage('password confirmation required'),
    validatorMiddleware
];



export const loginValidator = [
    check('email')
        .notEmpty()
        .withMessage('Email required')
        .isEmail()
        .withMessage('Please enter a valid email'),
    check('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('password must be at least 8 characters'),
    validatorMiddleware
];