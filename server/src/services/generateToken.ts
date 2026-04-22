import jwt from "jsonwebtoken";
import { envConfig } from "../config/config";

const generateToken = (userId: string) => {
      const token = jwt.sign(
        { id: userId },
        envConfig.jwtSecretKey as string,
        { expiresIn: "1d" },
      );
      return token;
}

export default generateToken;