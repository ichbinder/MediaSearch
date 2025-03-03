import type { Express } from "express";
import { searchMovies, getTrendingMovies, getMovieDetails } from "../services/tmdb";

export function registerMovieRoutes(app: Express) {
  app.get("/api/movies/search", async (req, res) => {
    const query = req.query.query as string;
    console.log("Received search request for:", query);

    if (!query || query.length < 2) {
      console.log("Query too short, returning empty results");
      return res.json({ results: [], total_pages: 0, total_results: 0 });
    }

    try {
      const data = await searchMovies({ query });
      return res.json(data);
    } catch (error) {
      console.error("Fehler bei der Filmsuche:", error);
      return res.status(500).json({
        error: "Interner Serverfehler",
        results: [],
        total_pages: 0,
        total_results: 0,
      });
    }
  });

  app.get("/api/movies/trending", async (_req, res) => {
    try {
      const data = await getTrendingMovies();
      res.json(data);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
      res.status(500).json({ 
        error: "Fehler beim Laden der Trending Movies",
        results: [],
        total_pages: 0,
        total_results: 0
      });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movieData = await getMovieDetails(req.params.id);
      res.json(movieData);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}