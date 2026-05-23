import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,       // Prevents XSS attacks
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // "none" required for cross-domain (Vercel + Render)
    secure: process.env.NODE_ENV !== "development", // HTTPS only in production
  });

  return token;
};
