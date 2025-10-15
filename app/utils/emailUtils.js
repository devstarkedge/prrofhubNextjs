import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.zoho.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, 
  auth: {
    user: "silpi.d@starkedge.com",
    pass:  "4cgm rPNF 4649"
  },
});

export const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `"Time Logger Bot" <silpi.d@starkedge.com>`,
      to,
      subject,
      text,
    };
    if (html) {
      mailOptions.html = html;
    }
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
  }
};
