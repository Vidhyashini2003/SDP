const nodemailer = require('nodemailer');

// Use environment variables for credentials
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or customizable
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendActivationEmail = async (email, token, type = 'activation') => {
    // Assuming frontend is running on standard Vite port or configured URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Different usage for invite vs guest signup if wording needs to differ?
    // User requested "Activate Account" for both.

    const activationLink = `${frontendUrl}/activate-account?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Activate your Account - Hotel Management System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Welcome!</h2>
                <p>You have been invited to join the Hotel Management System (or you just registered).</p>
                <p>Please click the button below to activate your account and set your password.</p>
                <a href="${activationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Activate Account</a>
                <p style="margin-top: 20px; color: #666;">This link implies you will set your password securely.</p>
                <p style="font-size: 12px; color: #999;">Link expires in 24 hours.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Activation email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
