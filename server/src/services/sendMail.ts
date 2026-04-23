import nodemailer from "nodemailer";
import { envConfig } from "../config/config";

interface MailOptions {
      to: string;
      subject: string;
      text: string;
}

const sendMail = async (options: MailOptions) => {
      const transporter = nodemailer.createTransport({
            service : "gmail",
            auth : {
                  user : envConfig.email,
                  pass : envConfig.emailPassword
            }
      })

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

export default sendMail;