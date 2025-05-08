import express from "express";

import { getAllEmergencies } from "../Controllers/emergencyController.js";

const router = express.Router();


router.get("/", getAllEmergencies);

export default router;