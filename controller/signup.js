const Details = require("../model/signupinfo");
const { use } = require("../routes/approutes");

exports.postSignupInfo = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingEmail = await Details.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const savedPayload = await Details.create({email, username, password});
    return res
      .status(201)
      .json({ message: "Signup successful", data: savedPayload });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
