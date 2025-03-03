import type { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { users } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { comparePasswords } from "../services/password";

async function getUserByUsername(username: string) {
  return db.select().from(users).where(eq(users.username, username)).limit(1);
}

// Authentication middleware
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Nicht eingeloggt" });
}

// Admin middleware
export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Keine Administratorrechte" });
}

export function registerAuthRoutes(app: Express) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await getUserByUsername(username);

        if (!user) {
          return done(null, false, { message: "Ungültige Anmeldedaten" });
        }

        if (!user.is_approved) {
          return done(null, false, { message: "Ihr Account wurde noch nicht freigegeben" });
        }

        if (!user.is_active) {
          return done(null, false, { message: "Ihr Account wurde gesperrt" });
        }

        const passwordValid = await comparePasswords(password, user.password);
        if (!passwordValid) {
          return done(null, false, { message: "Ungültige Anmeldedaten" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(401).json({ message: info?.message || "Ungültige Anmeldedaten" });
      }

      try {
        await new Promise<void>((resolve, reject) => {
          req.logIn(user, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        res.json(user);
      } catch (err) {
        next(err);
      }
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.clearCookie('sid');
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}