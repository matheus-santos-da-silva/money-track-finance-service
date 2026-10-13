import { sign } from "jsonwebtoken";

export const getTestAuthToken = (userId: string) => {
  return sign({ id: userId }, process.env.JWT_SECRET);
};
