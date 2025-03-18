import asyncHandler from "express-async-handler";
import appError from "../Utils/appError.js";
import User from "../Model/userModel.js";
import sendEmail from "../Utils/sendEmail.js";

// Get all users
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).select('_id name photo nationality updatedAt approved createdAt');

    res.status(200).json({
        status: 'success',
        result: users.length,
        data: users,
    });
});

//* Get a single user by ID or logged-in user if no ID is provided
export const getUser = asyncHandler(async (req, res, next) => {
    const userId = req.params.id || req.user._id; //* Use logged-in user ID if no ID is provided
    const user = await User.findById(userId);

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: user,
    });
});

//* Update a user by ID
export const updateUser = asyncHandler(async (req, res, next) => {
    const id = req.params.id || req.user._id; //* Use logged-in user ID if no ID is provided

    //* Prepare the update data
    const updateData = { ...req.body };

    //* Manually replicate the pre('save') middleware logic
    if (updateData.medicinesName !== undefined) {
        updateData.medicine = !!updateData.medicinesName; //* Set medicine to true if medicinesName exists
    }
    if (updateData.myDiseases !== undefined) {
        updateData.sick = !!updateData.myDiseases; //* Set sick to true if myDiseases exists
    }
    if (updateData.companyName !== undefined) {
        updateData.company = !!updateData.companyName; //* Set company to true if companyName exists
    }

    //* Get the user and update
    const user = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    res.status(200).json({ status: 'success', data: user, });
});

//* Delete a user by ID
export const deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    if (req.user.role === 'admin' && req.user._id.toString() !== req.params.id) {
        const options = {
            email: user.email,
            subject: 'Rejection Email',
            text: 'Unfortunately, your request has been rejected. Please sign up again on our website to proceed with updates',
            message: `
                <p>Unfortunately, your request has been rejected.</p>
                <p>Please sign up again on our website to proceed with updates</p>
                <p>${req.body.massege || ''}</p>
                <p>Thanks!</p>
            `,
        }
        try {
            await sendEmail(options);
        } catch (err) {
            console.log(err.message);
            return next(new appError('There is an error in sending email', 500));
        }
    }

    res.status(204).json({
        status: 'success',
        message: 'User deleted successfully',
    });
});