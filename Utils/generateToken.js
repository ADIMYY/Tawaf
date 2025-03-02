import jwt from 'jsonwebtoken';

const generateToken = id => 
    jwt.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE_TIME,
    });

export default generateToken;