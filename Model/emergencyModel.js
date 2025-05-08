import mongoose from 'mongoose';

const ambulanceSchema = new mongoose.Schema({
    emergency_number: String,
    saudi_red_crescent: {
        phone: String,
        email: String,
        photo: String,
        locationUrl: String,
    }
});

const policeStationSchema = new mongoose.Schema({
    name: String,
    location: String,
    phone: String,
    locationUrl: String,
});

const unifiedNumbersSchema = new mongoose.Schema({
    security_patrols: String,
    civil_defense: String,
    road_security: String,
    traffic: String,
    passport: String,
    drug_control: String,
    water_emergency: String,
    electricity_emergency: String
});

const policeSchema = new mongoose.Schema({
    photo: String,
    unified_numbers: unifiedNumbersSchema,
    stations: [policeStationSchema]
});

const hospitalSchema = new mongoose.Schema({
    name: String,
    location: String,
    phone: String,
    email: String,
    photo: String,
    locationUrl: String,
});

const citySchema = new mongoose.Schema({
    name: String,
    hospitals: [hospitalSchema],
    police: policeSchema,
    ambulance: ambulanceSchema
});

const dataSchema = new mongoose.Schema({
    city: String,
    emergency: citySchema
});


export default mongoose.model('Emergency', dataSchema);