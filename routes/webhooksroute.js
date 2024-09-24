const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const webhookcontroller = require('../controller/stripeintegrations')




router.post('/stripe-webhook',bodyParser.raw({ type: 'application/json' }), webhookcontroller.handleWebhook);

module.exports = router 