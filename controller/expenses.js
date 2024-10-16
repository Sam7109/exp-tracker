const Expense = require("../model/expenses");
const signupModel = require("../model/signupinfo");

const sequelize = require("../utils/sequelize");
const { Parser } = require("json2csv");

const AWS = require("aws-sdk");
const s3 = require("../AWS-Configs/aws"); // Ensure you have the AWS SDK configured

exports.submitExpense = async (req, res) => {
  try {
    const transaction = await sequelize.transaction();
    const { amount, description, expensetype } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Simple validation
    if (!amount || !description || !expensetype) {
      return res.status(400).json({
        message: "Amount, description, and expense type are required.",
      });
    }

    const payload = await Expense.create(
      {
        amount,
        description,
        expensetype,
        userId,
      },
      { transaction }
    );

    // Find the record in the `UserInfo` table using the email
    const user = await signupModel.findOne(
      {
        where: { email: userEmail },
        attributes: ["userId", "email"], // Fetch the existing userId and email
      },
      { transaction }
    );

    if (!user) {
      await transaction.rollback();
      return res.status(400).json({
        message: "No such user exist",
      });
    }
    if (!user.userId) {
      await signupModel.update(
        { userId: userId }, // Field to update
        { where: { email: userEmail }, transaction } // Condition to identify which row to update
      );
    }
    await transaction.commit();
    return res.status(201).json({
      message: "Expense added successfully",
      data: payload,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error submitting expense:", error); // Log the error for debugging
    return res.status(500).json({
      message: "Internal server error",
      error: error.message, // Optionally include the error message
    });
  }
};

exports.getAllexpenses = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id; // Get the user's ID from the JWT token

    // Extract pagination parameters from the request
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to limit 10 if not provided
    const offset = (page - 1) * limit; // Calculate offset

    // Fetch expenses that belong to the authenticated user with pagination
    const expenses = await Expense.findAndCountAll({
      where: { userId },
      limit: limit,
      offset: offset,
      transaction,
    });

    const paidUser = await signupModel.findOne(
      { where: { id: userId }, attributes: ["ispremium"] },
      { transaction }
    );

    await transaction.commit();

    // Check if expenses are found
    if (!expenses.rows.length) {
      return res
        .status(404)
        .json({ message: "No expenses found for this user." });
    }

    // Calculate total pages
    const totalPages = Math.ceil(expenses.count / limit); // Calculate total pages

    // Check the requested format (e.g., json or csv)
    const format = req.query.format || "json"; // Default to 'json' if no format is specified

    if (format === "csv") {
      // Format expenses for CSV
      const expenseData = expenses.rows.map((expense) => ({
        Amount: expense.amount.toFixed(2),
        Description: expense.description,
        ExpenseType: expense.expensetype,
        Date: new Date(expense.createdAt).toLocaleDateString(),
      }));

      // Define CSV fields based on the model definition
      const csvFields = ["Amount", "Description", "ExpenseType", "Date"];
      const json2csvParser = new Parser({ fields: csvFields });
      const csv = json2csvParser.parse(expenseData);

      // Define S3 upload parameters
      const params = {
        Bucket: process.env.S3_BUCKET_NAME, // Your S3 bucket name
        Key: `user_expenses_${userId}_${Date.now()}.csv`, // Unique file name
        Body: csv, // The CSV data to upload
        ContentType: "text/csv", // Set the content type 
      };

      // Upload the CSV to S3
      s3.upload(params, (err, data) => {
        if (err) {
          console.error("Error uploading file to S3:", err);
          return res.status(500).json({ message: "Failed to upload file to S3" });
        }

        // Generate a pre-signed URL for the uploaded file
        const presignedUrlParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: params.Key,
          Expires: 60 * 5, // URL expiration time (5 minutes)
        };

        s3.getSignedUrl("getObject", presignedUrlParams, (urlErr, presignedUrl) => {
          if (urlErr) {
            console.error("Error generating pre-signed URL:", urlErr);
            return res.status(500).json({ message: "Failed to generate pre-signed URL" });
          }

          return res.status(200).json({
            message: "File uploaded successfully",
            fileUrl: presignedUrl, // Return the pre-signed URL
          });
        });
      });
    } else {
      // Default JSON response with pagination information
      return res.status(200).json({
        data: expenses.rows, // The fetched expenses
        ispremium: paidUser.ispremium,
        currentPage: page, // Current page number
        totalPages: totalPages, // Total number of pages
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.deleteExpense = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start a new transaction

  try {
    const { id } = req.params; // Extract expense ID from request parameters
    const userId = req.user.id; // Get the authenticated user's ID

    // Find the expense by ID within the transaction context
    const expense = await Expense.findOne({ where: { id } }, { transaction });
    if (!expense) {
      await transaction.rollback(); // Rollback the transaction if the expense is not found
      return res.status(404).json({ message: "Expense not found" });
    }

    // Check if the expense belongs to the authenticated user
    if (expense.userId !== userId) {
      await transaction.rollback(); // Rollback if the user is not authorized
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this expense" });
    }

    // Delete the expense within the same transaction context
    await Expense.destroy({ where: { id } }, { transaction });

    await transaction.commit(); // Commit the transaction if everything is successful
    return res.status(204).send(); // Send a 204 No Content response for successful deletion
  } catch (error) {
    await transaction.rollback(); // Rollback the transaction on error
    console.error("Error deleting expense:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getLeaderboardDetails = async (req, res) => {
  try {
    const transaction = await sequelize.transaction();
    // Use a join query to fetch the username and total expense for all users
    const userExpenses = await signupModel.findAll({
      attributes: [
        "id", // Include the id from SignupModel
        "username", // Include the username from SignupModel
        "userId", // Include userId for grouping
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("dailyexpenses.amount")),
            0
          ),
          "totalExpense",
        ], // Calculate total expense, handle nulls with COALESCE
      ],
      include: [
        {
          model: Expense, // Include the Expense model
          attributes: [], // No need to include individual expense fields
          required: false, // Use LEFT JOIN to include users with no expenses
        },
      ],
      //  group: ['userdetails.userId'], // Group by userId to get the total for each user
      group: ["userdetails.id", "userdetails.username", "userdetails.userId"], // Include all non-aggregated columns
      order: [[sequelize.literal("totalExpense"), "DESC"]],
    });

    return res.status(200).json({
      message: "Total expenses for all users fetched successfully",
      data: userExpenses,
    });
  } catch (error) {
    console.error("Error fetching total expenses for all users:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
