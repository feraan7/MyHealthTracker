const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const initCron = () => {
    // Basic setup for node-mailer (For production you should use SendGrid, Mailgun etc.)
    // We will use Ethereal for testing or allow config overrides
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    // Run every day at 8 PM system time to remind users
    cron.schedule('0 20 * * *', async () => {
        try {
            console.log('Running daily email reminder cron job');
            // Normally you would fetch users who haven't logged today, but for simplicity we email everyone
            // For thousands of users, do this in batches.
            const users = await User.find({ role: 'user' });

            for (let user of users) {
                // To avoid sending actual emails unless configured, we just console.log if no SMTP setup
                if (!process.env.SMTP_USER) {
                    // console.log(`Mock Email sent to ${user.email}: "Reminder: Log your daily health data!"`);
                    continue;
                }

                await transporter.sendMail({
                    from: '"HealthTracker 💗" <no-reply@healthtracker.app>',
                    to: user.email,
                    subject: 'Daily Health Reminder! 💧🏃‍♂️',
                    text: `Hello ${user.name},\n\nHope you're having an amazing day! Don't forget to drink water, stay active, and log your health stats on HealthTracker.\n\nStay healthy,\nThe HealthTracker Team`,
                });
            }
            console.log('Daily reminder emails processed.');
        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });
};

module.exports = initCron;
