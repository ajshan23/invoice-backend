import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import invoiceRouter from "./routes/invoiceRoutes.js";
import { connectDB } from "./config/db.js";
dotenv.config();

const app = express();
const PORT = 3005;

// Correct and more specific CORS configuration:
app.use(
  cors({
    origin: "*", // Allow all origins (INSECURE - DO NOT USE IN PRODUCTION)
    methods: ["GET", "POST", "OPTIONS","DELETE","PUT"], // Or specify the methods you need
    allowedHeaders: ["Content-Type"], // Or specify the headers you need
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/user", userRouter);
app.use("/api/invoice", invoiceRouter);

app.use(express.static("/var/www/pdf/pdf-frontend/dist"));

app.get("*", (req, res) => {
  res.sendFile("/var/www/pdf/pdf-frontend/dist/index.html");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
