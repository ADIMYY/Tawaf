import asyncHandler from 'express-async-handler';
import AppError from '../Utils/appError.js';
import User from '../Model/userModel.js';
import sendEmail from '../Utils/sendEmail.js';
import { v2 as cloudinary } from 'cloudinary';

// Constant
const DEFAULT_PHOTO_NAME = 'default.jpg';

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const matches = url.match(/\/upload\/v\d+\/(.+)(?:\.\w+)$/);
    return matches ? matches[1] : null;
};

// Delete User Media from Cloudinary
const deleteUserMedia = async (user) => {
    const deletions = [];

    try {
        // Profile Photo
        if (user.photo && !user.photo.includes(DEFAULT_PHOTO_NAME)) {
            const publicId = getPublicIdFromUrl(user.photo);
            if (publicId) {
                deletions.push(cloudinary.uploader.destroy(publicId));
            }
        }

        // Visa document
        if (user.visa) {
            const publicId = getPublicIdFromUrl(user.visa);
            if (publicId) {
                deletions.push(cloudinary.uploader.destroy(publicId));
            }
        }

        // Qr code
        if (user.qrcode) {
            const publicId = getPublicIdFromUrl(user.qrcode);
            if (publicId) {
                deletions.push(cloudinary.uploader.destroy(publicId));
            }
        }

        await Promise.all(deletions); // Run all in parallel
    } catch (error) {
        console.error(`[Cloudinary] Failed to delete media for user ${user._id}:`, error.message);
    }
}

// Send Account Approval Email
const sendApprovalEmail = async (user) => {
    try {
        await sendEmail({
            email: user.email,
            subject: '🎉 Your Account Has Been Approved!',
            message: `
                <p>Dear ${user.name},</p>
                <p>We’re happy to inform you that your account has been approved.</p>
                <p>You can now access all features of the Tawaf platform.</p>
                <p>Best regards,<br><strong>The Tawaf Team</strong></p>
            `,
            text: `Hello ${user.name}, your account has been apprved. Welcome!`
        });

        console.log(`Approval email sent to ${user.email}`);
    } catch (error) {
        console.error(`[Email] Failed to send approval email to ${user.email}:`, err.message);
    }
}

// Send Account Deletion Email
const sendDeletionEmail = async (user, message = '') => {
    try {
        let emailMessage = `
            <p>Dear ${user.name},</p>
            <p>Your account has been deleted from our system.</p>
        `;

        if (message.trim()) {
            emailMessage += `<p><strong>Reason:</strong> ${message}</p>`;
        }

        emailMessage += `
            <p>If you believe this was a mistake, please contact our support team.</p>
            <p>Best regards,<br><strong>The Tawaf Team</strong></p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Account Deletion Notice',
            message: emailMessage,
            text: 'Your Account has been deleted from our system.'
        });

        console.log(`Deletion email sent to ${user.email}`);
    } catch (error) {
        console.error(`[Email] Failed to send deletion email to ${user.email}:`, err.message);
    }
}

// Get all users (only admins)
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({ role: { $ne: 'admin' } })
        .select('_id name photo nationality updatedAt approved createdAt alive visaExpiryDate')
        .sort({ createdAt: -1});

    res.status(200).json({
        status: 'success',
        result: users.length,
        users,
    });
});

// Get Single user by ID (self or admin)
export const getUser = asyncHandler(async (req, res, next) => {
    const id = req.params.id || req.user._id;

    const user = await User.findById(id);

    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        user,
    });
});

// Update user
export const updateUser = asyncHandler(async (req, res, next) => {
    const id = req.params.id || req.user._id;

    const user = await User.findById(id);
    if (!user) {
        return next(new AppError('No user found with this ID', 404))
    }

    const updateData = { ...req.body };

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });

    if (!user.approved && updatedUser.approved) {
        await sendApprovalEmail(updatedUser);
    }

    res.status(200).json({
        status: 'success',
        user,
    });
});

// Delete User
export const deleteUser = asyncHandler(async (req, res, next) => {
    const id = req.params.id || req.user._id;

    if (req.user.role === 'admin' && req.user._id.toString() === id) {
        return next(new AppError('Administrators cannot delete their own accounts.', 400));
    }

    const user = User.findById(id);
    if (!user) {
        return next(new AppError('No user found with this ID', 404));
    }

    // Delete user media from Cloudinary
    await deleteUserMedia(user);

    // Delete from DB
    await User.findByIdAndDelete(id);

    // Send deletion email
    const reson = req.body.message ? req.body.message : undefined;
    await sendDeletionEmail(user, reson);

    res.status(200).json({
        status: 'success',
        message: 'User account and associated data have been successfully deleted.'
    });
});