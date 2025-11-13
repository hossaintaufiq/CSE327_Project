import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import connectDB from "./config/db.js"; // later

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend running successfully!");
});

// await connectDB(); // Uncomment later when DB ready

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
