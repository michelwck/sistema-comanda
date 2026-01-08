import express from 'express';
import {
    getAllTabs,
    getTabById,
    createTab,
    updateTab,
    deleteTab,
    addTabItem,
    updateTabItem,
    deleteTabItem
} from '../controllers/tabController.js';

const router = express.Router();

// Rotas de comandas
router.get('/', getAllTabs);
router.get('/:id', getTabById);
router.post('/', createTab);
router.put('/:id', updateTab);
router.delete('/:id', deleteTab);

// Rotas de itens da comanda
router.post('/:id/items', addTabItem);
router.put('/:id/items/:itemId', updateTabItem);
router.delete('/:id/items/:itemId', deleteTabItem);

export default router;
