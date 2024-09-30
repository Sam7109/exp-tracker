const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authmiddleware");

const expensecontroller = require("../controller/expenses");

router.post("/submitexpense",authenticateToken, expensecontroller.submitExpense);
router.delete(
  "/remove-exp/:id",
  authenticateToken,
  expensecontroller.deleteExpense
);
router.get("/user-expenses",authenticateToken,expensecontroller.getAllexpenses);
router.get('/leaderboard',authenticateToken,expensecontroller.getLeaderboardDetails)

module.exports = router;
