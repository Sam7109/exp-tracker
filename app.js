const express = require("express");
const Details = require('./model/signupinfo');
const Expense = require('./model/expenses')
const sequelize = require('./utils/sequelize')

const signupRoutes = require('./routes/approutes')
const expenseroutes = require('./routes/expenseroutes')


const stripepayments = require('./routes/striperoutes')


const bodyParser = require("body-parser");
require("dotenv").config();

const path = require("path");
const app = express();
app.use(express.json());


const cors = require("cors");
app.use(cors());
const port = process.env.port;

// Middleware to parse incoming requests with JSON payloads
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "views", "loginsignup.html")));

app.use('/home',signupRoutes)
app.use('/api', expenseroutes); // Make sure you're using a base route like '/api'
app.use('/stripe-payments',stripepayments)



app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "loginsignup.html"));
});

app.get("/expense", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "expensepage.html"));
});

app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'paymentsuccess.html'));
});

app.get('/payment-cancel', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'paymentfailed.html'));
});


sequelize.sync({ force: false}) // force: true will drop existing tables
  .then(() => {
    console.log('Database synchronized');
    // Start the server
    app.listen(port, () => {
      console.log(`Running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Error syncing the database:', err);
  });





