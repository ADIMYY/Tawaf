import asyncHandler from "express-async-handler";
import Emergency from "../Model/emergencyModel.js";
import appError from "../Utils/appError.js";

export const getAllEmergencies = asyncHandler(async (req, res, next) => {
    const query = req.query.city ? { city: req.query.city } : {};
    const emergencies = await Emergency.find(query);

    if (!emergencies) {
        return next(new appError('No emergencies found for this city', 404));
    }

    res.status(200).json({ status: 'success', data: emergencies });
});