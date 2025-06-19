import asyncHandler from "express-async-handler";
import { v2 as cloudinary } from 'cloudinary';

import User from '../Model/userModel.js';
import sendEmail from "../Utils/sendEmail.js";

// Utility function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const matches = url.match(/\/upload\/v\d+\/(.+)(?:\.\w+)$/);
    if (matches && matches[1]) {
        return matches[1];
    }
    return null;
};

// Function to delete user's images from Cloudinary
const deleteUserImages = async (user) => {
    try {
        // Delete profile photo
        if (user.photo && user.photo !== 'default.jpg') {
            const photoPublicId = getPublicIdFromUrl(user.photo);
            if (photoPublicId) {
                await cloudinary.uploader.destroy(photoPublicId);
            }
        }

        // Delete visa document
        if (user.visa) {
            const visaPublicId = getPublicIdFromUrl(user.visa);
            if (visaPublicId) {
                await cloudinary.uploader.destroy(visaPublicId);
            }
        }

        // Delete QR code
        if (user.qrcode) {
            const qrCodePublicId = getPublicIdFromUrl(user.qrcode);
            if (qrCodePublicId) {
                await cloudinary.uploader.destroy(qrCodePublicId);
            }
        }
    } catch (error) {
        console.error(`Error deleting images for user ${user._id} from Cloudinary:`, error);
        // Continue with the process even if image deletion fails
    }
};

// Function to send deletion notification email
const sendDeletionEmail = async (user) => {
    try {
        const emailMessage = `
            <p>Dear ${user.name},</p>
            <p>Your account has been automatically deleted from our system due to an expired visa.</p>
            <p>Your visa expired on ${new Date(user.visaExpiryDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}.</p>
            <p>If you believe this was a mistake or need to reactivate your account, please contact our support team.</p>
            <p>Best regards,<br>The Tawaf Team</p>
        `;

        await sendEmail({
            email: user.email,
            subject: 'Account Deletion Notice - Expired Visa',
            text: 'Your account has been deleted due to an expired visa.',
            message: emailMessage
        });
    } catch (error) {
        console.error(`Error sending deletion email to user ${user._id}:`, error);
        // Continue with the process even if email sending fails
    }
};

export const deleteUserWithExpiredVisa = asyncHandler(async (req, res, next) => {
    const currentDate = new Date();
    const expiredUsers = await User.find({
        visaExpiryDate: { $lte: currentDate, $ne: null },
        role: { $ne: 'admin' } // Exclude admin users
    });

    if (expiredUsers.length === 0) {
        return res.status(200).json({ status: 'success', message: 'No users with expired visas found.' });
    }

    for (const user of expiredUsers) {
        await deleteUserImages(user);
        await sendDeletionEmail(user);
        await User.findByIdAndDelete(user._id);
    }

    res.status(200).json({
        status: 'success',
        message: 'Users with expired visas have been successfully deleted.'
    });
});