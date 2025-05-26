/**
 * Main Application Entry Point
 * 
 * This file initializes and configures the Express server,
 * connects to the database, and sets up middleware and routes.
 */

//! Core dependencies
import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

//! Security dependencies
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import morgan from 'morgan';

//! Database and cloud services
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

//! Routes
import authRoute from './Routes/authRoute.js';
import userRoute from './Routes/userRoutes.js';
import weatherRoute from './Routes/weatherRoute.js';
import getDataRoute from './Routes/getDataRoute.js';
import prayTimes from './Routes/prayTimesRoute.js';
import cronJobRoute from './Routes/cronJobRoute.js';
import emergencyRoute from './Routes/emergencyRoute.js';
import aroundYouRoute from './Routes/aroundYouRoute.js';

//! Middleware
import globalError from './Middleware/errorMiddleware.js';

//! Initialize environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, 'config.env') });

/**
 * Database Connection
 */
const connectDatabase = async () => {
    const dbConnectionString = process.env.DATA_BASE.replace(
        '<db_password>', 
        process.env.DB_PASSWORD
    );

    try {
        await mongoose.connect(dbConnectionString);
        console.log('Connected to the database successfully');
    } catch (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);
    }
};

/**
 * Configure external services
 */
const configureServices = () => {
    //! Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
    });
};

/**
 * Initialize Express app with middleware
 */
const initializeApp = () => {
    const app = express();
    const port = process.env.PORT || 3000;

    //! Trust proxy for proper client IP detection (important for rate limiting)
    app.set('trust proxy', 1);

    //! Security middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    //! Logging
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }

    //! Rate limiting
    const apiLimiter = rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 500, // 500 requests per window
        message: 'Too many requests from this IP, please try again in 5 minutes',
    });
    app.use('/api', apiLimiter);

    //! API Routes
    app.use('/api/v1/users', userRoute);
    app.use('/api/v1/auth', authRoute);
    app.use('/api/v1/weather', weatherRoute);
    app.use('/api/v1/get-data', getDataRoute);
    app.use('/api/v1/prayTimes', prayTimes);
    app.use('/api/v1/emergency', emergencyRoute);
    app.use('/api/v1/aroundYou', aroundYouRoute);
    app.use('/api/v1/cronJob', cronJobRoute);

    //! Error handling middleware (should be last)
    app.use(globalError);

    return { app, port };
};

/**
 * Start server and cron jobs
 */
const startServer = async () => {
    //! Connect to database
    await connectDatabase();

    //! Configure services
    configureServices();

    //! Initialize app
    const { app, port } = initializeApp();

    //! Start server
    app.listen(port, async () => {
        console.log(`Server is running on port ${port}`);
    });
};

//! Start the application
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});