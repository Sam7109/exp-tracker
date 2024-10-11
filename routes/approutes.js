const express = require('express');            
const router = express.Router();  
const signupController = require('../controller/signup')


router.post('/signupdetails',signupController.postSignupInfo)
router.post('/isvalid',signupController.isValidUser)

router.post('/forgotPassword',signupController.forgotPassword)
router.get('/reset-Password/:id',signupController.resetPassword)


router.post('/update-Password/:id', signupController.updatePassword);



module.exports = router  