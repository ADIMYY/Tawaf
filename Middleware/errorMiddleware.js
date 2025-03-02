import appError from "../Utils/appError.js";

const sendErrorForDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        tack: err.stack
    });
};

const sendErrorForProd = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};

const handleJwtInvalid = () => 
    new appError('Ivalid Token, please login...', 401);

const handleJwtExpired = () =>
    new appError('Expired Token, please login...', 401);

const globalError = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorForDev(err, res);
    } else {
        if (err.name === 'jsonWebTokenError') err = handleJwtInvalid();
        if (err.name === 'TokenExpiredError') err = handleJwtExpired();
        sendErrorForProd(err, res);
    }
};

export default globalError;