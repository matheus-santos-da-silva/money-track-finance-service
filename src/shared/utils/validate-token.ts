import { verify } from "jsonwebtoken";
import { TokenPayload } from "src/domain/DTO/token-payload-DTO";

export const validateToken = (authHeader: string, user_id: string): boolean => {
  let validToken: TokenPayload;
  const token = authHeader.split(" ")[1];

  validToken = verify(token, process.env.JWT_SECRET) as TokenPayload;
  return validToken.id === user_id;
};
