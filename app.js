const express = require("express");
const app = express();
const Details = require('./model/signupinfo');
const Expense = require('./model/expenses')

const sequelize = require('./utils/sequelize')
const signupModel = require('./model/signupinfo')

const signupRoutes = require('./routes/approutes')
const expenseroutes = require('./routes/expenseroutes')
const port = process.env.port;


const stripepayments = require('./routes/striperoutes')
const webhookroutes = require('./routes/webhooksroute')
require("dotenv").config();

const path = require("path");

app.use('/webhooks',webhookroutes)
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); 


const cors = require("cors");
app.use(cors());


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

signupModel.hasMany(Expense, { foreignKey: 'userId' });
Expense.belongsTo(signupModel, { foreignKey: 'userId' });

sequelize.sync() // {alter:true} force: true will drop existing tables //{ alter:true} will match with model definitions 
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





