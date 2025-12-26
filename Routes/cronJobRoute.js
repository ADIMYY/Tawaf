import express from "express";
import { deleteUserWithExpiredVisa } from "../Controllers/cronJobController.js";
import { protect, restrictTo } from '../Controllers/authController.js';

const router = express.Router();

router.route('/deleteExpiredVisaUsers')
    .post(
        protect,
        restrictTo('admin'),
        deleteUserWithExpiredVisa,
    );

export default router;