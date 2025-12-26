import { query } from 'express-validator';
import validatorMiddleware from '../../Middleware/validatorMiddleware.js';

export const getAllEmergencyValidator = [
    query('city')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters'),
    query('lng')
        .optional()
        .isIn(['en', 'ar'])
        .withMessage('Language must be either en or ar'),
    validatorMiddleware,
];