import cron from 'node-cron';
import User from '../Model/userModel.js';
import { v2 as cloudinary } from 'cloudinary';
import sendEmail from './sendEmail.js';
import appError from './appError.js';

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

// Function to delete users with expired visas
const deleteExpiredVisaUsers = async () => {
    try {
        const currentDate = new Date();
        
        // Find users with expired visas and not admin
        const expiredUsers = await User.find({
            visaExpiryDate: { $lt: currentDate },
            role: { $ne: 'admin' }
        });

        console.log(`Found ${expiredUsers.length} users with expired visas`);

        for (const user of expiredUsers) {
            try {
                // Delete user's images from Cloudinary
                await deleteUserImages(user);

                // Send deletion notification email
                await sendDeletionEmail(user);

                // Delete the user from database
                await User.findByIdAndDelete(user._id);
                console.log(`Successfully deleted user ${user._id} with expired visa`);
            } catch (userError) {
                console.error(`Error processing user ${user._id}:`, userError);
                // Continue with the next user even if one fails
            }
        }

        if (expiredUsers.length > 0) {
            console.log(`Completed processing ${expiredUsers.length} users with expired visas`);
        }
    } catch (error) {
        console.error('Error in deleteExpiredVisaUsers:', error);
        // Log the error but don't throw it to prevent the cron job from stopping
    }
};

// Schedule the task to run daily at midnight
const startVisaExpirationCron = () => {
    cron.schedule('0 0 * * *', async () => { // Run daily at midnight
        console.log(`Running visa expiration check at ${new Date().toISOString()}`);
        try {
            await deleteExpiredVisaUsers();
        } catch (error) {
            console.error('Visa expiration cron job failed:', error);
        }
    });
    console.log('Visa expiration cron job scheduled to run daily at midnight');
};

export default startVisaExpirationCron; 