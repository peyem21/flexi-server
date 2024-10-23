const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (you can modify the origin if necessary)
app.use(cors({
   origin: '*', 
   methods: ['GET', 'POST'],
   allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Configure multer for file uploads (files stored in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handle Contact Us form submissions
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    // Validate fields
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill in all fields.' });
    }

    console.log('Contact form submitted:', req.body);

    // Simulate sending an email response for testing
    res.status(200).json({ message: 'Contact form submitted successfully!' });
});

// Handle Affiliate Application submissions with file upload
app.post('/send-email', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'validID', maxCount: 1 }
]), (req, res) => {
    console.log('Form fields:', req.body);
    console.log('Files:', req.files);

    const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

    // Validate fields
    if (!name || !email || !phoneNumber) {
        return res.status(400).json({ error: 'Required fields are missing' });
    }

    // Configure Nodemailer with environment variables (replace with actual values in production)
    const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,  // Add your email user to .env
            pass: process.env.EMAIL_PASS   // Add your email pass to .env
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
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
        ].filter(Boolean)  // Remove null values
    };

    // Send email with Nodemailer
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        }
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Form submitted successfully!' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
