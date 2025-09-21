import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.DATABASE_URL,
        pass: process.env.etherial_password
    }
});

async function sendMail(postId:string, postLink:string,postTitle:string) {
    const info = await transporter.sendMail({
    from: '"Reddit scipt" <luella32@ethereal.email>',
    to: "nishantkumaragra@gmail.com",
    subject: "Keyword matched",
    text: `postId:${postId}, postLink:${postLink}, postTitle:${postTitle}`, // plain‑text body
  });

  console.log("Message sent:", info.messageId);
}

export default sendMail;