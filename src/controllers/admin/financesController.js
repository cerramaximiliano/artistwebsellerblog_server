const { Finance, Budget } = require('../../models/admin');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../../utils/responseHandler');

// ============ TRANSACCIONES ============

// Obtener transacciones con filtros
const getTransactions = async (req, res) => {
  try {
    const {
      type,
      category,
      paymentStatus,
      paymentMethod,
      startDate,
      endDate,
      search,
      limit = 20,
      offset = 0,
      sort = 'newest'
    } = req.query;

    // Construir query
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Ordenamiento
    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { date: 1 };
        break;
      case 'amount_asc':
        sortOption = { amount: 1 };
        break;
      case 'amount_desc':
        sortOption = { amount: -1 };
        break;
      default: // newest
        sortOption = { date: -1 };
    }

    const [transactions, total] = await Promise.all([
      Finance.find(query)
        .sort(sortOption)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('relatedContact', 'name type')
        .populate('relatedArtwork', 'title'),
      Finance.countDocuments(query)
    ]);

    sendPaginatedResponse(res, transactions, {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener una transacción
const getTransaction = async (req, res) => {
  try {
    const transaction = await Finance.findById(req.params.id)
      .populate('relatedContact', 'name type email phone')
      .populate('relatedArtwork', 'title')
      .populate('createdBy', 'name email');

    if (!transaction) {
      return sendError(res, { message: 'Transacción no encontrada' }, 404);
    }

    sendSuccess(res, transaction);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Crear transacción
const createTransaction = async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      createdBy: req.userId
    };

    const transaction = await Finance.create(transactionData);

    // Actualizar presupuesto si existe
    const date = new Date(transaction.date);
    await Budget.syncWithFinances(date.getFullYear(), date.getMonth() + 1);

    sendSuccess(res, transaction, 'Transacción creada exitosamente', 201);
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Actualizar transacción
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Finance.findById(req.params.id);

    if (!transaction) {
      return sendError(res, { message: 'Transacción no encontrada' }, 404);
    }

    const updatedTransaction = await Finance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Actualizar presupuesto
    const date = new Date(updatedTransaction.date);
    await Budget.syncWithFinances(date.getFullYear(), date.getMonth() + 1);

    sendSuccess(res, updatedTransaction, 'Transacción actualizada exitosamente');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Eliminar transacción
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Finance.findById(req.params.id);

    if (!transaction) {
      return sendError(res, { message: 'Transacción no encontrada' }, 404);
    }

    const date = new Date(transaction.date);
    await Finance.findByIdAndDelete(req.params.id);

    // Actualizar presupuesto
    await Budget.syncWithFinances(date.getFullYear(), date.getMonth() + 1);

    sendSuccess(res, null, 'Transacción eliminada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// ============ RESUMEN Y REPORTES ============

// Obtener resumen financiero
const getSummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    const balance = await Finance.getMonthlyBalance(targetYear, targetMonth);

    // Obtener balance del mes anterior para comparación
    let previousMonth = targetMonth - 1;
    let previousYear = targetYear;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear -= 1;
    }
    const previousBalance = await Finance.getMonthlyBalance(previousYear, previousMonth);

    // Calcular cambios porcentuales
    const incomeChange = previousBalance.income > 0
      ? ((balance.income - previousBalance.income) / previousBalance.income * 100).toFixed(1)
      : 0;
    const expenseChange = previousBalance.expense > 0
      ? ((balance.expense - previousBalance.expense) / previousBalance.expense * 100).toFixed(1)
      : 0;

    sendSuccess(res, {
      current: balance,
      previous: previousBalance,
      changes: {
        income: parseFloat(incomeChange),
        expense: parseFloat(expenseChange)
      }
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener desglose por categoría
const getCategoryBreakdown = async (req, res) => {
  try {
    const { year, month, type } = req.query;
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    const breakdown = await Finance.getCategoryBreakdown(targetYear, targetMonth, type);

    sendSuccess(res, breakdown);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener comparación anual
const getYearlyComparison = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const comparison = await Finance.getYearlyComparison(targetYear);

    // Formatear datos para gráfico
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0
    }));

    comparison.forEach(item => {
      const monthIndex = item._id.month - 1;
      if (item._id.type === 'income') {
        months[monthIndex].income = item.total;
      } else {
        months[monthIndex].expense = item.total;
      }
    });

    sendSuccess(res, months);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// ============ PRESUPUESTOS ============

// Obtener presupuestos
const getBudgets = async (req, res) => {
  try {
    const { year } = req.query;
    const query = year ? { year: parseInt(year) } : {};

    const budgets = await Budget.find(query).sort({ year: -1, month: -1 });
    sendSuccess(res, budgets);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener presupuesto específico
const getBudget = async (req, res) => {
  try {
    const { year, month } = req.params;

    let budget = await Budget.findOne({
      year: parseInt(year),
      month: parseInt(month)
    });

    if (!budget) {
      // Crear presupuesto si no existe
      budget = await Budget.findOrCreate(parseInt(year), parseInt(month), req.userId);
      // Sincronizar con transacciones existentes
      await Budget.syncWithFinances(parseInt(year), parseInt(month));
      budget = await Budget.findOne({ year: parseInt(year), month: parseInt(month) });
    }

    sendSuccess(res, budget);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Crear o actualizar presupuesto
const upsertBudget = async (req, res) => {
  try {
    const { year, month, categories, notes } = req.body;

    let budget = await Budget.findOne({ year, month });

    if (budget) {
      // Actualizar
      budget.categories = categories;
      budget.notes = notes;
      budget.lastUpdatedBy = req.userId;
      await budget.save();
    } else {
      // Crear
      budget = await Budget.create({
        year,
        month,
        categories,
        notes,
        createdBy: req.userId
      });
    }

    // Sincronizar con transacciones
    await Budget.syncWithFinances(year, month);
    budget = await Budget.findOne({ year, month });

    sendSuccess(res, budget, budget.isNew ? 'Presupuesto creado' : 'Presupuesto actualizado');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Sincronizar presupuesto con transacciones
const syncBudget = async (req, res) => {
  try {
    const { year, month } = req.params;
    const budget = await Budget.syncWithFinances(parseInt(year), parseInt(month));

    if (!budget) {
      return sendError(res, { message: 'Presupuesto no encontrado' }, 404);
    }

    sendSuccess(res, budget, 'Presupuesto sincronizado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  // Transacciones
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  // Resumen y reportes
  getSummary,
  getCategoryBreakdown,
  getYearlyComparison,
  // Presupuestos
  getBudgets,
  getBudget,
  upsertBudget,
  syncBudget
};
