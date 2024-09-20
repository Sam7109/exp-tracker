const Sequelize = require("../utils/sequelize");
const { DataTypes } = require("sequelize");

const Expense = Sequelize.define('dailyexpense',{
    amount : {
        type : DataTypes.FLOAT ,
        allowNull : false ,   
    },
    description : {
        type : DataTypes.STRING ,
        allowNull : false
    },
    expensetype : {
        type : DataTypes.STRING,
        allowNull : false
    }
})

module.exports = Expense