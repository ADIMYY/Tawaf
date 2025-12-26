import jwt from 'jsonwebtoken';

const generateToken = id => {
    const secret = process.env.JWT_SECRET_KEY;
    const expiresIn = process.env.JWT_EXPIRE_TIME || '90d';

    if (!secret) {
        throw new Error('JWT secret key is not defined in environment variables');
    }

    jwt.sign({ userId: id }, secret, { expiresIn });
};

export default generateToken;