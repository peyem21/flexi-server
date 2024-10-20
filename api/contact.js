const nodemailer = require('nodemailer');

export default async (req, res) => {
    if (req.method === 'POST') {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Please fill in all fields.' });
        }

        // Nodemailer configuration
        const transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com', // Replace with your SMTP server
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,  // Store in environment variable
                pass: process.env.EMAIL_PASS,  // Store in environment variable
            },
        });

        const mailOptions = {
            from: email,
            to: process.env.EMAIL_USER,
            subject: 'New Contact Form Submission',
            text: `
                New message from ${name}:
                ${message}
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            return res.status(200).json({ message: 'Message sent successfully!' });
        } catch (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send message.' });
        }
    } else {
        // Handle other HTTP methods
        return res.status(405).json({ error: 'Method not allowed.' });
    }
};
