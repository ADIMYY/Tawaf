import { param, query, body } from 'express-validator';
import validatorMiddleware from '../../Middleware/validatorMiddleware.js';

export const getDataFromQrcodeValidator = [
    param('id')
        .notEmpty()
        .withMessage('User ID is required'),
    query('lng')
        .optional()
        .isIn(['en', 'ar'])
        .withMessage('Language must be either en or ar'),
    validatorMiddleware,
];

export const getUserByPassportValidator = [
    param('passport')
        .isString()
        .trim()
        .isLength({ min: 5, max: 20 })
        .withMessage('Passport number must be between 5 and 20 characters'),
    query('lng')
        .optional()
        .isIn(['en', 'ar'])
        .withMessage('Language must be "en" or "ar"'),
    validatorMiddleware,
];

export const getDataByIdValidator = [
    param('id')
        .optional()
        .isMongoId()
        .withMessage('Invalid user ID format'),
    validatorMiddleware,
];

export const getDataByNameValidator = [
    body('name')
            .isString()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be 2-100 characters'),
    query('lng')
        .optional()
        .isIn(['en', 'ar'])
        .withMessage('Language must be "en" or "ar"'),
    validatorMiddleware,
];