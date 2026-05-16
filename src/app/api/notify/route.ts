import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { toEmail, type, idNumber, ownerName, finderName, location } = await request.json();

    if (!toEmail || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER, // SMTP Login
        pass: process.env.BREVO_PASS,
      },
    });

    let subject = "";
    let htmlContent = "";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const senderEmail = process.env.BREVO_SENDER || process.env.BREVO_USER;

    const footer = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="margin: 0; font-weight: bold; color: #333;">IRS Kenya</p>
        <p style="margin: 4px 0 0; color: #666; font-size: 13px;">Simple. Mindful. Smart.</p>
      </div>
    `;

    switch (type) {
      case "WELCOME":
        subject = "Your account is ready. Start tracking documents automatically";
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
            <h2 style="color: #000; margin-bottom: 24px;">Welcome to IRS Kenya</h2>
            <p>You can now search for lost documents, report found ones, and receive automatic updates when a match appears in the system.</p>
            <p>If your ID is ever lost, the system will surface it when it is reported anywhere in the network.</p>
            <p>All features are available at no cost.</p>
            <div style="margin-top: 32px;">
              <a href="${appUrl}/dashboard" 
                 style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Open Dashboard
              </a>
            </div>
            ${footer}
          </div>
        `;
        break;

      case "WATCH_REQUEST":
        subject = "Your ID is now being monitored";
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
            <h2 style="color: #000; margin-bottom: 24px;">Monitoring Active</h2>
            <p>Watch request for ID number <strong>${idNumber}</strong> is active.</p>
            <p>You will receive an automatic alert if a matching document is reported.</p>
            <p>The system runs continuously in the background.</p>
            <div style="margin-top: 32px;">
              <a href="${appUrl}/dashboard/watchlist" 
                 style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Request
              </a>
            </div>
            ${footer}
          </div>
        `;
        break;

      case "MATCH_FOUND":
        subject = "A matching document has been reported";
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
            <h2 style="color: #000; margin-bottom: 24px;">Match Found</h2>
            <p>A document matching ID number <strong>${idNumber}</strong> has been reported.</p>
            <p>Review the details and begin the claim process from your dashboard.</p>
            <div style="margin-top: 32px;">
              <a href="${appUrl}/dashboard/search?idNumber=${idNumber}" 
                 style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Review and Claim
              </a>
            </div>
            ${footer}
          </div>
        `;
        break;

      case "REPORT_CONFIRMATION":
        subject = "Your report is now active in the system";
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
            <h2 style="color: #000; margin-bottom: 24px;">Report Received</h2>
            <p>Report for ID number <strong>${idNumber}</strong> found at <strong>${location}</strong> has been received.</p>
            <p>The report is now active in the system and the owner has been notified where possible.</p>
            <div style="margin-top: 32px;">
              <a href="${appUrl}/dashboard/my-uploads" 
                 style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Report
              </a>
            </div>
            ${footer}
          </div>
        `;
        break;

      case "ID_CLAIMED":
        subject = "Document claimed";
        htmlContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f0f0f0; border-radius: 12px; color: #333; line-height: 1.6;">
            <h2 style="color: #000; margin-bottom: 24px;">ID Claimed</h2>
            <p>The document you reported with ID number <strong>${idNumber}</strong> has been claimed by its owner.</p>
            <p>View status and follow-up details in your dashboard.</p>
            <div style="margin-top: 32px;">
              <a href="${appUrl}/dashboard/my-uploads" 
                 style="display: inline-block; background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View Details
              </a>
            </div>
            ${footer}
          </div>
        `;
        break;

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    const mailOptions = {
      from: `"IRS KENYA" <${senderEmail}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Notification sent successfully" });
  } catch (error: any) {
    console.error("Email sending error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
