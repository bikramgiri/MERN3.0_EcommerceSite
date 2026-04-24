import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { envConfig } from "../config/config";

const generateToken = (userId: string, expiresIn: string) => {
      const token = jwt.sign(
        { id: userId },
        envConfig.jwtSecretKey as Secret,
        { expiresIn: expiresIn } as SignOptions,
      );
      return token;
}

export default generateToken;