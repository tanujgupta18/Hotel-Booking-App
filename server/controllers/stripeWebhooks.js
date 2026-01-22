import stripe from "stripe";
import Booking from "../models/Booking.js";

// API To handle Stripe Webhook
export const stripeWebhooks = async (req, res) => {
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripeInstance.webhooks.contructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  if (event.type === "payemnt_intent.succeeded") {
    const paymentIntend = event.data.object;
    const paymentIntendId = paymentIntend.id;

    // Getting Sesssion MetaData
    const session = await stripeInstance.checkout.sessions.list({
      payment_intend: paymentIntendId,
    });

    const { bookingId } = session.data[0].metadata;

    // Mark Payment as paid
    await Booking.findByIdAndUpdate(bookingId, {
      isPaid: true,
      paymentMethod: "Stripe",
    });
  } else {
    console.log("Unhandled event type:", event.type);
  }
  res.json({ received: true });
};
