// import dotenv from 'dotenv'
// dotenv.config()
// import nodemailer from "nodemailer";

// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: 'botnishant79@gmail.com',
//     pass: 'dxhe siht pkfg kuzh'
//     // user: process.env.etherial_email,
//     // pass: process.env.etherial_password
//   },
// });

// async function sendEmail() {
//   const info = await transporter.sendMail({
//     from: '"Reddit scipt" <luella32@ethereal.email>',
//     to: "nsingh8483@gmail.com",
//     subject: "Keyword matched",
//     text: `hi`, // plain‑text body
//   });

//   console.log("Message sent:", info.messageId);
// }
// await sendEmail();
// export default sendEmail;

import mongoose from 'mongoose'
import {User} from './lib/mongoDB.ts'
await mongoose.connect('mongodb+srv://nishantkumaragra:MyDreamGame@redditposts.t7kcwqc.mongodb.net/')
async function calltodb() {
  const res = User.create({postId:"one", postLink:"two"})
  return res
}
const respose = await calltodb();
console.log(respose);