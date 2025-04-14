import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import quotationRouter from "./routes/quotaionRoutes.js";
import deliveryRouter from "./routes/deliveryRoutes.js";
import { connectDB } from "./config/db.js";
import helmet from "helmet";
import morgan from "morgan";
dotenv.config();

const app = express();
const PORT = 3005;
app.use(helmet());
app.use(morgan("tiny"));
// Correct and more specific CORS configuration:
app.use(
  cors({
    origin: "http://localhost:5173", // adjust to your frontend port
    methods: ["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Optional if you're sending cookies
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/user", userRouter);
app.use("/api/quotation", quotationRouter);
app.use("/api/deliveries", deliveryRouter);

app.use(express.static("/var/www/glomium/isc/invoice-frontend/dist"));

app.get("*", (req, res) => {
  res.sendFile("/var/www/glomium/isc/invoice-frontend/dist/index.html");
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
