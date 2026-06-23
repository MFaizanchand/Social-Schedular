import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dns from 'dns';
import authRouter from "./routes/authRoutes.js";
import socialORouter from "./routes/socialAuthRoutes.js";
import accountRouter from "./routes/accountsRoutes.js";
import postRouter from "./routes/postRoutes.js";
const app = express();
dns.setServers(['8.8.8.8', '8.8.4.4']);
const startServer = async () => {
  try {
    await connectDB();

    // Middleware
    app.use(cors());
    app.use(express.json());

    const port = process.env.PORT || 3000;

    app.get("/", (_req: Request, res: Response) => {
      res.send("Server is Live!");
    });
        app.use("/api/auth" , authRouter);

        app.use("/api/oauth", socialORouter)
        app.use("/api/accounts", accountRouter)
        app.use("/api/posts" , postRouter)
    app.use((err : any, req :Request, res: Response , next : NextFunction )=>{
      console.error(err);
      res.status(500).send(err?.response?.data?.message || err?.message )
    })





    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });


  } catch (error) {
    console.error("Server startup failed:", error);
  }
};

startServer();