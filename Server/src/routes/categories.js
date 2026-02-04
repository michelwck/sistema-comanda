import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
    getCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
} from '../controllers/categoriesController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all categories
router.get('/', getCategories);

// Create category
router.post('/', createCategory);

// Update category
router.put('/:id', updateCategory);

// Delete category
router.delete('/:id', deleteCategory);

export default router;
