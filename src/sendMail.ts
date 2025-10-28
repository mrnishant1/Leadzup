import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
    auth: {
        user: 'botnishant79@gmail.com',
        pass: process.env.EMAIL_APP_PASSWORD 
    }
});

async function sendMail(postId:string, postLink:string,postTitle:string) {
  
    const info = await transporter.sendMail({
    from: '"Reddit scipt" <luella32@ethereal.email>',
    to: "nsingh8483@gmail.com",
    subject: "Keyword matched",
    text: `postId:${postId}, postLink:${postLink}, postTitle:${postTitle}`, // plain‑text body
  });

  console.log("Message sent:", info.messageId);
}

export default sendMail;