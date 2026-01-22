import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import stripe from "stripe";

// Function to check Availability of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });

    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    console.log(error.message);
  }
};

// API To Check Availablity of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API To Create a new booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    // Before Booking Check Availability
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    // Get totalPrice from Room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    // Calculate totalPrice based on nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    totalPrice *= nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    const mailOptions = {
      from: `"QuickStay" <${process.env.SENDER_EMAIL}>`,
      to: req.user.email,
      subject: "Your Booking is Confirmed – QuickStay 🏨",
      html: `
        <div style="max-width:600px;margin:auto;font-family:'Outfit',Arial,Helvetica,sans-serif;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#ffffff">

        <!-- Header -->
        <div style="background:#2563eb;color:#ffffff;padding:24px;text-align:center">
          <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-weight:600">
            QuickStay
          </h1>
          <p style="margin:6px 0 0;font-size:14px;opacity:0.95">
            Booking Confirmation
          </p>
        </div>

        <!-- Body -->
        <div style="padding:24px;color:#374151;font-size:15px;line-height:1.6">

          <p style="margin-top:0">
            Hi <strong>${req.user.username}</strong>,
          </p>

          <p>
            Thank you for booking with <strong>QuickStay</strong>!  
            Your reservation has been successfully confirmed. Below are your booking details:
          </p>

          <h2 style="margin:24px 0 12px;font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#111827">
            Booking Details
          </h2>

          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr>
              <td style="padding:8px 0;color:#6b7280">Booking ID</td>
              <td style="padding:8px 0;font-weight:500">${booking._id}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280">Hotel</td>
              <td style="padding:8px 0;font-weight:500">${roomData.hotel.name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280">Location</td>
              <td style="padding:8px 0">${roomData.hotel.address}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280">Check-In</td>
              <td style="padding:8px 0">
                ${new Date(booking.checkInDate).toDateString()}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280">Check-Out</td>
              <td style="padding:8px 0">
                ${new Date(booking.checkOutDate).toDateString()}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#6b7280">Guests</td>
              <td style="padding:8px 0">${booking.guests}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;color:#111827;font-weight:600">
                Total Amount
              </td>
              <td style="padding:12px 0;font-weight:700;color:#2563eb">
                ${process.env.CURRENCY || "$"} ${booking.totalPrice}
              </td>
            </tr>
          </table>

          <p style="margin-top:24px">
            We look forward to welcoming you and hope you have a wonderful stay.
          </p>

          <p style="margin-bottom:0">
            Regards,<br />
            <strong>Team QuickStay</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#6b7280">
          © ${new Date().getFullYear()} QuickStay. All rights reserved.
        </div>

      </div>

      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Booking created successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to create booking" });
  }
};

// API To get all bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user }).populate("room hotel").sort({
      createdAt: -1,
    });
    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

// API To get hotel bookings
// GET /api/bookings/hotel
export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }
    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({
        createdAt: -1,
      });

    // Total Bookings
    const totalBookings = bookings.length;

    // Total Revenue
    const totalRevenue = bookings.reduce(
      (acc, booking) => acc + booking.totalPrice,
      0,
    );

    res.json({
      success: true,
      dashboardData: { totalBookings, totalRevenue, bookings },
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

export const stripePayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    const roomData = await Room.findById(booking.room).populate("hotel");
    const totalPrice = booking.totalPrice;
    const { origin } = req.headers;

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: roomData.hotel.name,
          },
          unit_amount: totalPrice * 100,
        },
        quantity: 1,
      },
    ];

    // Create Checkout Session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader/my-bookings`,
      success_url: `${origin}/my-bookings`,
      meta_data: {
        bookingId,
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.json({ success: false, message: "Payment Failed" });
  }
};
