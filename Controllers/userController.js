import asyncHandler from "express-async-handler";
import appError from "../Utils/appError.js";
import User from "../Model/userModel.js";
import sendEmail from "../Utils/sendEmail.js";
import { v2 as cloudinary } from 'cloudinary';

// Utility function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    
    // Extract everything after the upload part excluding the extension
    const matches = url.match(/\/upload\/v\d+\/(.+)(?:\.\w+)$/);
    
    if (matches && matches[1]) {
        return matches[1]; // This will include the folder path (profiles/photo-...)
    }
    return null;
};

// Get all users
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find({ role: { $ne: 'admin' } })
        .select('_id name photo nationality updatedAt approved createdAt alive visaExpiryDate');

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
    // Find the user first to get their image URLs
    const user = await User.findById(req.params.id);
    
    // Check if user existed
    if (!user) {
        return next(new appError('No user found with this ID', 404));
    }

    // Prevent admin from deleting their own account
    if (req.user.role === 'admin' && req.user._id.toString() === req.params.id) {
        return next(new appError('Admins cannot delete their own account', 403));
    }

    // Delete images from Cloudinary if they exist
    try {
        // Delete profile photo
        if (user.photo && user.photo !== 'default.jpg') {
            const photoPublicId = getPublicIdFromUrl(user.photo);
            console.log(photoPublicId);
            if (photoPublicId) {
                await cloudinary.uploader.destroy(photoPublicId);
            }
        }

        // Delete visa document if it exists
        if (user.visa) {
            const visaPublicId = getPublicIdFromUrl(user.visa);
            console.log(visaPublicId);
            if (visaPublicId) {
                await cloudinary.uploader.destroy(visaPublicId);
            }
        }


        // Delete Qr code
        if (user.qrcode) {
            const qrCodePublicId = getPublicIdFromUrl(user.qrcode);
            console.log(qrCodePublicId);
            if (qrCodePublicId) {
                await cloudinary.uploader.destroy(qrCodePublicId);
            }
        }
    } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Continue with user deletion even if image deletion fails
    }

    // Delete the user from database
    await User.findByIdAndDelete(req.params.id);

    // Check if the requesting user has admin privileges
    if (req.user.role === 'admin') {
        // Prepare email message based on user data
        let emailMessage = `
            <p>Dear ${user.name},</p>
            <p>Your account has been deleted from our system.</p>
        `;
    
        if (user.visaExpiryDate) {
            const visaExpiryDate = new Date(user.visaExpiryDate);
            if (!isNaN(visaExpiryDate.getTime())) {  // Check if date is valid
                const formattedDate = visaExpiryDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                if (visaExpiryDate <= new Date()) {
                    emailMessage += `
                        <p>Your visa expired on ${formattedDate}.</p>
                    `;
                } else {
                    emailMessage += `
                        <p>Your visa will expire on ${formattedDate}.</p>
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
    }

    res.status(200).json({
        status: 'success',
        message: 'User has been successfully deleted'
    });
});