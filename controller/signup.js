const Details = require("../model/signupinfo");
const bcrypt = require("bcrypt");

exports.postSignupInfo = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingEmail = await Details.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const savedPayload = await Details.create({ email, username, password });
    return res
      .status(201)
      .json({ message: "Signup successful", data: savedPayload });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.isValidUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userInfo = await Details.findOne({ where: { email } });
    if (!userInfo) {
      return res.status(400).json({ message: "Email not found" });
    }

    const isPasskey = await bcrypt.compare(password, userInfo.password);

    if (!isPasskey) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    return res.status(200).json({
      email: userInfo.email,
      username: userInfo.email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
