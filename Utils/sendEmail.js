import nodemailer from 'nodemailer';

const sendEmail = async (email, code) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'abdoadimy0@gmail.com', // Your Gmail address
            pass: 'iiegslrmgmilacyy'     // Your Gmail app password (not your regular password)
        }
    });

    const mailOptions = {
        from: '"Tawaaf App" abdoadimy0@gmail.com', // Sender address
        to: email, // Recipient address (should be dynamic)
        subject: 'Password Reset Request',
        text: `You requested a password reset.`,
        html: `
            <p>You requested a password reset.</p>
            <p>this is your code:</p>
            <h1>${code}</h1>
            <p>If you didn't request a password reset, please ignore this email.</p>
            <p>Thanks!</p>
        `
    };

    await transporter.sendMail(mailOptions);
}

export default sendEmail;