import { param } from 'express-validator';
import validatorMiddleware from '../../Middleware/validatorMiddleware.js';

export const validateUserId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID format'),
    validatorMiddleware,
]