
const generateOtp = () =>{
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random 6-digit OTP
      return otp;
} 

export default generateOtp;