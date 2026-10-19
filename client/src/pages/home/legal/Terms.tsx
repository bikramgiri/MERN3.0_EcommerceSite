import { Link } from "react-router-dom";
import LegalLayout, { type LegalSection } from "./LegalLayout";
import { describeDeliveryTime, useStoreSettings } from "../../../services/storeSettingsService";

const Terms = () => {
  const settings = useStoreSettings();
  const {
    storeName,
    supportEmail,
    standardShippingFee,
    freeShippingThreshold,
    enableCod,
    enableOnlinePayment,
    returnWindowDays,
  } = settings;
  const deliveryTime = describeDeliveryTime(settings);

  const paymentMethods = [
    enableCod && "cash on delivery",
    enableOnlinePayment && "Khalti",
    enableOnlinePayment && "eSewa",
  ].filter(Boolean);

  const sections: LegalSection[] = [
    {
      id: "accounts",
      title: "Your account",
      content: (
        <ul>
          <li>You need an account to place orders, and the information you give us must be accurate.</li>
          <li>
            You are responsible for keeping your password safe and for activity on your account. Tell
            us straight away if you think someone else has used it.
          </li>
          <li>We may suspend accounts that break these terms or are used for fraud or abuse.</li>
        </ul>
      ),
    },
    {
      id: "products-and-prices",
      title: "Products and prices",
      content: (
        <ul>
          <li>All prices are shown in Nepalese Rupees (Rs) and include the product price only. Shipping is added at checkout.</li>
          <li>We try to show products, prices and stock accurately. If we find an error after you order, we will contact you before going ahead, and you can cancel.</li>
          <li>Products are subject to availability. Stock is checked again when you place your order.</li>
        </ul>
      ),
    },
    {
      id: "orders",
      title: "Placing an order",
      content: (
        <ul>
          <li>Your order is confirmed once you receive an order confirmation on the site.</li>
          <li>
            You can edit or cancel an order from <Link to="/my-orders">My orders</Link> while its
            status is <strong>Pending</strong>. Once it is being prepared, in transit or delivered, it
            can no longer be changed online. Contact us if you need help.
          </li>
          <li>We may cancel an order if a product is unavailable, the payment fails, or the order looks fraudulent. If you already paid online, we will refund you.</li>
          <li>During store maintenance, new orders may be paused for a short time.</li>
        </ul>
      ),
    },
    {
      id: "payment",
      title: "Payment",
      content: (
        <>
          <p>
            {paymentMethods.length > 0
              ? `We currently accept ${paymentMethods.join(", ")}.`
              : "Available payment methods are shown at checkout."}{" "}
            Online payments are processed securely by Khalti or eSewa under their own terms.
          </p>
          <p>For cash on delivery, please have the exact order total ready when your order arrives.</p>
        </>
      ),
    },
    {
      id: "shipping",
      title: "Shipping",
      content: (
        <ul>
          <li>
            Standard shipping costs Rs {standardShippingFee.toLocaleString()}
            {freeShippingThreshold > 0 &&
              ` and is free on orders of Rs ${freeShippingThreshold.toLocaleString()} or more`}
            . The exact fee is always shown at checkout before you pay.
          </li>
          <li>Please make sure your phone number and address are correct, as we use them to deliver your order.</li>
          <li>
            {deliveryTime ? `${deliveryTime} ` : ""}Delivery times are estimates and can be affected
            by things outside our control.
          </li>
        </ul>
      ),
    },
    {
      id: "problems",
      title: "Damaged, faulty or wrong items",
      content:
        returnWindowDays > 0 ? (
          <>
            <p>
              If an item arrives damaged, faulty, or different from what you ordered, contact us at{" "}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a> within{" "}
              <strong>{returnWindowDays} {returnWindowDays === 1 ? "day" : "days"} of delivery</strong>.
              Include your order number and photos of the item.
            </p>
            <p>
              Once we've confirmed the problem, we'll send a replacement or refund you. Refunds for
              online payments go back through the original payment method (eSewa or Khalti).
            </p>
          </>
        ) : (
          <p>
            If an item arrives damaged, faulty, or different from what you ordered, contact us at{" "}
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with your order number and photos if
            possible, and we will work with you to put it right.
          </p>
        ),
    },
    {
      id: "reviews",
      title: "Reviews",
      content: (
        <ul>
          <li>Reviews must be honest, relevant to the product, and respectful.</li>
          <li>Do not post offensive content, personal information, spam, or anything you don't have the right to share.</li>
          <li>We may hide or remove reviews that break these rules. By posting a review, you allow us to show it on our site.</li>
        </ul>
      ),
    },
    {
      id: "acceptable-use",
      title: "Using our site",
      content: (
        <p>
          Don't misuse the site: for example by trying to access other people's accounts, interfering
          with how it works, or using bots to scrape it or flood our forms. All content on the site,
          including our name, logo and design, belongs to {storeName} or its suppliers.
        </p>
      ),
    },
    {
      id: "liability",
      title: "Our responsibility",
      content: (
        <p>
          We are responsible for providing the products you order as described. As far as the law
          allows, we are not responsible for indirect losses or for delays caused by events outside
          our control. Nothing in these terms limits rights you have under consumer protection law.
        </p>
      ),
    },
    {
      id: "privacy",
      title: "Privacy",
      content: (
        <p>
          How we handle your personal information is explained in our{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to these terms",
      content: (
        <p>
          We may update these terms from time to time. The version shown when you place an order
          applies to that order.
        </p>
      ),
    },
    {
      id: "law",
      title: "Governing law",
      content: <p>These terms are governed by the laws of Nepal.</p>,
    },
  ];

  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="October 14, 2026"
      intro={
        <p>
          These terms apply when you use the {storeName} website or place an order with us. Please
          read them carefully. By using our site, you agree to them.
        </p>
      }
      sections={sections}
    />
  );
};

export default Terms;
