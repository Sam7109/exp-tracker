const Sequelize = require("../utils/sequelize");
const { DataTypes } = require("sequelize");

const Stripepayments  = Sequelize.define("stripedetails", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Stripepayments