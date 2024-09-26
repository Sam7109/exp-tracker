const dotenv = require("dotenv");
dotenv.config();

const stripePayments = require("../model/stripepaymentdetails");
const userdetails = require("../model/signupinfo");
const endpointSecret = process.env.WEBHOOK_SECRET_KEY;

const stripe = require("stripe")(process.env.STR_SECRET_KEY);

// exports.handleWebhook = async (req, res) => {
//   const sig = req.headers["stripe-signature"];

//   let event = null;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     console.log("fuck", event);
//     console.log(req.body);
//   } catch (err) {
//     console.log(err);
//     console.error("Webhook Error:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   try {
//     switch (event["type"]) {
//       case "payment_intent.succeeded":
//         const paymentIntent = event.data.object;
//          const amount = paymentIntent.amount
//          const status = paymentIntent.status
//          console.log("oleeeeeeeeeee",amount,status)
//          updateUserdetails(amount,status)
//         // Here you might want to call your function to handle the success case

//         case "checkout.session.completed":
//             const userdetail = event.data.object;
//            const userId = userdetail.metadata.userId
//            usertransactionDetails(userId,amount,status)

//         break;
//       case "payment_intent.payment_failed":
//         const intentFailed = event.data.object;
//         const message =
//           intentFailed.last_payment_error &&
//           intentFailed.last_payment_error.message;
//         console.log("Failed:", intentFailed.id, message);
//         // Here you might want to call your function to handle the failure case
//         break;
//     }
//     res.sendStatus(200); // Acknowledge the event was processed correctly
//   } catch (error) {
//     console.log(error);
//     console.error(`Error processing Stripe event: ${error.message}`);
//     res.status(500).send("Internal Server Error");
//   }
// };

// Simple object to store details temporarily in memory
let details = {};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event = null;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Webhook event:", event);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event["type"]) {
      // Case 1: Handle payment intent succeeded
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;
        const amount = paymentIntent.amount;
        const status = paymentIntent.status;

        console.log("Payment Intent Succeeded:", amount, status);

        // Store amount and status in memory
        details[paymentIntentId] = details[paymentIntentId] || {};
        details[paymentIntentId].amount = amount;
        details[paymentIntentId].status = status;

        break;

      // Case 2: Handle checkout session completed
      case "checkout.session.completed":
        const session = event.data.object;
        const userId = session.metadata.userId; // Get userId from session metadata
        const paymentIntentIdFromSession = session.payment_intent;

        console.log("Checkout Session Completed for User:", userId);

        // Store userId in memory
        details[paymentIntentIdFromSession] =
          details[paymentIntentIdFromSession] || {};
        details[paymentIntentIdFromSession].userId = userId;

        // Check if amount and status are already available
        if (
          details[paymentIntentIdFromSession].amount &&
          details[paymentIntentIdFromSession].status
        ) {
          // Now that we have both userId, amount, and status, we can update/create the transaction
          await updateUserTransaction(
            details[paymentIntentIdFromSession].userId,
            details[paymentIntentIdFromSession].amount,
            details[paymentIntentIdFromSession].status
          );

          // Clean up after processing
          delete details[paymentIntentIdFromSession];
        }

        break;

      case "payment_intent.payment_failed":
        const intentFailed = event.data.object;
        const message =
          intentFailed.last_payment_error?.message || "Unknown error";
        console.log("Payment Failed:", intentFailed.id, message);
        break;

      default:
        console.log(`Unhandled event type: ${event["type"]}`);
    }

    res.sendStatus(200); // Acknowledge the event was processed correctly
  } catch (error) {
    console.error(`Error processing Stripe event: ${error.message}`);
    res.status(500).send("Internal Server Error");
  }
};

// Function to update or create a user transaction in the database
async function updateUserTransaction(userId, amount, status) {
  try {
    await userdetails.update(
      {
        ispremium: true, // Set or update the value of ispremium
        // Add any other fields you want to update, e.g., amount, status, etc.
      },
      {
        where: {
          id: userId, // Make sure you're updating the correct user based on their ID or another identifier
        },
      }
    );

    // Find or create a transaction record for the user
    const [transaction, created] = await stripePayments.findOrCreate({
      where: { userId: userId },
      defaults: { amount, status },
    });

    // If the transaction already exists, update the details
    if (!created) {
      transaction.amount = amount;
      transaction.status = status;
      await transaction.save();
      console.log(`Transaction updated for user ${userId}`);
    } else {
      console.log(`New transaction created for user ${userId}`);
    }
  } catch (error) {
    console.error("Error updating/creating transaction:", error);
  }
}

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
//`${req.headers.origin}/payment-success`,