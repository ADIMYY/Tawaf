import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 2,
        },
        slug: {
            type: String, 
            lowercase: true,
            trim: true,
        },
        passPortNumber: {
            type: String,
            required: true,
            index: true,
            unique: true,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        nationality: {
            type: String,
            required: true,
            trim: true,
        },
        photo: {
            type: String,
            default: 'default.jpg',
            required: true,
        },
        email: {
            type: String,
            required: true,
            index: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8, 
            select: false,
        },
        birthDate: {
            type: String,
            required: true,
            trim: true,
        },
        hashedCode: String,
        hashedCodeExpires: Date,
        hashedCodeVerified: Boolean,
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        approved: {
            type: Boolean,
            default: false,
            index: true,
        },
        passwordChangeAt: Date,
        gender: {
            type: String,
            required: true,
            enum: ['male', 'female'],
            trim: true,
        },
        userPhone: {
            type: String,
            required: true,
            trim: false,
        },
        maritalStatus: {
            type: String,
            required: true,
            enum: ['single', 'married', 'divorced', 'widowed', 'bachelor'],
            trim: true,
        },
        relativePhone: {
            type: String,
            required: true,
        },
        relationship: {
            type: String,
            required: true,
            trim: false,
        },
        sick: {
            type: Boolean,
            default: false,
        },
        myDiseases: {
            type: String,
            required: function() { return this.sick === true }, 
        },
        medicine: {
            type: Boolean,
            default: false,
        },
        medicinesName: {
            type: String,
            required: function() { return this.medicine === true },
        },
        company: {
            type: Boolean,
            default: false,
        },
        companyName: {
            type: String,
            required: function() { return this.company === true },
        },
        companyNumber: {
            type: String,
            trim: true,
        },
        qrcode: String,
        alive: {
            type: Boolean,
            default: true,
        },
        location: {
            type: String,
            default: '',
            trim: true,
        },
        visa: {
            type: String,
            required: true,
        },
        visaExpiryDate: {
            type: Date,
            default: null,
        },
    }, { timestamps: true }
);

userSchema.index({ approved: 1, role: 1 });

userSchema.pre(/^save/, async function(next) {
    if (!this.isModified('password')) return next();

    try {
        this.password = await bcrypt.hash(this.password, 12);
        if (!this.isNew) {
            this.passwordChangeAt = Date.now() - 1000
        }
        next();
    } catch(error) {
        next(error);
    }
});

export default mongoose.model('User', userSchema);