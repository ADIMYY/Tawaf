import express from 'express';

import { 
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
} from '../Controllers/userController.js';

import { protect, restrictTo } from '../Controllers/authController.js';

const router = express.Router();
router.use(protect);

router.route('/myProfile').get(getUser);
router
    .route('/')
    .get(restrictTo('admin'), getAllUsers)
    .post(restrictTo('admin'), createUser);

router
    .route('/:id')
    .get(restrictTo('admin'), getUser)
    .put(updateUser).delete(deleteUser);

export default router;