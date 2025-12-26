import mongoose from 'mongoose';

const emergencyPlaceBaseSchema = new mongoose.Schema({
    translationKey: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    photo: {
        type: String,
        trim: true
    },
    locationUrl: {
        type: String,
        trim: true
    }
}, { _id: false });

// Specialized schemas
const hospitalSchema = new mongoose.Schema({
    ...emergencyPlaceBaseSchema.obj
}, { _id: false });

const policeStationSchema = new mongoose.Schema({
    ...emergencyPlaceBaseSchema.obj
}, { _id: false });

const saudiRedCrescentSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    photo: {
        type: String,
        trim: true
    },
    locationUrl: {
        type: String,
        trim: true
    }
}, { _id: false });

const unifiedNumbersSchema = new mongoose.Schema({
    security_patrols: { type: String, trim: true },
    civil_defense: { type: String, trim: true },
    road_security: { type: String, trim: true },
    traffic: { type: String, trim: true },
    passport: { type: String, trim: true },
    drug_control: { type: String, trim: true },
    water_emergency: { type: String, trim: true },
    electricity_emergency: { type: String, trim: true }
}, { _id: false });

const policeSchema = new mongoose.Schema({
    photo: { type: String, trim: true },
    unified_numbers: {
        type: unifiedNumbersSchema,
        required: true
    },
    stations: [policeStationSchema]
}, { _id: false });

const ambulanceSchema = new mongoose.Schema({
    emergency_number: {
        type: String,
        required: true,
        trim: true
    },
    saudi_red_crescent: {
        type: saudiRedCrescentSchema,
        required: true
    }
}, { _id: false });

// Main schema
const emergencySchema = new mongoose.Schema({
    city: {
        type: String,
        required: true,
        trim: true,
        enum: ['Mecca', 'Medina'],
        index: true
    },
    emergency: {
        hospitals: [hospitalSchema],
        police: {
            type: policeSchema,
            required: true
        },
        ambulance: {
            type: ambulanceSchema,
            required: true
        }
    }
}, {
    timestamps: true
});

emergencySchema.pre('save', function (next) {
    if (this.city) {
        this.city = this.city.trim().toLowerCase();
    }
    next();
});

export default mongoose.model('Emergency', emergencySchema);