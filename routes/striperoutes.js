const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const authenticateToken = require('../middleware/authmiddleware');
const stripeControllers = require('../controller/stripeintegrations');

// Apply raw middleware specifically for Stripe webhook route

router.post('/create-stripe-session', authenticateToken, stripeControllers.createCheckoutSession);

module.exports = router;
