// api/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';

const app = express();

// Environment variables validation
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        // In production, you might want to throw an error instead
        // throw new Error(`Missing required environment variable: ${varName}`);
    }
});

// Define allowed origins explicitly including your Vercel domains
const allowedOrigins = [
    'http://localhost:3000',
    'https://flexihomesrealty.com',
    'https://new-flexi-server.vercel.app'
];

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.headers.origin}`);
    next();
});

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Configure multer with file size limits and type validation
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Create reusable transporter
const createTransporter = () => {
    try {
        // Log environment variables (remove in production)
        console.log('SMTP Configuration:', {
            host: "smtp.hostinger.com",
            port: '465',
            user: "contact@flexihomesrealty.com",
            pass: 'Abuja912@'
        });

        return nodemailer.createTransport({
            host: 'smtp.hostinger.com', // or your SMTP host
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: "contact@flexihomesrealty.com",
                pass: "Abuja912@"
            },
            tls: {
                rejectUnauthorized: true
            }
        });
    } catch (error) {
        console.error('Error creating transport:', error);
        throw error;
    }
};

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        res.json({ message: 'Email configuration is working' });
    } catch (error) {
        res.status(500).json({ 
            error: 'Email configuration failed',
            details: error.message 
        });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        // Input validation
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return res.status(400).json({ error: 'Please fill in all fields.' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }

        console.log('Contact form submitted:', { name, email });
        res.status(200).json({ message: 'Contact form submitted successfully!' });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Email sending endpoint
app.post('/api/send-email', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'validID', maxCount: 1 }
]), async (req, res) => {
    let transporter;
    try {
        // Create transporter
        transporter = createTransporter();

        const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

        // Input validation
        if (!name?.trim() || !email?.trim() || !phoneNumber?.trim()) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }

        // Log attempt to send email
        console.log('Attempting to send email with data:', {
            to: process.env.SMTP_USER,
            from: process.env.SMTP_USER,
            subject: 'New Affiliate Application'
        });

        const mailOptions = {
            from: {
                name: 'Your Company Name',
                address: process.env.SMTP_USER
            },
            to: process.env.SMTP_USER,
            subject: 'New Affiliate Application',
            html: `
                <h2>New Affiliate Application</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone Number:</strong> ${phoneNumber}</p>
                <p><strong>Address:</strong> ${address || 'Not provided'}</p>
                <p><strong>Website:</strong> ${website || 'Not provided'}</p>
                <p><strong>Bank Name:</strong> ${bankName || 'Not provided'}</p>
                <p><strong>Account Number:</strong> ${acctNo || 'Not provided'}</p>
            `,
            attachments: [
                req.files?.['passport']?.[0] && {
                    filename: req.files['passport'][0].originalname,
                    content: req.files['passport'][0].buffer
                },
                req.files?.['validID']?.[0] && {
                    filename: req.files['validID'][0].originalname,
                    content: req.files['validID'][0].buffer
                }
            ].filter(Boolean)
        };

        // Verify connection
        await transporter.verify();
        console.log('Transporter verified successfully');

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        res.status(200).json({ 
            message: 'Form submitted successfully',
            messageId: info.messageId 
        });

    } catch (error) {
        console.error('Detailed email error:', {
            message: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });

        // Specific error handling
        if (error.code === 'EAUTH') {
            return res.status(500).json({ error: 'Email authentication failed. Please check SMTP credentials.' });
        }
        if (error.code === 'ESOCKET') {
            return res.status(500).json({ error: 'Could not connect to email server. Please check SMTP settings.' });
        }

        res.status(500).json({ 
            error: 'Failed to send email',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    } finally {
        if (transporter) {
            transporter.close();
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;