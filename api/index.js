// api/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';

const app = express();

// Define allowed origins explicitly including your Vercel domains
const allowedOrigins = [
    'http://localhost:3000',
    // 'http://localhost:5173',
    'https://flexihomesrealty.com',        // Your frontend domain
    'https://new-flexi-server.vercel.app'    // Your backend domain
];

// CORS configuration
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Add this before your routes
app.use((req, res, next) => {
    console.log('Request from:', req.headers.origin);
    console.log('Request method:', req.method);
    next();
});
// Enable pre-flight requests for all routes
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Please fill in all fields.' });
        }
        
        console.log('Contact form submitted:', req.body);
        res.status(200).json({ message: 'Contact form submitted successfully!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Email sending endpoint
app.post('/api/send-email', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'validID', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

        if (!name || !email || !phoneNumber) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
        });

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER,
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

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Form submitted successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});
export default app;