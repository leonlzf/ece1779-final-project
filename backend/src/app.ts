import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/routes";

const app = express();
app.use(cors());
app.use(express.json());                  
app.get("/healthz", (_req, res) => res.send("ok"));
app.use("/auth", authRouter); 
export default app;
