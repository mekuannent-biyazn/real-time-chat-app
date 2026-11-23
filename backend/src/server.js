
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

// ==================================
// CORS CONFIGURATION
// ==================================

const allowedOrigins = [
    "http://localhost:5173",
    /^https:\/\/.*\.vercel\.app$/,
];

app.use(
    cors({
        origin: (origin, callback) => {

            // Allow requests without an Origin header
            if (!origin) {
                return callback(null, true);
            }

            const isAllowed = allowedOrigins.some((allowed) =>
                typeof allowed === "string"
                    ? allowed === origin
                    : allowed.test(origin)
            );

            if (isAllowed) {
                return callback(null, true);
            }

            console.log("Blocked CORS origin:", origin);

            return callback(new Error("Not allowed by CORS"));
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        credentials: true,
    })
);

// ==================================
// GLOBAL MIDDLEWARE
// ==================================

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// ==================================
// API ROUTES
// ==================================

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// ==================================
// START SERVER
// ==================================

server.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    try {
        await connectDB();
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
    }
});
