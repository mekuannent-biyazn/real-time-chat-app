import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,    // Prevents XSS attacks
    sameSite: isProd ? "none" : "strict", // "none" required for cross-domain (Vercel + Render)
    secure: isProd,    // must be true when sameSite=none
  });

  return token;
};

export const clearToken = (res) => {
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    sameSite: isProd ? "none" : "strict",
    secure: isProd,
  });
};
