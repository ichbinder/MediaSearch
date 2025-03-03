import type { Express } from "express";
import { createServer } from "http";
import { setupAuth } from "./auth";
import s3Router from "./routes/s3";
import { registerAdminRoutes } from "./routes/admin";
import { registerMovieRoutes } from "./routes/movies";
import { registerDownloadRoutes } from "./routes/downloads";
import { registerWatchlistRoutes } from "./routes/watchlist";


export function registerRoutes(app: Express) {
    // Setup authentication
    setupAuth(app);

    // Register all route modules
    app.use("/api/s3", s3Router);
    registerAdminRoutes(app);
    registerMovieRoutes(app);
    registerDownloadRoutes(app);
    registerWatchlistRoutes(app);

    return createServer(app);
}