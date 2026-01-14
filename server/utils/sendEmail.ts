// This is a stub. In production, use SendGrid/AWS SES/Resend.
import crypto from 'crypto';

interface EmailOptions {
    email: string;
    subject: string;
    message: string;
}

export const sendEmail = async (options: EmailOptions) => {
    // Mock sending email
    console.log(`\n--- SENDING EMAIL ---`);
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: \n${options.message}`);
    console.log(`---------------------\n`);

    // In real implementation:
    // await sgMail.send({ ... })
};

export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};
