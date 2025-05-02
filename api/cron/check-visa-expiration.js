import mongoose from "mongoose";
import dotenv from "dotenv";
import { deleteExpiredVisaUsers } from "../../Utils/visaExpirationCron";

dotenv.config();

const connectDB = async () => {
    console.log("Cron job started");
    try {
        const db = process.env.DATA_BASE.replace('<db_password>', process.env.DB_PASSWORD);
        await mongoose.connect(db);
        console.log("MongoDB connected successfully for cron job.");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1); // Exit the process with failure
    }
}

export default async function handler(req, res) {
    try {
        await connectDB();
        await deleteExpiredVisaUsers();
        res.status(200).json({ message: "Expired visa users deleted successfully." });
    } catch (err) {
        console.error("Error in cron job:", err.message);
        res.status(500).json({ error: "Failed to proccess visa expiration check" });
    } finally {
        mongoose.connection.close(); // Close the connection after the operation
    }
}