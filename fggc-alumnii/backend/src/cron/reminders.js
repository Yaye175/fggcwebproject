require('dotenv').config();
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pool = require('../db');

// Connect to real Gmail SMTP server using App Passwords
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendReminders(targetUserId = null) {
    console.log('Running pending payment reminder check...');
    try {
        const currentYear = new Date().getFullYear();
        // Get users who are unpaid for the current year
        let query = `
            SELECT u.id, u.first_name, u.email, p.status 
            FROM users u
            LEFT JOIN payments p ON u.id = p.user_id AND p.year = ?
            WHERE 1=1
        `;
        let params = [currentYear];

        if (targetUserId) {
            query += ` AND u.id = ?`;
            params.push(targetUserId);
        } else {
            query += ` AND (u.payment_status = 'Pending' OR u.payment_status = 'Overdue' OR p.status = 'unpaid' OR p.status IS NULL)`;
        }

        const [users] = await pool.execute(query, params);

        if (users.length === 0) {
            console.log('No users with pending payments found.');
            return { message: 'No pending payments found' };
        }

        let sentCount = 0;
        let testMessageUrls = [];

        for (let user of users) {
            // Setup email data
            let message = {
                from: '"FGGC Alumni Finance 👻" <finance@fggc-alumni.com>',
                to: user.email,
                subject: 'Action Required: Pending Alumni Dues ✔',
                text: `Hello ${user.first_name},\n\nThis is a gentle reminder that your alumni dues for ${currentYear} are currently pending or overdue. Please log in to your dashboard to complete your payment.\n\nThank you for supporting the FGGC Alumni Association!`,
                html: `<p>Hello <b>${user.first_name}</b>,</p><p>This is a gentle reminder that your alumni dues for ${currentYear} are currently pending or overdue. Please log in to your dashboard to complete your payment.</p><p>Thank you for supporting the FGGC Alumni Association!</p>`
            };

            const info = await transporter.sendMail(message);
            testMessageUrls.push(`Sent securely using Gmail to ${user.email}`);
            sentCount++;
        }

        console.log(`Sent ${sentCount} reminders.`);
        return { message: `Reminders sent to ${sentCount} user(s).`, previewUrls: testMessageUrls };

    } catch (err) {
        console.error('Error sending reminders:', err);
        throw err;
    }
}

// Optional: Schedule to run on the 1st of every month at 9:00 AM
cron.schedule('0 9 1 * *', () => {
    sendReminders();
});

module.exports = { sendReminders };
