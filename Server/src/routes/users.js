import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
