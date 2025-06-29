import asyncHandler from "express-async-handler";
import User from '../Model/userModel.js';
import appError from "../Utils/appError.js";
import { getProfileTemplate } from "../templates/profileTemplate.js";

const userFields = 'location photo name nationality state passPortNumber birthDate maritalStatus myDiseases medicinesName relativePhone companyNumber companyName relationship alive userPhone';

export const getUserByPassport = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ passPortNumber: req.params.passport }).select(userFields);
    
    if (!user) {
        return next(new appError('No user found with this passport number', 404));
    }
    
    res.status(200).json({ status: 'success', data: user });
});

export const getDataFromQrcode = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.query.id);
    if (!user) {
        return next(new appError('No user found with this QR code', 404));
    }
    res.status(200).send(getProfileTemplate(user));
});

export const getDataById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).select(userFields);

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    res.status(200).json({ status: 'success', data: user });
});