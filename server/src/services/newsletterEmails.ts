import { envConfig } from "../config/config";
import { sendHtmlMail } from "./sendMail";
import { getStoreSettings } from "./storeSettingsService";

const clientUrl = () => (envConfig.clientUrl || "http://localhost:5173").replace(/\/$/, "");
const backendUrl = () => (envConfig.backendUrl || "http://localhost:4000").replace(/\/$/, "");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const unsubscribePageUrl = (token: string) =>
  `${clientUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;

/**
 * Headers that make Gmail/Outlook show their own "Unsubscribe" button.
 * The POST endpoint follows RFC 8058 (one-click unsubscribe).
 */
const unsubscribeHeaders = (token: string) => ({
  "List-Unsubscribe": `<${backendUrl()}/api/customer/newsletter/unsubscribe?token=${encodeURIComponent(token)}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

// Simple table-based layout with inline styles so it renders in every email client
const layout = (storeName: string, body: string, footer: string) => `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FDF8ED;font-family:Arial,Helvetica,sans-serif;color:#1A1613;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8ED;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #eae3d2;">
            <tr>
              <td style="padding:28px 32px 0;font-size:24px;font-weight:bold;font-style:italic;">
                ${escapeHtml(storeName)}<span style="color:#E6540B;">.</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;font-size:15px;line-height:1.6;">
                ${body}
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:16px 32px;font-size:12px;line-height:1.5;color:#7a726a;text-align:center;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const button = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px;background:#E6540B;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-weight:bold;text-decoration:none;border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`;

/** "Please confirm your subscription" email with a link that expires */
export const sendConfirmSubscriptionEmail = async (
  email: string,
  confirmToken: string,
  expiresInHours: number,
) => {
  const { storeName, address } = await getStoreSettings();
  const confirmUrl = `${clientUrl()}/newsletter/confirm?token=${encodeURIComponent(confirmToken)}`;

  await sendHtmlMail({
    to: email,
    subject: `Confirm your subscription to ${storeName}`,
    text: [
      `Thanks for signing up for the ${storeName} newsletter!`,
      "",
      "Please confirm your email address by opening this link:",
      confirmUrl,
      "",
      `This link expires in ${expiresInHours} hours.`,
      "If you didn't sign up, you can ignore this email and you won't be subscribed.",
    ].join("\n"),
    html: layout(
      storeName,
      `
        <h1 style="margin:0 0 12px;font-size:20px;">Confirm your subscription</h1>
        <p style="margin:0;">Thanks for signing up for the ${escapeHtml(storeName)} newsletter! Please confirm your email address to start getting offers and new arrivals.</p>
        ${button(confirmUrl, "Confirm subscription")}
        <p style="margin:0;font-size:13px;color:#7a726a;">This link expires in ${expiresInHours} hours. If the button doesn't work, copy this link into your browser:<br><a href="${confirmUrl}" style="color:#E6540B;word-break:break-all;">${confirmUrl}</a></p>
      `,
      `If you didn't sign up, you can safely ignore this email and you won't be subscribed.${
        address ? `<br>${escapeHtml(storeName)} · ${escapeHtml(address)}` : ""
      }`,
    ),
  });
};

/** Welcome email sent once the subscription is confirmed */
export const sendWelcomeEmail = async (email: string, unsubscribeToken: string) => {
  const { storeName, address, supportEmail } = await getStoreSettings();
  const shopUrl = `${clientUrl()}/products`;
  const unsubscribeUrl = unsubscribePageUrl(unsubscribeToken);

  await sendHtmlMail({
    to: email,
    subject: `Welcome to ${storeName}!`,
    headers: unsubscribeHeaders(unsubscribeToken),
    text: [
      `You're subscribed to the ${storeName} newsletter.`,
      "",
      "We'll email you about new arrivals, offers and store news. No spam.",
      "",
      `Start shopping: ${shopUrl}`,
      "",
      `Questions? Contact us at ${supportEmail}.`,
      `Unsubscribe at any time: ${unsubscribeUrl}`,
    ].join("\n"),
    html: layout(
      storeName,
      `
        <h1 style="margin:0 0 12px;font-size:20px;">You're subscribed 🎉</h1>
        <p style="margin:0 0 12px;">Thanks for confirming! You'll now be the first to hear about new arrivals, offers and store news from ${escapeHtml(storeName)}.</p>
        <p style="margin:0;">We only send emails worth opening. No spam, ever.</p>
        ${button(shopUrl, "Start shopping")}
        <p style="margin:0;font-size:13px;color:#7a726a;">Questions? Reply to this email or contact us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#E6540B;">${escapeHtml(supportEmail)}</a>.</p>
      `,
      `You're receiving this because you subscribed at ${escapeHtml(storeName)}.<br><a href="${unsubscribeUrl}" style="color:#7a726a;">Unsubscribe</a>${
        address ? ` · ${escapeHtml(address)}` : ""
      }`,
    ),
  });
};
