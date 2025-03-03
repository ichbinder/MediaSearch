import type { Express } from "express";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { download_status } from "@db/schema";
import { fetchNzbMovieData, fetchNzbVersionData, updateDownloadStatus } from "../services/nzb";
import { checkSabnzbdQueue, addNzbToSabnzbd } from "../services/sabnzbd";

export function registerDownloadRoutes(app: Express) {
    app.get("/api/nzb/movies/:tmdbId", async (req, res) => {
        try {
            const data = await fetchNzbMovieData(req.params.tmdbId);
            res.json(data);
        } catch (error) {
            console.error("NZB API Error:", error);
            res.status(500).json({
                error: "Failed to fetch NZB data",
                details: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    app.get("/api/nzb/movies/version/:hash", async (req, res) => {
        try {
            const data = await fetchNzbVersionData(req.params.hash);
            res.json(data);
        } catch (error) {
            console.error("NZB API Error:", error);
            res.status(500).json({
                error: "Failed to fetch NZB file",
                details: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    app.get("/api/nzb/check-queue/:hash", async (req, res) => {
        try {
            const status = await checkSabnzbdQueue(req.params.hash);
            res.json(status);
        } catch (error) {
            console.error("Error checking queue:", error);
            res.status(500).json({
                error: "Failed to check queue status",
                details: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    app.post("/api/nzb/download", async (req, res) => {
        const { hash, tmdbId } = req.body;

        if (!hash || !tmdbId) {
            return res.status(400).json({ error: "Hash und TMDB ID sind erforderlich" });
        }

        try {
            const { isInQueue, isProcessing, status } = await checkSabnzbdQueue(hash);
            if (isInQueue || isProcessing || status === "failed") {
                return res.status(409).json({
                    error: isProcessing
                        ? "Film wird gerade entpackt"
                        : status === "failed"
                            ? "Download fehlgeschlagen"
                            : "Film wird bereits heruntergeladen",
                });
            }

            await updateDownloadStatus(hash, "processing");

            const nzbData = await fetchNzbVersionData(hash);

            if (!nzbData.nzbFile) {
                await updateDownloadStatus(hash, "failed");
                throw new Error("No NZB file content found in response");
            }

            await addNzbToSabnzbd(nzbData.nzbFile, hash, tmdbId);
            await updateDownloadStatus(hash, "downloading");

            res.json({ status: "downloading" });
        } catch (error) {
            console.error("Error sending NZB to Sabnzbd:", error);
            await updateDownloadStatus(hash, "failed");
            res.status(500).json({
                error: "Failed to send NZB to Sabnzbd",
                details: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });

    app.get("/api/download-status/:hash", async (req, res) => {
        try {
            const status = await db.query.download_status.findFirst({
                where: eq(download_status.hash, req.params.hash),
            });
            res.json(status || { status: "unknown" });
        } catch (error) {
            console.error("Error fetching download status:", error);
            res.status(500).json({ error: "Interner Serverfehler" });
        }
    });
}