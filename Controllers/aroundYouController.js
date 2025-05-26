import asyncHandler from "express-async-handler";
import AroundYou from "../Model/aroundYouModel.js"
import appError from "../Utils/appError.js";

export const getAroundYou = asyncHandler(async (req, res, next) => {
    const query = req.query.city ? { city: req.query.city } : {};
    const aroundYouData = await AroundYou.find(query);

    if (!aroundYouData || aroundYouData.length === 0) {
        return next(new appError('No data found for this city', 404));
    }

    res.status(200).json({ status: 'success', data: aroundYouData });
});