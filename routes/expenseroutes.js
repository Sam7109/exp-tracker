const express = require('express');            
const router = express.Router();

const expensecontroller = require('../controller/expenses')

router.post('/submitexpense',expensecontroller.submitExpense)
router.delete('/remove-exp/:id',expensecontroller.deleteExpense)
router.get('/expenselist',expensecontroller.getAllexpenses)

module.exports = router 