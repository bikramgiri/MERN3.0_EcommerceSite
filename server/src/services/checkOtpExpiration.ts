import { Response } from "express"
import sendResponse from "./sendResponse"

 //Is threshold time and otpValidaityDuration same? 
 // Yes, they are the same. Both terms refer to the duration for which the OTP is considered valid before it expires. In the context of OTP expiration, you can use either term to describe the time limit for OTP validity.

// const checkOtpExpiration = (res:Response, otpGeneratedTime:string, thresholdTime:number)=>{ 
//     const currentTime = Date.now()
//     if(currentTime - parseInt(otpGeneratedTime)  <= thresholdTime){ 
//         sendResponse(res, 200, "OTP is valid. You can proceed with password reset.")
//     }else{
//         sendResponse(res, 403, "OTP expired, Sorry try again later 😭!!")
//     }
// }

// export default checkOtpExpiration

// const checkOtpExpiration = (res: Response, otpGeneratedTime: Date | null, otpValidityDuration: number) => {
//       const currentTime = Date.now();
//       const timeDifference = otpGeneratedTime ? currentTime - otpGeneratedTime.getTime() : null;
      
//       if (timeDifference !== null && timeDifference <= otpValidityDuration) { // This condition checks if the OTP is still valid and if the otpGeneratedTime is not null. If the OTP is valid, it sends a success response.
//         sendResponse(res, 200, "OTP is valid. You can proceed with password reset.");
//       } else { // If the OTP has expired or if otpGeneratedTime is null, it sends a response indicating that the OTP has expired.
//         sendResponse(res, 403, "OTP has expired. Please request a new one.");
//       }
// }

// export default checkOtpExpiration

const isOtpExpired = (otpGeneratedTime: Date | null, otpValidityDuration: number): boolean => {
  if (!otpGeneratedTime) return true;  // null = treat as expired
  const currentTime = Date.now();
  return currentTime - otpGeneratedTime.getTime() > otpValidityDuration;
}

export default isOtpExpired
