import LegalLayout, { type LegalSection } from "./LegalLayout";
import { useStoreSettings } from "../../../services/storeSettingsService";

const PrivacyPolicy = () => {
  const { storeName, supportEmail, address } = useStoreSettings();

  const sections: LegalSection[] = [
    {
      id: "information-we-collect",
      title: "Information we collect",
      content: (
        <>
          <p>We only collect what we need to run your account and deliver your orders:</p>
          <ul>
            <li>
              <strong>Account details:</strong> your name, email address and password. Passwords are
              stored in encrypted (hashed) form, so we can never see them.
            </li>
            <li>
              <strong>Google sign-in:</strong> if you sign in with Google, we receive your name, email
              address and profile picture from Google.
            </li>
            <li>
              <strong>Order details:</strong> the products you buy, your phone number, shipping address,
              chosen payment method and order history.
            </li>
            <li>
              <strong>Reviews:</strong> ratings, comments and any photos you add to a review.
            </li>
            <li>
              <strong>Profile picture:</strong> if you upload one.
            </li>
            <li>
              <strong>Newsletter:</strong> your email address and when you confirmed or unsubscribed,
              if you subscribe.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "how-we-use",
      title: "How we use your information",
      content: (
        <ul>
          <li>To create and manage your account and keep it secure.</li>
          <li>To process, deliver and support your orders, including contacting you about them.</li>
          <li>To send account emails such as email verification and password reset codes.</li>
          <li>To show your reviews on product pages.</li>
          <li>
            To send our newsletter, only after you subscribe and confirm your email address using
            the link we send you.
          </li>
          <li>To prevent fraud and abuse, for example by limiting repeated login attempts.</li>
        </ul>
      ),
    },
    {
      id: "payments",
      title: "Payments",
      content: (
        <p>
          Online payments are handled by <strong>Khalti</strong> and <strong>eSewa</strong>. When you
          pay online you are sent to their secure pages, and we never see or store your wallet PIN,
          password or card details. We only keep a payment reference so we can confirm your order was
          paid. For cash on delivery, no payment information is collected online.
        </p>
      ),
    },
    {
      id: "sharing",
      title: "Who we share it with",
      content: (
        <>
          <p>We do not sell your personal information. We share it only with services that help us run the store:</p>
          <ul>
            <li><strong>Khalti and eSewa</strong> to process online payments.</li>
            <li><strong>Google</strong> if you choose to sign in with Google.</li>
            <li><strong>Cloudinary</strong> to store product, review and profile images.</li>
            <li><strong>Our email provider</strong> to send account, order and newsletter emails.</li>
            <li><strong>Our hosting and database providers</strong> to store your data securely.</li>
          </ul>
          <p>We may also share information if required by law.</p>
        </>
      ),
    },
    {
      id: "public-information",
      title: "What other people can see",
      content: (
        <p>
          When you post a review, your name, profile picture, rating, comment and review photos are
          shown publicly on the product page. Everything else in your account is private.
        </p>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      content: (
        <>
          <p>We use a small amount of storage in your browser to make the site work:</p>
          <ul>
            <li>A sign-in token and your basic profile, so you stay logged in.</li>
            <li>A session cookie used during Google sign-in.</li>
            <li>Store settings and your display preferences, so pages load faster.</li>
            <li>A temporary payment reference while you complete an online payment.</li>
          </ul>
          <p>
            We do not use advertising or tracking cookies. We count how many visitors are online at a
            time, without identifying you.
          </p>
        </>
      ),
    },
    {
      id: "retention",
      title: "How long we keep it",
      content: (
        <p>
          We keep your account information while your account is active. Order records are kept for
          as long as needed for delivery, support, returns, and our legal and accounting obligations.
          If you unsubscribe from the newsletter, we keep a record that you unsubscribed so we don't
          email you again, unless you ask us to delete it.
        </p>
      ),
    },
    {
      id: "your-rights",
      title: "Your choices and rights",
      content: (
        <ul>
          <li>You can update your name and profile picture from your profile page at any time.</li>
          <li>
            You can ask us for a copy of your information, to correct it, or to delete your account
            by emailing <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. We will respond as soon
            as we can.
          </li>
          <li>
            You can stop receiving the newsletter at any time using the unsubscribe link in any of
            our newsletter emails, or by emailing us.
          </li>
        </ul>
      ),
    },
    {
      id: "security",
      title: "Security",
      content: (
        <p>
          We protect your information with encrypted connections, hashed passwords, limits on
          repeated sign-in and code attempts, and restricted admin access. No system is completely
          secure, so please use a strong password and keep it private.
        </p>
      ),
    },
    {
      id: "children",
      title: "Children",
      content: (
        <p>
          {storeName} is not intended for children under 16. If you believe a child has given us
          personal information, please contact us and we will delete it.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to this policy",
      content: (
        <p>
          We may update this policy from time to time. When we do, we will change the "Last updated"
          date at the top of this page.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact us",
      content: (
        <p>
          For any privacy question or request, email{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          {address && <> or write to us at {address}</>}.
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="October 13, 2026"
      intro={
        <p>
          This policy explains what information {storeName} collects when you use our store, how we
          use it, and the choices you have.
        </p>
      }
      sections={sections}
    />
  );
};

export default PrivacyPolicy;
