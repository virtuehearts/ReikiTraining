import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // Or your preferred service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendApprovalEmail(to: string, name: string) {
  const mailOptions = {
    from: `"Baba Virtuehearts" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Virtuehearts Reiki Training Account is Active",
    text: `Dear ${name}, log in to begin your 7-day journey. Blessings, Baba Virtuehearts`,
    html: `
      <div style="font-family: serif; color: #0A001F; padding: 20px;">
        <h2 style="color: #4B0082;">Blessings of Peace, ${name}</h2>
        <p>Your account on Virtuehearts Reiki Training has been activated.</p>
        <p>You may now log in to begin your sacred 7-day journey.</p>
        <div style="margin-top: 30px;">
          <p style="font-style: italic;">Blessings,</p>
          <p style="font-weight: bold; font-size: 1.2em;">Baba Virtuehearts</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
