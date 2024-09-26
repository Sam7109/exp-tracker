const Expense = require("../model/expenses");
const userInfo = require("../model/signupinfo");

exports.submitExpense = async (req, res) => {
  try {
    const { amount, description, expensetype } = req.body;
    const userId = req.user.id;
    console.log(userId);

    // Simple validation
    if (!amount || !description || !expensetype) {
      return res.status(400).json({
        message: "Amount, description, and expense type are required.",
      });
    }

    const payload = await Expense.create({
      amount,
      description,
      expensetype,
      userId,
    });
    console.log(payload);
    return res.status(201).json({
      message: "Expense added successfully",
      data: payload,
    });
  } catch (error) {
    console.error("Error submitting expense:", error); // Log the error for debugging
    return res.status(500).json({
      message: "Internal server error",
      error: error.message, // Optionally include the error message
    });
  }
};

exports.getAllexpenses = async (req, res) => {
  try {
    const userId = req.user.id; // Get the user's ID from the JWT token

    // Fetch all expenses that belong to the authenticated user
    const expenses = await Expense.findAll({ where: { userId } });
    const paidUser = await userInfo.findOne({
      where: { id: userId },
      attributes: ["ispremium"],
    });
    return res
      .status(200)
      .json({ data: expenses, ispremium: paidUser.ispremium });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const expense = await Expense.findOne({ where: { id } });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if the expense belongs to the authenticated user
    if (expense.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this expense" });
    }
    await Expense.destroy({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
  }
};
