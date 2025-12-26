import express from 'express';

import { getAroundYou } from "../Controllers/aroundYouController.js";
import { aroundYouValidator } from '../Utils/validator/aroundYouValidator.js';

const router = express.Router();


router.get(
    "/", 
    aroundYouValidator, 
    getAroundYou
);

export default router;