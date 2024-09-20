const express = require('express');            
const router = express.Router();  
const signupController = require('../controller/signup')


router.post('/signupdetails',signupController.postSignupInfo)
router.post('/isvalid',signupController.isValidUser)

// expenses routes 




module.exports = router