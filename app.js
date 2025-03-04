import express from 'express';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

import authRoute from './Routes/authRoute.js';
import userRoute from './Routes/userRoutes.js';
import weatherRoute from './Routes/weatherRoute.js';
import qrCodeRoute from './Routes/qrCodeRoute.js';
import prayTimes from './Routes/prayTimesRoute.js';
import globalError from './Middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, 'config.env') });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


const db = process.env.DATA_BASE.replace('<db_password>', process.env.DB_PASSWORD);
mongoose.connect(db).then(() => console.log('DB connection established'));
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/weather', weatherRoute);
app.use('/api/v1/get-data', qrCodeRoute);
app.use('/api/v1/prayTimes', prayTimes);

app.use(globalError);

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
});