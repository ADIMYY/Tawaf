import { query, param } from 'express-validator';
import validatorMiddleware from '../../Middleware/validatorMiddleware.js';

export const prayTimesValidator = [
    param('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a number between -90 and 90.'),
    param('lon')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a number between -180 and 180.'),
    query('lng')
        .optional()
        .isIn(['en', 'ar'])
        .withMessage('Language must be either "en" or "ar".'),
    validatorMiddleware
];