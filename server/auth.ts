import type { Express } from "express";
import passport from "passport";
import session from "express-session";
import { users, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { createSessionStore, getSessionConfig } from "./config/session";
import { registerAuthRoutes } from "./routes/auth";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const store = createSessionStore();
  const sessionConfig = getSessionConfig(store);

  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return done(null, false);
      }

      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  registerAuthRoutes(app);
}

export { ensureAuthenticated, ensureAdmin } from "./routes/auth";
export { hashPassword } from "./services/password";