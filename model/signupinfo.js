const Sequelize = require("../utils/sequelize");
const { DataTypes } = require("sequelize");
const bcrypt = require('bcrypt');


const Details = Sequelize.define("userdetails", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true, // Validate that the email is in the correct format
    },
    set(value) {
      // Convert email to lowercase before saving
      this.setDataValue("email", value.toLowerCase());
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Details.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  });

module.exports = Details;
