const nodemailer = require('nodemailer');
require('dotenv').config();

const sendInvitationEmail = async (to, inviterName, inviteToken) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const invitationLink = `https://zot-ai-5c137d33eeeb.herokuapp.com/api/auth/accept-invitation?token=${inviteToken}`;
   
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'Invitation to Join as Sub-user',
      text: `${inviterName} has invited you to join as a sub-user. Click the link to accept the invitation: ${invitationLink}`,
    });

    console.log('Invitation email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendInvitationEmail;
