const Details = require("../model/signupinfo");
const userInfo = require("../model/signupinfo");

const uuid = require("uuid");
const brevo = require("sib-api-v3-sdk");

const defaultClient = brevo.ApiClient.instance;
const ApiKeyAuth = defaultClient.authentications["api-key"];
ApiKeyAuth.apiKey = process.env.SENDINBLUE_API_KEY;

const resetPassmodel = require("../model/forgotpassword");
const { v4: uuidv4 } = require("uuid");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

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
    console.log("token generated successfully", token);

    return res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Received Email:", email);

    const user = await Details.findOne({ where: { email } });
    if (user) {
      const id = uuidv4();
      await resetPassmodel.create({ id, active: true, userId: user.id });

      const apiInstance = new brevo.TransactionalEmailsApi();
      const sender = {
        email: "samarthpatilc7@gmail.com",
        name: "samarth",
      };

      const receiver = [
        {
          email: email, // Use the provided email from req.body
        },
      ];

      const sentMail = await apiInstance.sendTransacEmail({
        sender,
        to: receiver,
        subject: "Reset Password",
        htmlContent: `<a href="${process.env.API_BASE_URL}/home/reset-Password/${id}">Reset password</a>`,
      });

      return res.status(200).json({
        message: "Password reset link sent to your email",
        data: sentMail,
      });
    } else {
      return res.status(400).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Internal server error!! try again" });
  }
};

// Reset Password Function
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received Reset ID:", id);

    // Check if ID is valid
    if (!id) {
      return res.status(400).json({ message: "Invalid or missing reset ID" });
    }

    const forgotPasswordRequest = await resetPassmodel.findOne({
      where: { id },
    });
    console.log("Reset Password Request:", forgotPasswordRequest);

    if (forgotPasswordRequest) {
      await forgotPasswordRequest.update({ active: false });

      res.status(200).send(`
        <html>
        <script>
            function formsubmitted(e){
              
                console.log('Form submitted');
            }
        </script>
        <form action="/home/update-Password/${id}" method="post" onsubmit="formsubmitted(event)">
          <h4>Reset Password for ID: ${id}</h4>
            <label for="newPassword">Enter New password</label>
            <input name="newPassword" type="password" required></input>
            <small>Minimum 8 characters long and must contain at least one number.</small> <br>
              <button type="submit">Reset Password</button>
        </form>
        </html>
      `);
    } else {
      res.status(404).json({ message: "Reset password request not found" });
    }
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Update Password Function
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Received Update ID:", id);

    if (!id) {
      return res.status(400).json({ message: "Invalid or missing ID" });
    }
    console.log("Request Body:", req.body);
    const { newPassword } = req.body; // Extract newPassword from request body
    console.log("Received New Password:", newPassword);

    const resetPasswordRequest = await resetPassmodel.findOne({
      where: { id: req.params.id },
    });
    console.log("Password Reset Request:", resetPasswordRequest);

    if (resetPasswordRequest) {
      const user = await Details.findOne({
        where: { id: resetPasswordRequest.userId },
      });

      if (user) {
        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
        await user.update({ password: hashedPassword });

        res.status(201).send(`
          <html>
          <head>
              <title>Password Updated</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      height: 100vh;
                      margin: 0;
                      background-color: #f0f0f0;
                  }
                  .message {
                      background-color: #d4edda;
                      border-color: #c3e6cb;
                      color: #155724;
                      padding: 20px;
                      border-radius: 5px;
                      text-align: center;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  }
              </style>
          </head>
          <body>
              <div class="message">
                  <h2>Password successfully updated.</h2>
                  <p>Log into your expense tracker account again.</p>
              </div>
          </body>
          <script>
              document.addEventListener('DOMContentLoaded', () => {
                  setTimeout(() => {
                      window.location.href = "${process.env.API_HOME}";
                  }, 3000);
              });
          </script>
          </html>
        `);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.status(401).json({ error: "Reset password request is not valid" });
    }
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
