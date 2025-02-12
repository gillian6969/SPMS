const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    debug: true // Enable debug logging
});

// Verify transporter connection
transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('SMTP Server is ready to take our messages');
    }
});

// Function to generate OTP
const generateOTP = () => {
    return otpGenerator.generate(6, { 
        upperCase: false,
        specialChars: false,
        alphabets: false
    });
};

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
    console.log('Preparing to send email to:', email);

    const mailOptions = {
        from: `"Student Monitoring System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Login Verification OTP',
        html: `
            <h1>Login Verification</h1>
            <p>Your OTP for login verification is:</p>
            <h2 style="color: #4CAF50;">${otp}</h2>
            <p>This OTP will expire in 5 minutes.</p>
            <p>If you didn't request this OTP, please ignore this email.</p>
        `
    };

    try {
        console.log('Attempting to send email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Detailed email error:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
            stack: error.stack
        });
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail
}; 