import mongoose from 'mongoose';

const placeBaseSchema = new mongoose.Schema({
    translationKey: {
        type: String,
        required: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    locationUrl: {
        type: String,
        trim: true
    }
}, { _id: false }); // No separate _id for subdocs

const restaurantSchema = new mongoose.Schema({
    ...placeBaseSchema.obj,
    typeOfFood: {
        type: String,
        trim: true
    },
    workSchedules: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const cafeSchema = new mongoose.Schema({
    ...placeBaseSchema.obj,
    workSchedules: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const supermarketSchema = new mongoose.Schema({
    ...placeBaseSchema.obj,
    workSchedules: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

const hotelSchema = new mongoose.Schema({
    ...placeBaseSchema.obj,
    category: {
        type: String,
        required: true,
        trim: true
    },
    workSchedules: {
        type: String,
        trim: true
    }
}, { _id: false });

const aroundYouSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true,
        trim: true,
        enum: ['Mecca', 'Medina', 'Jeddah', 'Riyadh'], // optional: restrict cities
        index: true // 🔍 Critical for performance
    },
    restaurants: [restaurantSchema],
    cafes: [cafeSchema],
    supermarkets: [supermarketSchema],
    hotels: [hotelSchema]
}, {
    timestamps: true
});

aroundYouSchema.pre('save', function (next) {
    if (this.city) {
        this.city = this.city.trim().toLowerCase();
    }
    next();
});

export default mongoose.model('AroundYou', aroundYouSchema);