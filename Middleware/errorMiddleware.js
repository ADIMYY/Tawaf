import AppError from '../Utils/appError.js';


const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack // Fixed typo: 'tack' → 'stack'
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Programming or unknown error: don't leak details
        console.error('ERROR 💥', err);
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }
};

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.message.match(/(["'])(\\?.)*?\1/)?.[0] || 'duplicate value';
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTInvalidError = () =>
    new AppError('Invalid token, please log in again.', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired, please log in again.', 401);

const globalErrorHandler = (err, req, res, next) => {
    // Set default values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err, name: err.name, message: err.message };

        // Handle specific errors
        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTInvalidError();
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, res);
    } else {
        // Fallback for other environments
        res.status(500).json({
            status: 'error',
            message: 'Unexpected error occurred.'
        });
    }
};

export default globalErrorHandler;