require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 4000;


app.use(cors()); // Enable CORS for all routes

// Middleware to parse request body
app.use(bodyParser.json());

// Store OTP temporarily (consider using a more secure approach for production)
let otp;

// Generate a random 6-digit OTP
function generateOTP() {
    otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

// Function to send email using SMTP
async function sendEmail(receiverEmail, message) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SENDER_EMAIL,
            pass: process.env.SENDER_PASSWORD
        }
    });

    let mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: receiverEmail,
        subject: 'Your OTP',
        text: message
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent to:", receiverEmail);
        console.log("Message:", message);
    } catch (error) {
        console.error("Failed to send email. Error: ", error);
    }
}

// Endpoint to handle email submission
app.post('/submit', async (req, res) => {
    // console.log(req.body);
    const emailInput = req.body.emailInput;

    if (!/\S+@\S+\.\S+/.test(emailInput)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    try {
        otp = generateOTP();
        const message = `Your OTP to LOGIN AI TUTOR is: ${otp}`;
        await sendEmail(emailInput, message);
        res.json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});


// Endpoint to verify OTP
app.post('/otp', (req, res) => {
    const otpInput = req.body.otpInput;
    if (otpInput === otp) {
        res.json({ result: 0, message: 'Verified' });
    } else {
        res.status(400).json({ result: 1, message: 'Incorrect OTP' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
