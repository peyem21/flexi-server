// // api/index.js
// import express from 'express';
// import cors from 'cors';
// import multer from 'multer';
// import nodemailer from 'nodemailer';

// const app = express();

// // Define allowed origins explicitly including your Vercel domains
// const allowedOrigins = [
//     'http://localhost:3000',
//     // 'http://localhost:5173',
//     'https://flexihomesrealty.com',        // Your frontend domain
//     'https://new-flexi-server.vercel.app'    // Your backend domain
// ];

// // CORS configuration
// app.use(cors({
//     origin: allowedOrigins,
//     methods: ['GET', 'POST', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//     optionsSuccessStatus: 200
// }));

// // Add this before your routes
// app.use((req, res, next) => {
//     console.log('Request from:', req.headers.origin);
//     console.log('Request method:', req.method);
//     next();
// });
// // Enable pre-flight requests for all routes
// app.options('*', cors());

// // Parse JSON bodies
// app.use(express.json());

// // Configure multer for memory storage
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Contact form endpoint
// app.post('/api/contact', async (req, res) => {
//     try {
//         const { name, email, message } = req.body;
        
//         if (!name || !email || !message) {
//             return res.status(400).json({ error: 'Please fill in all fields.' });
//         }
        
//         console.log('Contact form submitted:', req.body);
//         res.status(200).json({ message: 'Contact form submitted successfully!' });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Email sending endpoint
// app.post('/api/send-email', upload.fields([
//     { name: 'passport', maxCount: 1 },
//     { name: 'validID', maxCount: 1 }
// ]), async (req, res) => {
//     try {
//         const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

//         if (!name || !email || !phoneNumber) {
//             return res.status(400).json({ error: 'Required fields are missing' });
//         }

//         const transporter = nodemailer.createTransport({
//             host: process.env.SMTP_HOST || 'smtp.hostinger.com',
//             port: parseInt(process.env.SMTP_PORT || '465'),
//             secure: true,
//             auth: {
//                 user: process.env.SMTP_USER,
//                 pass: process.env.SMTP_PASS
//             },
//         });

//         const mailOptions = {
//             from: process.env.SMTP_USER,
//             to: process.env.SMTP_USER,
//             subject: 'New Affiliate Application',
//             text: `
//                 New Affiliate Application:
//                 Name: ${name}
//                 Email: ${email}
//                 Phone Number: ${phoneNumber}
//                 Address: ${address || 'Not provided'}
//                 Website: ${website || 'Not provided'}
//                 Bank Name: ${bankName || 'Not provided'}
//                 Account Number: ${acctNo || 'Not provided'}
//             `,
//             attachments: [
//                 req.files['passport'] ? {
//                     filename: req.files['passport'][0].originalname,
//                     content: req.files['passport'][0].buffer
//                 } : null,
//                 req.files['validID'] ? {
//                     filename: req.files['validID'][0].originalname,
//                     content: req.files['validID'][0].buffer
//                 } : null
//             ].filter(Boolean)
//         };

//         await transporter.sendMail(mailOptions);
//         res.status(200).json({ message: 'Form submitted successfully' });
//     } catch (error) {
//         console.error('Error sending email:', error);
//         res.status(500).json({ error: 'Failed to send email' });
//     }
// });
// export default app;

// pages/api/submit.js
import { IncomingForm } from 'formidable';
import nodemailer from 'nodemailer';

// Create email transporter based on environment
const createTransporter = () => {
  // Check if running locally
  const isLocal = process.env.NODE_ENV === 'development';

  if (isLocal) {
    // Local development - Use a test account
    return nodemailer.createTestAccount().then(testAccount => {
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  } else {
    // Production - Use Hostinger SMTP
    return Promise.resolve(nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    }));
  }
};

// Helper function to parse multipart form data
const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    let options = {
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
      uploadDir: '/tmp',
      filename: (_name, _ext, part) => part.originalFilename,
    };

    const form = new IncomingForm(options);

    let fields = {};
    let files = {};

    form.on('field', (field, value) => {
      fields[field] = value;
    });

    form.on('file', (field, file) => {
      files[field] = file;
    });

    form.on('end', () => resolve({ fields, files }));
    form.on('error', err => reject(err));

    form.parse(req);
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the appropriate transporter
    const transporter = await createTransporter();
    
    // Parse the form data
    const { fields, files } = await parseForm(req);

    // Prepare email attachments
    const attachments = [];

    // Add passport file if it exists
    if (files.passport) {
      attachments.push({
        filename: files.passport.originalFilename,
        content: files.passport.data,
        encoding: 'base64',
      });
    }

    // Add valid ID file if it exists
    if (files.validID) {
      attachments.push({
        filename: files.validID.originalFilename,
        content: files.validID.data,
        encoding: 'base64',
      });
    }

    // Create HTML email content
    const htmlContent = `
      <h2>New Affiliate Application</h2>
      <p><strong>Name:</strong> ${fields.name}</p>
      <p><strong>Email:</strong> ${fields.email}</p>
      <p><strong>Phone Number:</strong> ${fields.phoneNumber}</p>
      <p><strong>Address:</strong> ${fields.address || 'Not provided'}</p>
      ${fields.website ? `<p><strong>Website:</strong> ${fields.website}</p>` : ''}
      ${fields.bankName ? `<p><strong>Bank Name:</strong> ${fields.bankName}</p>` : ''}
      ${fields.acctNo ? `<p><strong>Account Number:</strong> ${fields.acctNo}</p>` : ''}
    `;

    // Send email
    const info = await transporter.sendMail({
      from: process.env.NODE_ENV === 'development' ? 'test@example.com' : process.env.EMAIL_ADDRESS,
      to: process.env.NODE_ENV === 'development' ? 'test@example.com' : process.env.EMAIL_ADDRESS,
      subject: `New Affiliate Application from ${fields.name}`,
      html: htmlContent,
      attachments: attachments,
      replyTo: fields.email,
    });

    // For local development, log the email preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    res.status(200).json({ 
      message: 'Application submitted successfully',
      previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
    });
  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(500).json({ message: 'Error processing your application' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};