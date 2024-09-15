const express = require('express');            
const router = express.Router();  
const signupController = require('../controller/signup')

router.post('/signupdetails',signupController.postSignupInfo)

module.exports = router