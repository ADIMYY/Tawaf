import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        slug: {
            type: String, 
            lowercase: true,
        },
        passPortNumber: {
            type: String,
            required: true,
            unique: true,
        },
        state: String,
        nationality: {
            type: String,
            required: true,
        },
        photo: {
            type: String,
            default: 'default.jpg',
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        birthDate: {
            type: String,
            required: true,
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
        },
        passwordChangeAt: Date,
        gender: {
            type: String,
            enum: ['male', 'female'],
            required: true,
        },
        userPhone: {
            type: String,
            required: true,
            match: [/^\d{11}$/, 'Please enter a valid phone number'],
        },
        maritalStatus: {
            type: String,
            enum: ['single', 'married', 'divorced', 'widowed', 'bachelor'],
            required: true,
        },
        relativePhone: {
            type: String,
            required: true,
        },
        relationship: {
            type: String,
            required: true,
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
        companyNumber: String,
        qrcode: String,
        alive: {
            type: Boolean,
            default: true,
        },
        location: {
            type: String,
            default: "",
        },
        visa: {
            type: String,
            required: true,
        }
    }, { timestamps: true }
);

userSchema.pre(/^save/, async function(next) {
    try {
        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 12);
        }
        next();
    } catch (error) {
        next(error);
    }
});

export default mongoose.model('User', userSchema);