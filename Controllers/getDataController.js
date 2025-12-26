// controllers/getDataController.js
import slugify from 'slugify';
import asyncHandler from 'express-async-handler';
import User from '../Model/userModel.js';
import AppError from '../Utils/appError.js';

// Fields allowed for public/semi-public exposure
const PUBLIC_USER_FIELDS = '-password -hashedCode -hashedCodeExpires -hashedCodeVerified -__v';

// Sensitive fields only for authenticated/self access
const PRIVATE_USER_FIELDS = `${PUBLIC_USER_FIELDS} qrcode location photo name nationality state passPortNumber birthDate maritalStatus myDiseases medicinesName relativePhone companyNumber companyName relationship alive userPhone`;

// Utility: Get translation function safely
const getTranslator = (req) => {
    const t = req.t || ((key, defaultValue) => {
        const finalKey = Array.isArray(key) ? key[0] : key;
        return defaultValue || finalKey.split('.').pop();
    });
    return t;
};

// Get User by Passport Number
export const getUserByPassport = asyncHandler(async (req, res, next) => {
    const { passport } = req.params;

    if (!passport || typeof passport !== 'string') {
        return next(new AppError('Invalid passport number', 400));
    }

    const t = getTranslator(req);

    const user = await User.findOne({ passPortNumber: passport }).select(PRIVATE_USER_FIELDS);

    if (!user) {
        return next(new AppError(t('error.noUserWithPassport', 'No user found with this passport number.'), 404));
    }

    res.status(200).json({
        status: 'Success',
        data: {
            id: user._id,
            ...user.toObject()
        }
    });
});

// Render profile page from QR code
// This is server-side rendered (Pug)
export const getDataFromQrcode = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new AppError('No user ID provided', 400));
    }

    const user = await User.findById(id).select(PRIVATE_USER_FIELDS);

    if (!user) {
        return next(new AppError('No user found with this ID', 404));
    }

    // Render pug template (SSR)
    res.status(200).render('profile', { user, title: 'User Profile' });
});

// Get user data by ID (protected route)
export const getDataById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const currentUserId = id || req.user?._id; // fallback to logged-in user

    const t = getTranslator(req);

    const user = await User.findById(currentUserId).select(PRIVATE_USER_FIELDS);

    if (!user) {
        return next(new AppError(t('error.noUserWithId', 'No user found with this ID.'), 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            id: user._id,
            ...user.toObject()
        }
    });
});

// Get user by name (slug-based)
export const getDataByName = asyncHandler(async (req, res, next) => {
    const { name } = req.body;

    if (!name || typeof name !== 'string') {
        return next(new AppError('Please provide a valid name.', 400));
    }

    const t = getTranslator(req);

    const slug = slugify(name.trim(), { lower: true });
    const user = await User.findOne({ slug }).select(PRIVATE_USER_FIELDS);

    if (!user) {
        return next(new AppError(t('error.noUserWithId', 'No user found with this name.'), 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            id: user._id,
            ...user.toObject()
        }
    });
});