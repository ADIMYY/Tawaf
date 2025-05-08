import asyncHandler from "express-async-handler";
import Emergency from "../Model/emergencyModel.js";
import appError from "../utils/appError.js";


export const createEmergency = asyncHandler(async (req, res, next) => {
    const { city, emergency } = req.body;

    const newEmergency = await Emergency.create({ city, emergency });

    res.status(201).json({ status: 'success', data: newEmergency });
});

export const getAllEmergencies = asyncHandler(async (req, res, next) => {
    const emergencies = await Emergency.findOne({ city: req.query.city });

    if (!emergencies) {
        return next(new appError('No emergencies found for this city', 404));
    }

    res.status(200).json({ status: 'success', data: emergencies });
});

export const updateEmergency = asyncHandler(async (req, res, next) => {
    const { city, emergency } = req.body;

    const updatedEmergency = await Emergency.findOneAndUpdate({ city }, { emergency }, { new: true });

    if (!updatedEmergency) {
        return next(new appError('No emergencies found for this city', 404));
    }

    res.status(200).json({ status: 'success', data: updatedEmergency });
});

export const deleteEmergency = asyncHandler(async (req, res, next) => {
    const { city } = req.params;

    const emergency = await Emergency.findOneAndDelete({ city });

    if (!emergency) {
        return next(new appError('No emergencies found for this city', 404));
    }

    res.status(204).json({ status: 'success', data: null });
});