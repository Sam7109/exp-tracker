// config/aws.js
require('dotenv').config(); // Load environment variables from .env file
const AWS = require('aws-sdk');

// Configure AWS with your credentials from the environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Create S3 service object
const s3 = new AWS.S3();

module.exports = s3; // Export the S3 instance
