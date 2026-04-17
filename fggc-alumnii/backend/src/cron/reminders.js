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
        // Get all users and their payments for the current year
        let query = `
            SELECT u.id, u.first_name, u.email, p.status, p.months_paid 
            FROM users u
            LEFT JOIN payments p ON u.id = p.user_id AND p.year = ?
            WHERE 1=1
        `;
        let params = [currentYear];

        if (targetUserId) {
            query += ` AND u.id = ?`;
            params.push(targetUserId);
        }

        const [fetchedUsers] = await pool.execute(query, params);

        const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const currentMonthIndex = new Date().getMonth(); // 0 = Jan
        const expectedMonths = MONTH_ABBREVS.slice(0, currentMonthIndex + 1);

        let users = [];
        
        if (targetUserId) {
            users = fetchedUsers.map(user => {
                const paidMonths = (user.months_paid || '').split(',').map(s => s.trim()).filter(Boolean);
                const unpaidCount = expectedMonths.filter(m => !paidMonths.includes(m)).length;
                user.effective_status = unpaidCount >= 3 ? 'Overdue' : 'Pending';
                return user;
            });
        } else {
            // Apply the same logic as the frontend: compute status based on months_paid up to the current month
            users = fetchedUsers.filter(user => {
                const paidMonths = (user.months_paid || '').split(',').map(s => s.trim()).filter(Boolean);
                const unpaidCount = expectedMonths.filter(m => !paidMonths.includes(m)).length;
                
                if (unpaidCount >= 3) {
                    user.effective_status = 'Overdue';
                } else {
                    user.effective_status = 'Pending';
                }

                return unpaidCount > 0; // If they miss any expected month, send a reminder
            });
        }

        if (users.length === 0) {
            console.log('No users with pending payments found.');
            return { message: 'No pending payments found' };
        }

        let sentCount = 0;
        let testMessageUrls = [];

        // Note: Using Promise.all or continuing on catch in case one email fails
        for (let user of users) {
            let message = {};
            if (user.effective_status === 'Overdue') {
                message = {
                    from: '"FGGC Alumni Finance 👻" <finance@fggc-alumni.com>',
                    to: user.email,
                    subject: 'URGENT: Overdue Alumni Dues ❗',
                    text: `Hello ${user.first_name},\n\nOur records show that your alumni dues for ${currentYear} are currently severely overdue (3+ months). Please log in to your dashboard to complete your payment as soon as possible.\n\nThank you for supporting the FGGC Alumni Association!`,
                    html: `<p>Hello <b>${user.first_name}</b>,</p><p>Our records show that your alumni dues for ${currentYear} are currently <b style="color:red;">severely overdue</b> (3 or more months behind).</p><p>Please log in to your dashboard to complete your payment as soon as possible.</p><p>Thank you for supporting the FGGC Alumni Association!</p>`
                };
            } else {
                message = {
                    from: '"FGGC Alumni Finance 👻" <finance@fggc-alumni.com>',
                    to: user.email,
                    subject: 'Action Required: Pending Alumni Dues ✔',
                    text: `Hello ${user.first_name},\n\nThis is a gentle reminder that your alumni dues for ${currentYear} are currently pending. Please log in to your dashboard to complete your payment.\n\nThank you for supporting the FGGC Alumni Association!`,
                    html: `<p>Hello <b>${user.first_name}</b>,</p><p>This is a gentle reminder that your alumni dues for ${currentYear} are currently pending.</p><p>Please log in to your dashboard to complete your payment.</p><p>Thank you for supporting the FGGC Alumni Association!</p>`
                };
            }

            try {
                await transporter.sendMail(message);
                testMessageUrls.push(`Sent securely using Gmail to ${user.email}`);
                sentCount++;
            } catch (emailErr) {
                console.error(`Failed to send email to ${user.email}:`, emailErr);
                // Continue to the next user without aborting the batch!
            }
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
