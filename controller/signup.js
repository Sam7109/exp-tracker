const Details = require("../model/signupinfo");
const jwt = require('jsonwebtoken');

const bcrypt = require("bcrypt");
const dotenv = require('dotenv');
dotenv.config();

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

// exports.isValidUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const userInfo = await Details.findOne({ where: { email } });
//     if (!userInfo) {
//       return res.status(400).json({ message: "Email not found" });
//     }

//     const isPasskey = await bcrypt.compare(password, userInfo.password);

//     if (!isPasskey) {
//       return res.status(400).json({ message: "Incorrect password" });
//     }
//     const token = jwt.sign(
//       { id: userInfo.id, email: userInfo.email }, // Payload with user ID and email
//       process.env.JWT_SECRET, // Secret key for signing the JWT
//       { expiresIn: "1h" } // Token expiration time (optional)
      
//     );
//     return res.status(200).json({ 
//       message: "Login successful",
//       token: token, // Include the token in the response
//       user: {
//         id: userInfo.id,
//         email: userInfo.email,
//         username: userInfo.username
//       }
//     });
    
//   } 
//   catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
// const Details = require("../model/signupinfo");
// const jwt = require('jsonwebtoken');
// const bcrypt = require("bcrypt");
// const dotenv = require('dotenv');

dotenv.config(); // Ensure environment variables are loaded

exports.postSignupInfo = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log("Received signup data:", { username, email, password });
    
    const existingEmail = await Details.findOne({ where: { email } });
    if (existingEmail) {
      console.log("Email already exists");
      return res.status(400).json({ message: "Email already exists" });
    }

    const savedPayload = await Details.create({ email, username, password });
    console.log("Signup successful:", savedPayload);

    return res.status(201).json({ message: "Signup successful", data: savedPayload });
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.isValidUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Received login data:", { email, password });
    
    const userInfo = await Details.findOne({ where: { email } });
    if (!userInfo) {
      console.log("Email not found");
      return res.status(400).json({ message: "Email not found" });
    }

    const isPasskey = await bcrypt.compare(password, userInfo.password);
    if (!isPasskey) {
      console.log("Incorrect password");
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Check if JWT_SECRET is loaded
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in .env file");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign(
      { id: userInfo.id, email: userInfo.email }, // Payload with user ID and email
      process.env.JWT_SECRET, // Secret key for signing the JWT
      { expiresIn: "1h" } // Token expiration time
    );
    console.log("token generated successfully",token)


    return res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
