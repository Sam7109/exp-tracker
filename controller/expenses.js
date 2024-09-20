const Expense = require("../model/expenses");

exports.submitExpense = async (req, res) => {
  try {
    const { amount, description, expensetype } = req.body;
    console.log("Request body:", req.body);

    // Simple validation
    if (!amount || !description || !expensetype) {
      return res.status(400).json({
        message: "Amount, description, and expense type are required.",
      });
    }

    const payload = await Expense.create({ amount, description, expensetype });

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
    const data = await Expense.findAll();
    return res.status(200).json({
      data: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params.data);
    const searchItem = await Expense.destroy({ where: { id } });
    console.log(searchItem);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
  }
};
