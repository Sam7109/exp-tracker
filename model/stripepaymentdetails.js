const Sequelize = require("../utils/sequelize");
const { DataTypes } = require("sequelize");

const Stripepayments  = Sequelize.define("stripedetails", {
  pId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Stripepayments