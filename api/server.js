const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Vercel sets this environment variable

// Set up CORS to allow requests from your frontend URL
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from your React app's local dev environment
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));

  
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handle Contact Us submissions
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill in all fields.' });
    }

    // Log the contact form submission
    console.log('Contact form submitted:', req.body);
    res.status(200).json({ message: 'Contact form submitted successfully!' });
});

// Handle Affiliate Application submissions
app.post('/send-email', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'validID', maxCount: 1 }
]), (req, res) => {
    console.log('Form fields:', req.body);
    console.log('Files:', req.files);

    const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

    if (!name || !email || !phoneNumber) {
        return res.status(400).json({ error: 'Required fields are missing' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER, // Use environment variable
            pass: process.env.EMAIL_PASS, // Use environment variable
        },
    });

    const mailOptions = {
        from: 'contact@flexihomesrealty.com',
        to: 'contact@flexihomesrealty.com',
        subject: 'New Affiliate Application',
        text: `
            New Affiliate Application:
            Name: ${name}
            Email: ${email}
            Phone Number: ${phoneNumber}
            Address: ${address || 'Not provided'}
            Website: ${website || 'Not provided'}
            Bank Name: ${bankName || 'Not provided'}
            Account Number: ${acctNo || 'Not provided'}
        `,
        attachments: [
            req.files['passport'] ? {
                filename: req.files['passport'][0].originalname,
                content: req.files['passport'][0].buffer
            } : null,
            req.files['validID'] ? {
                filename: req.files['validID'][0].originalname,
                content: req.files['validID'][0].buffer
            } : null
        ].filter(Boolean)
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            res.status(500).json({ error: 'Failed to send email' });
        } else {
            console.log('Email sent:', info.response);
            res.status(200).json({ message: 'Form submitted successfully' });
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
