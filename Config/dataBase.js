import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const dbConnect = async () => {
    try {
        const db = process.env.DATA_BASE.replace('<db_password>', process.env.DB_PASSWORD);
        await mongoose.connect(db, { serverSelectionTimeoutMS: 5000 });
    } catch (error) {
        console.error(`Error: ${error.message}`);
        
    }
}

// Graceful shutdown function
const gracefulShutdown = async () => {
    try {
        await mongoose.connection.close();
        process.exit(1); // Exit the process after cleanup
    } catch (shutdownError) {
        console.error(`Error during shutdown: ${shutdownError.message}`);
        process.exit(1); // Force exit if cleanup fails
    }
};

export default dbConnect;