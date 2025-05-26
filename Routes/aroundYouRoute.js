import express from 'express';

import { getAroundYou } from "../Controllers/aroundYouController.js";

const router = express.Router();


router.get("/", getAroundYou);

export default router;