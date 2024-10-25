// api/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';

const app = express();

// CORS configuration with debugging
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://flexihomesrealty.com',    // Add your domain
    'https://www.flexihomesrealty.com', // Add www subdomain
    'https://www.flexi-homes.vercel.app/' // Add any deployment domains
];

console.log('Allowed origins:', allowedOrigins); // Debug log

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  maxAge: 86400 // CORS preflight cache time in seconds
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Handle preflight requests
app.options('*', cors(corsOptions));

// Contact form endpoint
app.post('/api/contact', cors(corsOptions), (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please fill in all fields.' });
    }
    
    console.log('Contact form submitted:', req.body);
    res.status(200).json({ message: 'Contact form submitted successfully!' });
});

// Email sending endpoint with file upload
app.post('/api/send-email', cors(corsOptions), upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'validID', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

        // Validation
        if (!name || !email || !phoneNumber) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        // Create transporter using environment variables
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

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Form submitted successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    if (err.message === 'Not allowed by CORS') {
        res.status(403).json({
            error: 'CORS error',
            message: 'Origin not allowed',
            requestOrigin: req.headers.origin,
            allowedOrigins: allowedOrigins
        });
    } else {
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    }
});

// Error handling for CORS
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        res.status(403).json({
            error: 'CORS error: Origin not allowed',
            message: 'Please ensure you are making requests from an authorized domain'
        });
    } else {
        next(err);
    }
});

// Handle 404s
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

export default app;