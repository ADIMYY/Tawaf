import asyncHandler from "express-async-handler";
import appError from "../Utils/appError.js";
import User from "../Model/userModel.js";
import sendEmail from "../Utils/sendEmail.js";

// Get all users
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({}).select('_id name photo nationality updatedAt approved createdAt alive');

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
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    // Check if user is trying to delete their own account
    if (req.user._id.toString() === req.params.id) {
        return next(new appError('You cannot delete your own account. Please contact an administrator.', 403));
    }

    // Check if the requesting user has admin privileges
    if (req.user.role !== 'admin') {
        return next(new appError('You do not have permission to delete users', 403));
    }

    // Prepare email message based on user data
    let emailMessage = `
        <p>Dear ${user.name},</p>
        <p>Your account has been deleted from our system.</p>
    `;

    if (user.visaExpiryDate) {
        const visaExpiryDate = new Date(user.visaExpiryDate);
        if (!isNaN(visaExpiryDate.getTime())) {  // Check if date is valid
            if (visaExpiryDate <= new Date()) {
                emailMessage += `
                    <p>Your visa expired on ${user.visaExpiryDate}.</p>
                `;
            } else {
                emailMessage += `
                    <p>Your visa will expire on ${user.visaExpiryDate}.</p>
                `;
            }
        }
    }

    if (req.body.message) {
        emailMessage += `
            <p>Additional information: ${req.body.message}</p>
        `;
    }

    emailMessage += `
        <p>If you believe this was a mistake, please contact our support team.</p>
        <p>Best regards,<br>The Tawaf Team</p>
    `;

    // Send email notification
    try {
        await sendEmail({
            email: user.email,
            subject: 'Account Deletion Notice',
            text: 'Your account has been deleted from our system.',
            message: emailMessage
        });
    } catch (err) {
        console.error('Error sending deletion email:', err);
        // Continue with deletion even if email fails
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: 'success',
        message: 'User has been successfully deleted'
    });
});