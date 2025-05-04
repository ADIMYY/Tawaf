import express from "express";

import { deleteUserWithExpiredVisa } from "../Controllers/cronJobController.js";

const router = express.Router();

router.get("/deleteExpiredVisaUsers", deleteUserWithExpiredVisa);

export default router;