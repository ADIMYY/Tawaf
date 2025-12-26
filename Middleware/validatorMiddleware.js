import { validationResult } from 'express-validator';
import AppError from '../Utils/appError.js';

const validatorMiddleware = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);

        const message = `Validation failed: ${errorMessages.join('; ')}`;

        return next(new AppError(message, 400));
    }

    next();
};

export default validatorMiddleware;