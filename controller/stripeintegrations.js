const dotenv = require("dotenv");
dotenv.config();

const stripePayments = require("../model/stripepaymentdetails");
const userdetails = require("../model/signupinfo");
const endpointSecret = process.env.WEBHOOK_SECRET_KEY;

console.log("*******samarth****", endpointSecret);

const stripe = require("stripe")(process.env.STR_SECRET_KEY);

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event = null;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("fuck", event);
    console.log(req.body);
  } catch (err) {
    console.log(err);
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event["type"]) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
         const amount = paymentIntent.amount
         const status = paymentIntent.status
         console.log("oleeeeeeeeeee",amount,status)
        // Here you might want to call your function to handle the success case

        case "checkout.session.completed":
            const userdetail = event.data.object; 
           const userId = userdetail.metadata.userId
           console.log(userId,"$$$$$$$$$$$$$$$$$$$$$$$$$");
        break;
      case "payment_intent.payment_failed":
        const intentFailed = event.data.object;
        const message =
          intentFailed.last_payment_error &&
          intentFailed.last_payment_error.message;
        console.log("Failed:", intentFailed.id, message);
        // Here you might want to call your function to handle the failure case
        break;
    }
    res.sendStatus(200); // Acknowledge the event was processed correctly
  } catch (error) {
    console.log(error);
    console.error(`Error processing Stripe event: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      metadata: {
        userId: userId.toString(),
      },
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
