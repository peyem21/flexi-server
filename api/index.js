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

// Add this test endpoint to verify SMTP connection
app.get('/api/test-smtp', async (req, res) => {
    let transporter;
    try {
        transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: "contact@flexihomesrealty.com",
                pass: "Abuja912@"
            },
            debug: true
        });

        await transporter.verify();
        res.json({ message: 'SMTP connection successful' });
    } catch (error) {
        console.error('SMTP test failed:', error);
        res.status(500).json({
            error: 'SMTP connection failed',
            details: error.message
        });
    } finally {
        if (transporter) transporter.close();
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

// Modified email sending endpoint with enhanced error handling and logging
app.post('/api/send-email', upload.fields([
    { name: 'passport', maxCount: 1 },
    { name: 'validID', maxCount: 1 }
]), async (req, res) => {
    let transporter;
    try {
        // Debug log the incoming request
        console.log('Received form submission:', {
            body: { ...req.body, files: req.files ? Object.keys(req.files) : [] }
        });

        // Create transporter with debug logging
        console.log('Creating email transporter with config:', {
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: { user: "contact@flexihomesrealty.com" }
            // Don't log the password
        });

        transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: "contact@flexihomesrealty.com",
                pass: "Abuja912@"
            },
            debug: true, // Enable debug logging
            logger: true  // Enable built-in logger
        });

        const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

        // Log the extracted data
        console.log('Extracted form data:', { name, email, phoneNumber });

        // Input validation with detailed logging
        if (!name?.trim() || !email?.trim() || !phoneNumber?.trim()) {
            console.log('Validation failed - missing required fields:', { name, email, phoneNumber });
            return res.status(400).json({ 
                error: 'Required fields are missing',
                details: {
                    name: !name?.trim() ? 'missing' : 'present',
                    email: !email?.trim() ? 'missing' : 'present',
                    phoneNumber: !phoneNumber?.trim() ? 'missing' : 'present'
                }
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('Invalid email format:', email);
            return res.status(400).json({ error: 'Please provide a valid email address.' });
        }

        // Verify transporter before sending
        console.log('Verifying email transporter...');
        await transporter.verify();
        console.log('Transporter verified successfully');

        const mailOptions = {
            from: {
                name: 'FlexiHomes Realty',
                address: "contact@flexihomesrealty.com"
            },
            to: "contact@flexihomesrealty.com",
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

        // Log mail options (excluding sensitive data)
        console.log('Attempting to send email with options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            attachments: mailOptions.attachments ? mailOptions.attachments.length : 0
        });

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', {
            messageId: info.messageId,
            response: info.response
        });

        res.status(200).json({ 
            message: 'Form submitted successfully',
            messageId: info.messageId 
        });

    } catch (error) {
        // Enhanced error logging
        console.error('Detailed email error:', {
            name: error.name,
            message: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack,
            response: error.response,
            responseCode: error.responseCode
        });

        // Send appropriate error response based on the error type
        let errorResponse = {
            error: 'Failed to send email',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        };

        switch (error.code) {
            case 'EAUTH':
                errorResponse = {
                    error: 'Email authentication failed. Please check SMTP credentials.',
                    code: 'EAUTH'
                };
                break;
            case 'ESOCKET':
                errorResponse = {
                    error: 'Could not connect to email server. Please check SMTP settings.',
                    code: 'ESOCKET'
                };
                break;
            case 'ECONNECTION':
                errorResponse = {
                    error: 'Connection to email server failed.',
                    code: 'ECONNECTION'
                };
                break;
            case 'ETIMEDOUT':
                errorResponse = {
                    error: 'Connection to email server timed out.',
                    code: 'ETIMEDOUT'
                };
                break;
            default:
                // Keep the default error response
                break;
        }

        res.status(500).json(errorResponse);
    } finally {
        if (transporter) {
            console.log('Closing transporter connection');
            transporter.close();
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: production === 'development' ? err.message : undefined
    });
});

export default app;