import express from 'express';

import { 
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
} from '../Controllers/userController.js';

import { validateUserId } from '../Utils/validator/userValidator.js';

import { protect, restrictTo } from '../Controllers/authController.js';

const router = express.Router();
router.use(protect);

router.route('/myProfile').get(getUser);

router.route('/updateMyProfile')
    .put(
        validateUserId, 
        updateUser
    );

router.route('/').get(restrictTo('admin'), getAllUsers);

router.route('/deleteMyAccount')
    .delete(
        validateUserId, 
        deleteUser
    );

router
    .route('/:id')
    .get(restrictTo('admin'), getUser)
    .put(
        validateUserId, 
        updateUser
    )
    .delete(
        validateUserId, 
        deleteUser
    );

export default router;