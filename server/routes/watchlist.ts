import type { Express, Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "@db";
import { watchlist_movies } from "@db/schema";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Nicht eingeloggt" });
}

export function registerWatchlistRoutes(app: Express) {
  app.get("/api/watchlist", ensureAuthenticated, async (req, res) => {
    const user_id = req.user!.id;
    const movies = await db.query.watchlist_movies.findMany({
      where: eq(watchlist_movies.user_id, user_id),
      orderBy: (watchlist_movies, { desc }) => [
        desc(watchlist_movies.added_at),
      ],
    });
    res.json(movies);
  });

  app.post("/api/watchlist", ensureAuthenticated, async (req, res) => {
    const { movie_id, movie_title, poster_path } = req.body;
    const user_id = req.user!.id;

    const movie = await db
      .insert(watchlist_movies)
      .values({
        user_id,
        movie_id,
        movie_title,
        poster_path,
      })
      .returning();

    res.json(movie[0]);
  });

  app.delete(
    "/api/watchlist/:movieId",
    ensureAuthenticated,
    async (req, res) => {
      const user_id = req.user!.id;
      const movie_id = parseInt(req.params.movieId);

      await db
        .delete(watchlist_movies)
        .where(
          and(
            eq(watchlist_movies.movie_id, movie_id),
            eq(watchlist_movies.user_id, user_id),
          ),
        );

      res.status(204).end();
    },
  );
}
