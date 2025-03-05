import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import QRCode from 'qrcode';

import User from '../Model/userModel.js';
import appError from '../Utils/appError.js';
import sendEmail from '../Utils/sendEmail.js';
import { uploadSingleImage } from '../Middleware/uploadImageMiddleware.js';
import generateToken from '../Utils/generateToken.js';

export const uploadUserImage = uploadSingleImage('photo');

export const resizeImage = asyncHandler(async (req, res, next) => {
    const id = uuidv4();

    if (!req.file) {
        console.log('No file received');
        return next();
    }

    // Resize image in memory and get buffer
    const resizedBuffer = await sharp(req.file.buffer)
        .resize(600, 600)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toBuffer();

    // Upload directly from buffer to Cloudinary
    const photoUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'profiles',
                public_id: id,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(resizedBuffer);
    });

    req.body.photo = photoUrl.secure_url;
    next();
});


async function generateQrcode(user) {
    try {
        const fileName = `${user._id}.png`; // Unique filename for each user
        const url = `https://tawaf-isp4-1lec6n3vu-adimys-projects.vercel.app/api/v1/get-data?id=${user._id}`;

        // Generate QR code as a buffer
        const qrBuffer = await QRCode.toBuffer(url);

        // Upload directly to Cloudinary
        const result = await cloudinary.uploader.upload(qrBuffer, {
            folder: 'qr_codes',
            public_id: fileName
        });

        return result.secure_url;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}


export const signup = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.create(req.body);
        const token = generateToken(user._id);
        const qrcodeUrl = await generateQrcode(user);

        user.qrcode = qrcodeUrl;
        await user.save();

        res.status(201).json({ status: 'success', data: user, token });
    } catch (error) {
        console.error('Error in signup process:', error);
        return next(new appError('Error in signup process', 500));
    }
});


export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new appError('Incorrect email or password', 401));
    }

    const token = generateToken(user._id);

    res.status(200).json({ status: 'success', data: user, token });
});


export const protect = asyncHandler(async (req, res, next) => {
    //* 1] check if token exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return next(new appError('Please login to be able to access this route', 401));
    }

    //* 2] verify token is valid (no change happens, expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    //* 3] check if user exists
    const curUser = await User.findById(decoded.userId);

    if (!curUser) {
        return next(new appError('The user belonging to this token does no longer exist.', 401))
    }

    //* 4] check if user change his password after token creation
    if (curUser.passwordChangeAt) {
        const timeStamp = parseInt(
            curUser.passwordChangeAt.getTime() / 1000,
            10
        );
        
        if (timeStamp > decoded.iat) { //* Password changed
            return next(
                new appError(
                    'User recently changed his password. Please login again...', 
                    401
                )
            );
        }
    }

    req.user = curUser;
    next();
});


export const restrictTo = (...roles) => 
    asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new appError('You do not have permission to perform this action', 403));
        }
        
        next();
});


export const forgotPassword = asyncHandler(async (req, res, next) => {  
    //! 1] Get user by email
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new appError(`There no user with this email: ${req.body.email}`, 404));
    }

    //! 2] Generate hash code (6 digits) and save in database
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    //* Saved into database
    user.hashedCode = hashedCode;
    user.hashedCodeExpires = Date.now() + 10 * 60 * 1000;
    user.hashedCodeVerified = false;

    await user.save();

    //! Send the code via email
    try {
        await sendEmail(user.email, code);
    } catch (err) {
        user.hashedCode = undefined;
        user.hashedCodeExpires = undefined;
        user.hashedCodeVerified = undefined;

        await user.save();
        console.log(err.message);
        return next(new appError('There is an error in sending email', 500));
    }

    res.status(200).json({ status: 'success', message: 'reset code sent to e-mail' });
});


export const verifyResetCodePassword = asyncHandler(async (req, res, next) => {
    //! 1] Get user based on reset code
    const hashedCode = crypto.createHash('sha256').update(req.body.code).digest('hex');

    const user = await User.findOne({ 
        hashedCode,
        hashedCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new appError('Reset Code invalid or expired', 500));
    }

    //! 2] Reset code valid
    user.hashedCodeVerified = true;
    await user.save();

    res.status(200).json({ status: 'OK' });
});


export const resetPassword = asyncHandler(async (req, res, next) => {
    const {email, password} = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new appError('There is no user with email', 404));
    }

    if (!user.hashedCodeVerified) {
        return next(new appError('Reset code not verified', 400));
    }

    user.password = password;
    user.hashedCode = undefined;
    user.hashedCodeExpires = undefined;
    user.hashedCodeVerified = undefined;
    
    await user.save();

    //! if Ok generate token
    const token = generateToken(user._id);

    res.status(200).json({
        status: 'OK',
        message: 'Your password has been updated successfully',
        token,
    });
});