const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Create a transporter using Gmail SMTP
let transporter = null;

const initializeTransporter = () => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.error('Email configuration missing. Please check your .env file.');
            return false;
        }

        transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            debug: true
        });

        // Verify transporter
        transporter.verify((error, success) => {
            if (error) {
                console.error('SMTP Connection Error:', error);
                return false;
            } else {
                console.log('SMTP Server is ready to take messages');
                return true;
            }
        });

        return true;
    } catch (error) {
        console.error('Failed to initialize email transporter:', error);
        return false;
    }
};

// Initialize transporter
const transporterInitialized = initializeTransporter();

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

    if (!transporterInitialized || !transporter) {
        console.error('Email transporter not initialized');
        return false;
    }

    const mailOptions = {
        from: `"Student Monitoring System" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Login Verification OTP',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #163F5C; text-align: center;">Login Verification</h1>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
                    <p style="font-size: 16px;">Your OTP for login verification is:</p>
                    <h2 style="color: #4CAF50; text-align: center; font-size: 32px; letter-spacing: 5px;">${otp}</h2>
                    <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
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
            responseCode: error.responseCode
        });
        
        // Try to reinitialize transporter on error
        console.log('Attempting to reinitialize email transporter...');
        initializeTransporter();
        
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    initializeTransporter
}; 