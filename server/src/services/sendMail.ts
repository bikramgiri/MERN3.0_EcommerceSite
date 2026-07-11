import nodemailer from "nodemailer";
import { envConfig } from "../config/config";

interface MailOptions {
      to: string;
      subject: string;
      text: string;
}

const createMailTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: envConfig.email,
      pass: envConfig.emailPassword,
    },
  });

export const sendMail = async (options: MailOptions) => {
      const transporter = createMailTransporter();
      const mailOptions = {
            from : `Truvora <${envConfig.email}>`,
            to : options.to,
            subject : options.subject,
            text : options.text
      }
      try {
            await transporter.sendMail(mailOptions)
      } catch (error) {
            console.log("Something went wrong!");
      }
}

// Function to send verification email with a link
export const sendVerificationEmailLink = async (options: { email: string; subject?: string; verificationLink: string }) => {
  try {
    const transporter = createMailTransporter();

    const mailOptions = {
      from: `"Truvora" <${process.env.EMAIL}>`,
      to: options.email,
      subject: options.subject || "Verify Your Truvora Email",
      text: `Click this link to verify your email: ${options.verificationLink}\n\nLink expires in 4 minutes.`,
      html: `
        <h2>Welcome to Truvora!</h2>
        <p>Click the button below to verify your email:</p>
        <a href="${options.verificationLink}" 
           style="background:#3c50e0; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; display:inline-block;">
          Verify Email Now
        </a>
        <p style="margin-top:20px;">This link expires soon.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};

// Function to send verification email with a code (if needed in the future)
export const sendVerificationEmailCode = async (options: { email: string; subject?: string; code: string }) => {
  try {
    const transporter = createMailTransporter();

    const mailOptions = {
      from: `"Truvora" <${process.env.EMAIL}>`,
      to: options.email,
      subject: options.subject || "Verify Your Truvora Email",
      text: `Your verification code is: ${options.code}\n\nThis code expires in 4 minutes.`,
      html: `
        <h2>Welcome to Truvora!</h2>
            <p>Your verification code is:</p>
            <h3 style="background:#3c50e0; color:white; padding:12px 24px; border-radius:6px; display:inline-block;">${options.code}</h3>
        <p style="margin-top:20px;">This code expires soon.</p>
      `,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};

// export default { sendMail, sendVerificationEmailLink, sendVerificationEmailCode };