import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from 'cloudinary';

import User from '../Model/userModel.js';
import sendEmail from "../Utils/sendEmail.js";
import AppError from "../Utils/appError.js";

// Constant
const DEFAULT_PROFILE_PHOTO = 'default.jpg';

// Utility function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const matches = url.match(/\/upload\/v\d+\/(.+)(?:\.\w+)$/);
    return matches ? matches[1] : null;
};

// Delete User's Media from Cloudinary
const deleteUserMedia = async (user) => {
    const deletions = [];

    try {
        // Only attempt deletion if URL exists and not default
        if (user.photo && !user.photo.includes(DEFAULT_PROFILE_PHOTO)) {
            const publicId = getPublicIdFromUrl(user.photo);
            if (publicId) {
                deletions.push(cloudinary.uploader.destroy(publicId));
            }
        }

        if (user.visa) {
            const publicId = getPublicIdFromUrl(user.visa);
            if (publicId) {
                deletions.push(cloudinary.uploader.destroy(publicId));
            }
        }

        if (user.qrcode) {
            const publicId = getPublicIdFromUrl(user.qrcode);
            if (publicId) {
                deletions.push(cloudinary.uploader.destroy(publicId));
            }
        }

        // Run all deletions in parallel
        await Promise.all(deletions);
    } catch (error) {
        console.error(`[Cloudinary] Failed to delete media for user ${user._id}:`, error.message);
    }
};

// Send Account Deletion Notification Email
const sendDeletionEmail = async (user) => {
    if (!user.email) {
        console.warn(`No email address for user ${user._id}, skipping notification.`);
        return;
    }

    try {
        const expiryDate = new Date(user.visaExpiryDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const message = `
            <p>Dear ${user.name || 'User'},</p>
            <p>We regret to inform you that your account has been automatically deactivated due to an expired visa (expired on ${expiryDate}).</p>
            <p>If you believe this was a mistake or wish to renew your registration, please contact our support team.</p>
            <p>Thank you,<br><strong>The Tawaf Team</strong></p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Account Deletion Notice - Expired Visa',
            text: 'Your account has been deactivated due to an expired visa.',
            message
        });

        console.log(`Deletion email sent to user ${user._id} at ${user.email}`);
    } catch (error) {
        console.error(`[Email] Failed to send deletion email to ${user.email} (ID: ${user._id}):`, error.message);
    }
};

// Main Controller: Delete User with Expired Visa
export const deleteUserWithExpiredVisa = asyncHandler(async (req, res, next) => {
    const now = new Date();

    try {
        const expiredUsers = await User.find({
            visaExpiryDate: { $lt: now, $ne: null },
            role: { $ne: 'admin' }
        }).select('name email photo visa qrcode visaExpiryDate');

        if (expiredUsers.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'No users found with expired visas.'
            });
        }

        console.log(`Processing deletion for ${expiredUsers.length} expired visa users...`);

        // Proccess all users in parallel
        const deletionPromises = expiredUsers.map(async (user) => {
            try {
                // Delete associated media
                await deleteUserMedia(user);

                // Send notification email
                await sendDeletionEmail(user);

                // Delete user from database
                await User.findByIdAndDelete(user._id);

                console.log(`✅ Successfully deleted user: ${user._id} (${user.email})`);
            } catch (error) {
                console.error(`❌ Failed to delete user: ${user._id} (${user.email}) - ${error.message}`);
            }
        });

        // Wait for all deletions to complete
        await Promise.all(deletionPromises);

        // fFinal response
        res.status(200).json({
            status: 'success',
            message: `${expiredUsers.length} user(s) with expired visas have been cleaned up.`,
            deletedCount: expiredUsers.length
        });
    } catch (error) {
        console.error('Critical error during cron job execution:', error);
        return next(new AppError('Failed to process expired visa users.', 500));
    }
});