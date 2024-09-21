const express = require('express');
const app = express();
const router = express.Router();

app.use(express.json());

const authenticateToken = require("../middleware/authmiddleware"); 
const stripecontrollers = require('../controller/stripeintegrations')

router.post('/create-stripe-session',authenticateToken,stripecontrollers.createCheckoutSession) 
router.post('/stripe-webhook',stripecontrollers.handleWebhook)

module .exports = router