import { query } from 'express-validator';
import validatorMiddleware from '../../Middleware/validatorMiddleware.js';

export const aroundYouValidator = [
    query('city')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 2, max: 50})
        .withMessage('city must be between 2 and 50 characters'),
    query('lng')
        .optional()
        .isIn(['en', 'ar'])
        .withMessage('language must be en or ar'),
    validatorMiddleware
];