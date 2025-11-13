import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
connectDB();

const app = express();

// CORS configuration - allow frontend to access backend
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000", "http://localhost:3000"];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (cURL, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // in development allow local network IPs (e.g. http://192.168.x.x:3000)
    if (process.env.NODE_ENV === "development") {
      try {
        const match = origin.match(/^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/);
        if (match) return callback(null, true);
      } catch (e) {
        // fall through
      }
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running ✅" });
});

// Routes
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
