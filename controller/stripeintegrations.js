const dotenv = require("dotenv");
dotenv.config();
const stripePayments = require('../model/stripepaymentdetails')
const userdetails = require('../model/signupinfo')


const stripe = require("stripe")(process.env.STR_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id; 
    const orderId = req.body.orderId;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
    //   metadata: {
    //     userId: userId.toString(),
    //     orderId: orderId.toString()
    // },
      line_items: [
        {
          price: "price_1Q1SQPRrY8jwzcAu8uYggQQb", // Predefined Price ID from Stripe
          quantity: 1, // Number of units of the product being purchased
        },
      ],
      mode: "payment", // Indicates a one-time payment
      success_url: `${req.headers.origin}/payment-success`, // URL to redirect to after a successful payment
      cancel_url: `${req.headers.origin}/paymentfailed.html`, // URL to redirect to if the payment is cancelled
    });

    res.json({ id: session.id, url: session.url }); // Sends back the session ID to the client
  } catch (err) {
    res.status(500).json({ error: err.message }); // Error handling
  }
};

exports.handleWebhook = (req, res) => {
    const sig = req.headers["stripe-signature"];
  
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.WEBHOOK_SECRET_KEY
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    switch (event.type) {
      case 'checkout.session.completed':
          const session = event.data.object;
          const orderId = session.metadata.orderId;
          const paymentStatus = session.payment_status; // Use this value to better describe the payment result in the database
  
          // Update database with the actual payment status (e.g., 'paid', 'requires_action')
          updateDatabaseWithOrderDetails(orderId, paymentStatus.toUpperCase());
          break;
  
      case 'payment_intent.failed':
      case 'charge.failed':
          const failedSession = event.data.object;
          const failedOrderId = failedSession.metadata.orderId;
          const failureMessage = failedSession.last_payment_error ? failedSession.last_payment_error.message : 'Payment failed';
  
          // Update database with failed payment status and reason
          updateDatabaseWithOrderDetails(failedOrderId, 'FAILED', failureMessage);
          break;
  
      default:
          console.log(`Unhandled event type ${event.type}`);
    }
  
    // Response to Stripe
    res.status(200).json({received: true});
  };
  

  async function updateDatabaseWithOrderDetails(userId, orderId, status, errorMessage = null) {
    try {
        // Start a transaction
        await sequelize.transaction(async (t) => {
            // Create or update a StripePayment entry
            await stripePayments.create({
                userId: userId,
                orderId: orderId,
                status: status
            }, { transaction: t });

            // Check if the payment was successful and update the Users model
            if (status === 'paid') {
                await userdetails.update({
                    ispremium: true
                }, {
                    where: { id: userId },
                    transaction: t
                });
            }

            console.log(`StripePayment created and User premium status updated for user ${userId}.`);
        });
    } catch (error) {
        console.error(`Error updating payment status for user ${userId}: ${error.message}`);
        throw error; // Rethrow the error if you want to handle it further up in the call stack
    }
}
