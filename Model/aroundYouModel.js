import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    name: String,
    typeOfFood: String,
    workSchedules: String,
    phone: String,
    location: String,
    image: String,
    locationUrl: String,
});

const shopSchema = new mongoose.Schema({ // for cafe, supermarket
    name: String, 
    workSchedules: String,
    phone: String,
    location: String,
    image: String,
    locationUrl: String,
});

const hotelsSchema = new mongoose.Schema({
    name: String,
    category: String,
    phone: String,
    location: String,
    image: String,
    locationUrl: String,
});

const dataSchema = new mongoose.Schema({
    city: String,
    restaurants: [restaurantSchema],
    cafes: [shopSchema],
    supermarkets: [shopSchema],
    hotels: [hotelsSchema],
}, {
    timestamps: true
});

export default mongoose.model('AroundYou', dataSchema);