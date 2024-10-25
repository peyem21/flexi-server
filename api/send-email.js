// import nodemailer from 'nodemailer';
// import Cors from 'cors';
// import initMiddleware from '../../lib/init-middleware';

// // Initialize the CORS middleware
// const cors = initMiddleware(
//   Cors({
//     methods: ['POST', 'OPTIONS'],
//   })
// );

// export default async function handler(req, res) {
//   // Run cors
//   await cors(req, res);

//   if (req.method === 'POST') {
//     const { name, email, phoneNumber, address, website, bankName, acctNo } = req.body;

//     if (!name || !email || !phoneNumber) {
//       return res.status(400).json({ error: 'Required fields are missing' });
//     }

//     // Nodemailer configuration
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.hostinger.com',
//       port: 465,
//       secure: true,
//       auth: {
//         user: 'contact@flexihomesrealty.com',
//         pass: 'Abuja912@',
//       },
//     });

//     const mailOptions = {
//       from: 'contact@flexihomesrealty.com',
//       to: 'contact@flexihomesrealty.com',
//       subject: 'New Affiliate Application',
//       text: `
//         New Affiliate Application:
//         Name: ${name}
//         Email: ${email}
//         Phone Number: ${phoneNumber}
//         Address: ${address || 'Not provided'}
//         Website: ${website || 'Not provided'}
//         Bank Name: ${bankName || 'Not provided'}
//         Account Number: ${acctNo || 'Not provided'}
//       `,
//     };

//     // Send email
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.error('Error sending email:', error);
//         res.status(500).json({ error: 'Failed to send email' });
//       } else {
//         console.log('Email sent:', info.response);
//         res.status(200).json({ message: 'Form submitted successfully' });
//       }
//     });
//   } else {
//     res.setHeader('Allow', ['POST']);
//     return res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
