import express from "express";

import { getAllEmergencies } from "../Controllers/emergencyController.js";
import { getAllEmergencyValidator } from '../Utils/validator/emergencyValidator.js';

const router = express.Router();


router.get(
    '/', 
    getAllEmergencyValidator, 
    getAllEmergencies
);

export default router;