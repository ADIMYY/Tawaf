import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';


const dbConnect = async () => {
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
    });
    try {
        const db = process.env.DATA_BASE.replace('<db_password>', process.env.DB_PASSWORD);
        await mongoose.connect(db);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1); //! 1 means exit
    }
}

export default dbConnect;