import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

// Routes
import authRoute from './Routes/authRoute.js';
import userRoute from './Routes/userRoutes.js';
import weatherRoute from './Routes/weatherRoute.js';
import getDataRoute from './Routes/getDataRoute.js';
import prayTimes from './Routes/prayTimesRoute.js';

// Middleware
import globalError from './Middleware/errorMiddleware.js';

// Cron Jobs
import startVisaExpirationCron from './Utils/visaExpirationCron.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'config.env') });

// Connect to MongoDB
const db = process.env.DATA_BASE.replace('<db_password>', process.env.DB_PASSWORD);
try {
    await mongoose.connect(db);
    console.log('Connected to the database successfully');
} catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1); // trust first proxy

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 500, // Allow 500 requests every 5 minutes
    message: 'Too many requests from this IP, please try again in 5 minutes',
});
app.use('/api', limiter);

// API Routes
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/weather', weatherRoute);
app.use('/api/v1/get-data', getDataRoute);
app.use('/api/v1/prayTimes', prayTimes);

// Global error handling middleware
app.use(globalError);

// Start the server
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    // Start the visa expiration cron job
    startVisaExpirationCron();
    console.log('Visa expiration cron job started');
});