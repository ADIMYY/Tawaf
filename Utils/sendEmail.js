import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'abdoadimy0@gmail.com', // Your Gmail address
            pass: 'sycj hsxk zpfv btej'     // Your Gmail app password (not your regular password)
        }
    });

    const mailOptions = {
        from: '"Tawaaf App" abdoadimy0@gmail.com', // Sender address
        to: options.email, // Recipient address (should be dynamic)
        subject: options.subject,
        text: options.text,
        html: options.message
    };

    await transporter.sendMail(mailOptions);
}

export default sendEmail;