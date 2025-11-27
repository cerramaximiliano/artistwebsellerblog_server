const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const adminAuth = require('../../middlewares/adminAuth');
const { financesController } = require('../../controllers/admin');

// Todas las rutas requieren autenticación de admin
router.use(auth, adminAuth);

// Resumen y reportes (deben ir antes de rutas con parámetros)
router.get('/summary', financesController.getSummary);
router.get('/category-breakdown', financesController.getCategoryBreakdown);
router.get('/yearly-comparison', financesController.getYearlyComparison);

// Transacciones
router.get('/transactions', financesController.getTransactions);
router.get('/transactions/contact/:contactId', financesController.getTransactionsByContact);
router.get('/transactions/:id', financesController.getTransaction);
router.post('/transactions', financesController.createTransaction);
router.put('/transactions/:id', financesController.updateTransaction);
router.delete('/transactions/:id', financesController.deleteTransaction);

// Presupuestos
router.get('/budgets', financesController.getBudgets);
router.get('/budgets/:year/:month', financesController.getBudget);
router.post('/budgets', financesController.upsertBudget);
router.patch('/budgets/:year/:month/sync', financesController.syncBudget);

module.exports = router;
