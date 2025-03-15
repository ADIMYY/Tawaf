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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'config.env') });


const db = process.env.DATA_BASE.replace('<db_password>', process.env.DB_PASSWORD);
try {
    await mongoose.connect(db)
} catch (error) {
    console.log(error.message);
    process.exit(1);
}
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

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/weather', weatherRoute);
app.use('/api/v1/get-data', getDataRoute);
app.use('/api/v1/prayTimes', prayTimes);

app.use(globalError);

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
});