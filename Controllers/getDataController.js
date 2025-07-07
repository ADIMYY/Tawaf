import slugify from "slugify";
import asyncHandler from "express-async-handler";
import User from '../Model/userModel.js';
import appError from "../Utils/appError.js";

const userFields = 'location photo name nationality state passPortNumber birthDate maritalStatus myDiseases medicinesName relativePhone companyNumber companyName relationship alive userPhone';

// Controller to get user data by passport number
export const getUserByPassport = asyncHandler(async (req, res, next) => {
    // Extract language from query parameter (e.g., ?lng=en or ?lng=ar)
    const lang = req.query.lng || 'en'; // Default to English if no language is provided
    req.i18n.changeLanguage(lang); // Change language based on query parameter
    const t = req.t; // i18next translation function

    const user = await User.findOne({ passPortNumber: req.params.passport }).select(userFields);
    
    if (!user) {
        return next(new appError(t('error.noUserWithPassport'), 404));
    }

    res.status(200).json({ status: 'success', data: localizedUser });
});

// Controller to get user data from QR code
export const getDataFromQrcode = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.query.id);

    if (!user) {
        return next(new appError('No user found with this QR code', 404));
    }
    
    res.status(200).render("profile", { user });
});

// Controller to get user data by ID
export const getDataById = asyncHandler(async (req, res, next) => {
    // Extract language from query parameter (e.g., ?lng=en or ?lng=ar)
    const lang = req.query.lng || 'en'; // Default to English if no language is provided
    req.i18n.changeLanguage(lang); // Change language based on query parameter
    const t = req.t; // i18next translation function

    const id = req.params.id || req.user._id; // Use logged-in user ID if no ID is provided
    const user = await User.findById(id).select(userFields);

    if (!user) {
        return next(new appError(t('error.noUserWithId'), 404));
    }

    res.status(200).json({ status: 'success', data: localizedUser });
});


export const getDataByName = asyncHandler(async (req, res, next) => {
    // Extract language from query parameter (e.g., ?lng=en or ?lng=ar)
    const lang = req.query.lng || 'en'; // Default to English if no language is provided
    req.i18n.changeLanguage(lang); // Change language based on query parameter
    const t = req.t; // i18next translation function

    const { name } = req.body;

    const user = await User.findOne({ slug: slugify(name) }).select(userFields);

    if (!user) {
        return next(new appError(t('error.noUserWithId'), 404));
    }

    res.status(200).json({ status: 'success', data: localizedUser });
});