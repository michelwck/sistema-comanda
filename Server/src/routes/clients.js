import express from 'express';
import {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getClientTransactions,
    createClientTransaction
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/', getAllClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// Rotas de transações do cliente
router.get('/:id/transactions', getClientTransactions);
router.post('/:id/transactions', createClientTransaction);

export default router;
