import crypto from 'crypto';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import QRCode from 'qrcode';

import User from '../Model/userModel.js';
import AppError from '../Utils/appError.js';
import sendEmail from '../Utils/sendEmail.js';
import { uploadMixImage } from '../Middleware/uploadImageMiddleware.js';
import generateToken from '../Utils/generateToken.js';


// Constants
const IMAGE_FOLDERS = {
    photo: 'profiles', 
    visa: 'visas', 
    qr: 'qr_codes'
}

const IMAGE_CONFIGS = {
    photo: { width: 600, height: 600, quality: 90 }, 
    visa: { width: 800, height: null, quality: 80 }, 
}

// Upload Middleware
export const uploadImages = uploadMixImage([
    { name: 'photo', maxCount: 1, },
    { name: 'visa', maxCount: 1 }
]);


// Image Processing & Upload
export const resizeImage = asyncHandler(async (req, res, next) => {
    if (!req.file && !req.files) return next();

    try {
        const fileMap = {};
        if (req.file) {
            fileMap[req.file.fieldname] = req.file;
        } else {
            Object.assign(fileMap, req.files);
        }

        // Process each uploaded file
        const uploadPromises = Object.entries(fileMap).map(([fileName, files]) => 
            processAndUploadImage(files[0], fileName, req)
        );

        await Promise.all(uploadPromises);

        next();
    } catch (error) {
        console.error('Error resizing/uploading image:', error);
        return next(new AppError('Failed to process uploaded images', 500));
    }
});

// process and uploads an image buffer to Cloudinary
async function processAndUploadImage(file, fieldName, req) {
    const config = IMAGE_CONFIGS[fieldName] || IMAGE_CONFIGS.photo;
    const folder = IMAGE_FOLDERS[fieldName];

    let sharpInstance = sharp(file.buffer)
        .toFormat('jpeg')
        .jpeg({ quality: config.quality });

    if (config.width || config.height) {
        sharpInstance = sharpInstance.resize(config.width, config.height, {
            fit: 'inside', 
            withoutEnlargement: true,
        });
    }

    const resizedBuffer = await sharpInstance.toBuffer();

    const result = await uploadToCloudinary(resizedBuffer, folder, `${fieldName}-${uuidv4()}`);
    
    // Store URL in a new field to avoid mutating req.body prematurely
    if (!req.uploadedFiles) req.uploadedFiles = {};
    req.uploadedFiles[fieldName] = result.secure_url;
}

// Generic Cloudinary Upload Utility
function uploadToCloudinary(buffer, folder, publicId) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, public_id: publicId },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
}

// QRcode Generation
async function generateQrCode(user) {
    const url = `${process.env.MAIN_URL}/api/v1/get-data/Qrcode?id=${user._id}`;
    const qrBuffer = await QRCode.toBuffer(url);

    const result = await uploadToCloudinary(qrBuffer, IMAGE_FOLDERS.qr, `${user._id}`);
    return result.secure_url;
}

// Auth Controller
export const signup = asyncHandler(async (req, res, next) => {
    const userData = { ...req.body, ...req.uploadedFiles };

    const user = await User.create(userData);
    const token = generateToken(user._id);
    const qrcodeUrl = await generateQrCode(user);

    user.qrcode = qrcodeUrl;
    await user.save({ validateBeforeSave: false }); // avoid rehashing password

    res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        token,
        id: user._id,
    });
});

// User Login
export const login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    if (!user.approved) {
        return next(new AppError('Your account is not approved yet. Please wait for approval.', 403)); // 403 for 
    }

    const token = generateToken(user._id);

    res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        token,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            approved: user.approved,
            photo: user.photo,
            visa: user.visa,
            qrcode: user.qrcode
        }
    });
});

// Protect Middleware - authenticate user via JWT
export const protect = asyncHandler(async (req, res, next) => {
    // 1. check for token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return next(new AppError('Please login to access this resource', 401));
    }

    // 2. verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    // 3. validate user exists
    const currentUser = await User.findById(decoded.userId);
    if (!curUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401))
    }

    // 4. Check if password was changed after token issued
    if (currentUser.passwordChangeAt) {
        const timeStamp = parseInt(currentUser.passwordChangeAt.getTime() / 1000, 10);
        
        if (timeStamp > decoded.iat) { //* Password changed
            return next(new AppError('User recently changed his password. Please login again...', 401));
        }
    }

    req.user = currentUser;
    next();
});

// Restrict access based on roles
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppRrror('You do not have permission to perform this action', 403));
        }
        next();
    };
};

// Forgot Password - send reset code
export const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new AppError(`There no user with this email: ${email}`, 404));
    }

    // Generate 6-digit reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // save hashed code and expiry
    user.hashedCode = hashedCode;
    user.hashedCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.hashedCodeVerified = false;

    await user.save({ validateBeforeSave: false });

    // Send email
    const options = {
        email: user.email,
        subject: 'Password Reset Request',
        message: `
            <p>You requested a password reset.</p>
            <p>Your verification code is:</p>
            <h1>${code}</h1>
            <p>This code is valid for 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
        `
    }
    try {
        await sendEmail(options);
    } catch (err) {
        user.hashedCode = undefined;
        user.hashedCodeExpires = undefined;
        user.hashedCodeVerified = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Failed to send reset email, Please try again later', 500));
    }

    res.status(200).json({
        status: 'success', 
        message: 'reset code sent to e-mail' 
    });
});

// verify reset code
export const verifyResetCodePassword = asyncHandler(async (req, res, next) => {
    const { code } = req.body;
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({ 
        hashedCode,
        hashedCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new AppError('Invalid or expired reset code', 500));
    }

    user.hashedCodeVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'Success',
        message: 'Reset code verified successfully.',
    });
});

// Reset Password after code verification
export const resetPassword = asyncHandler(async (req, res, next) => {
    const {email, password} = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('There is no user with email', 404));
    }

    if (!user.hashedCodeVerified) {
        return next(new AppError('Reset code not verified', 400));
    }

    // 🔐 Hash the new password
    user.password = password;
    user.hashedCode = undefined;
    user.hashedCodeExpires = undefined;
    user.hashedCodeVerified = undefined;
    
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
        status: 'Success',
        message: 'Your password has been updated successfully',
        token,
    });
});