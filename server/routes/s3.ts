import express from "express";
import { checkMovieFileExists, getMovieDownloadUrl } from "../services/s3";

const router = express.Router();

router.get("/status/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    console.log("Checking S3 status for hash:", hash);
    const exists = await checkMovieFileExists(hash);
    console.log("S3 check result:", { hash, exists });
    res.json({ exists });
  } catch (error) {
    console.error("Error checking S3 file status:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: "Failed to check file status", details: errorMessage });
  }
});

router.get("/download/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const { title, year } = req.query;

    if (!title || !year) {
      throw new Error('Movie title and year are required');
    }

    console.log("Generating download URL for hash:", hash, "title:", title, "year:", year);
    const url = await getMovieDownloadUrl(hash, title.toString(), year.toString());
    res.json({ url });
  } catch (error) {
    console.error("Error generating download URL:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: "Failed to generate download URL", details: errorMessage });
  }
});

export default router;