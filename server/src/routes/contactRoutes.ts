import express from 'express';
import nodemailer from 'nodemailer';



const router = express.Router(); 

//configure transporter
const transporter = nodemailer.createTransport({
   host: process.env.EMAIL_HOST,
   port: Number(process.env.EMAIL_PORT),
   secure: false,
   auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
   },
   ignoreTLS: true
   
});

transporter.verify()
  .then(() => console.log('SMTP login successful'))
  .catch(err => console.error('SMTP login failed:', err));


router.post('/', async(req, res):Promise<void> => {
  const {message} = req.body; 
 // TODO: save to DB or send email  

  if (!message) {
    res.status(400).json({error: 'Message is required'});
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: 'event.finder@mail.com',
      subject: 'Contact Us Message',
      text: message.trim(),
      
    });

    console.log('Contact message emailed:', message);
    res.status(200).json({ success: true });
    return;

  } catch (err: any) {

    console.error('Error sending contact email:', err);
    res.status(500).json({ error: err.message || err.toString() });
    return;
  }



});

export default router; 