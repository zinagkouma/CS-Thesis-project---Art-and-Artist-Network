import nodemailer from 'nodemailer';



export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  try {
   const transporter = nodemailer.createTransport({
     host: process.env.EMAIL_HOST,
     port: Number(process.env.EMAIL_PORT),
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS, 
     },
     tls: {
      rejectUnauthorized: false
     }
   }); 

   const mailOptions = {
     from: '"Event Finder" <no-reply@eventfinder.com>', 
     to,
     subject,
     text,
     html,
   };

   transporter.sendMail(mailOptions).catch(error => {
    console.error("Background email error: ", error);
   });

   return true;

  } catch (error) {
    console.error("Error sending email via Mailtrap: ", error); 
    return false; 
  }   
};