import { param } from 'express-validator';
import validatorMiddleware from '../../middleware/validatorMiddleware.js';

export const weatherValidator = [
    param('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be a number between -90 and 90'),
    param('lon')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be a number between -180 and 180'),
    validatorMiddleware,
]