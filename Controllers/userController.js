import asyncHandler from "express-async-handler";
import appError from "../Utils/appError.js";
import User from "../Model/userModel.js";
import sendEmail from "../Utils/sendEmail.js";

// Get all users
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).select('_id name photo state createdAt approved');

    res.status(200).json({
        status: 'success',
        result: users.length,
        data: users,
    });
});

// Create a new user
export const createUser = asyncHandler(async (req, res, next) => {
    const user = await User.create(req.body);

    res.status(201).json({
        status: 'success',
        data: user,
    });
});

// Get a single user by ID or logged-in user if no ID is provided
export const getUser = asyncHandler(async (req, res, next) => {
    const userId = req.params.id || req.user._id; // Use logged-in user ID if no ID is provided
    const user = await User.findById(userId);

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: user,
    });
});

// Update a user by ID
export const updateUser = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: user,
    });
});

// Delete a user by ID
export const deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    if (req.user.role === 'admin') {
        const options = {
            email: req.user.email,
            subject: 'Rejected Massage',
            text: 'Unfortunately, your request has been rejected. Please sign up again on our website to proceed with updates',
            message: `
                <p>Unfortunately, your request has been rejected.</p>
                <p>Please sign up again on our website to proceed with updates</p>
                <p>${req.body.massege}</p>
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