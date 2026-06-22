require('dotenv').config();
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pool = require('../db');

// Connect to real Gmail SMTP server using App Passwords
const transporter = nodemailer.createTransport({
    service: 'gmail',
    // Reuse a single authenticated connection across the whole batch instead of
    // reconnecting + re-authenticating for every message. That per-email TLS +
    // login handshake was the main source of slowness when sending reminders.
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
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

        // Shared sender identity and footer. Plainly-identified, low-key
        // transactional mail lands in the inbox far more reliably than urgent,
        // emoji-laden, all-caps subject lines — those score as spam. We also set
        // replyTo and a footer explaining why the member is receiving this.
        const fromAddress = `"FGGC Alumni Association" <${process.env.EMAIL_USER}>`;
        const dashboardUrl = process.env.FRONTEND_URL || '';
        const loginLineText = dashboardUrl
            ? `You can log in to your dashboard to review and pay: ${dashboardUrl}`
            : `Please log in to your dashboard on our website to review and pay.`;
        const loginLineHtml = dashboardUrl
            ? `<p>You can <a href="${dashboardUrl}">log in to your dashboard</a> to review and pay.</p>`
            : `<p>Please log in to your dashboard on our website to review and pay.</p>`;
        const footerText = `\n\n—\nFGGC Alumni Association\nYou're receiving this because you're a registered member. If you've already paid or think this was sent in error, just reply to this email and we'll sort it out.`;
        const footerHtml = `<hr style="border:none;border-top:1px solid #ddd;margin:24px 0;"><p style="font-size:12px;color:#777;">FGGC Alumni Association<br>You're receiving this because you're a registered member. If you've already paid or think this was sent in error, just reply to this email and we'll sort it out.</p>`;

        // Continue on catch so one failed send doesn't abort the batch.
        for (let user of users) {
            let message = {};
            if (user.effective_status === 'Overdue') {
                message = {
                    from: fromAddress,
                    replyTo: process.env.EMAIL_USER,
                    to: user.email,
                    subject: `Your FGGC alumni dues for ${currentYear} are overdue`,
                    text: `Hi ${user.first_name},\n\nThis is a reminder that your FGGC Alumni Association dues for ${currentYear} are now overdue. Whenever you have a moment, please bring your account up to date. ${loginLineText}\n\nThank you for being part of the FGGC alumni community.${footerText}`,
                    html: `<p>Hi ${user.first_name},</p><p>This is a reminder that your FGGC Alumni Association dues for ${currentYear} are now <b>overdue</b>. Whenever you have a moment, please bring your account up to date.</p>${loginLineHtml}<p>Thank you for being part of the FGGC alumni community.</p>${footerHtml}`
                };
            } else {
                message = {
                    from: fromAddress,
                    replyTo: process.env.EMAIL_USER,
                    to: user.email,
                    subject: `A reminder about your FGGC alumni dues for ${currentYear}`,
                    text: `Hi ${user.first_name},\n\nThis is a friendly reminder that your FGGC Alumni Association dues for ${currentYear} are still pending. When you have a chance, please complete your payment. ${loginLineText}\n\nThank you for being part of the FGGC alumni community.${footerText}`,
                    html: `<p>Hi ${user.first_name},</p><p>This is a friendly reminder that your FGGC Alumni Association dues for ${currentYear} are still pending. When you have a chance, please complete your payment.</p>${loginLineHtml}<p>Thank you for being part of the FGGC alumni community.</p>${footerHtml}`
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
