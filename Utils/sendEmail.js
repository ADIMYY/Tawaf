import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME, // Your Gmail address
            pass: process.env.EMAIL_PASSWORD     // Your Gmail app password (not your regular password)
        }
    });

    const mailOptions = {
        from: `"Tawaaf App" <${process.env.EMAIL_USERNAME}>`, // Sender address
        to: options.email, // Recipient address (should be dynamic)
        subject: options.subject,
        text: options.text,
        html: options.message
    };

    await transporter.sendMail(mailOptions);
}

export default sendEmail;