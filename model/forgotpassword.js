const Sequelize = require("sequelize");
const sequelize = require('../utils/sequelize');

const ForgotPassword = sequelize.define('forgotPasswordRequests', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      // Removed defaultValue to ensure only manually passed IDs are used
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,  // Optional: Set a default value for the `active` column
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,  // Ensures userId is always provided
    },
  }, {
    timestamps: true,  // Adds createdAt and updatedAt fields automatically
  });
module.exports = ForgotPassword;