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
//     const { name, email, message } = req.body;

//     if (!name || !email || !message) {
//       return res.status(400).json({ error: 'Please fill in all fields.' });
//     }

//     // Simulate sending email here
//     console.log('Contact form submitted:', req.body);
//     return res.status(200).json({ message: 'Contact form submitted successfully!' });
//   } else {
//     res.setHeader('Allow', ['POST']);
//     return res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }
