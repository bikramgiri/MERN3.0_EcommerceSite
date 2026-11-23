import crypto from "crypto";

// 6-digit code from a cryptographically secure source (Math.random is predictable)
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

export default generateOtp;
