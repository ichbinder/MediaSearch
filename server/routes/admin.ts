import type { Express as ExpressApp, Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { users, watchlist_movies } from "@db/schema";
import { hashPassword } from "../auth";
import type { SelectUser } from "@db/schema";

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Nicht eingeloggt" });
  }

  const user = req.user as SelectUser;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Keine Berechtigung" });
  }

  next();
}

export function registerAdminRoutes(app: ExpressApp) {
  app.get("/api/admin/users", ensureAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { asc }) => [asc(users.username)],
      });
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  app.patch("/api/admin/users/:id/role", ensureAdmin, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    const adminUser = req.user as SelectUser;

    try {
      if (userId === adminUser.id) {
        return res.status(400).json({ 
          error: "Sie können Ihre eigene Rolle nicht ändern" 
        });
      }

      if (role !== "user" && role !== "admin") {
        return res.status(400).json({ error: "Ungültige Rolle" });
      }

      const updatedUser = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser.length) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }

      res.json(updatedUser[0]);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", ensureAdmin, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;
    const adminUser = req.user as SelectUser;

    try {
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
          error: "Passwort muss mindestens 6 Zeichen lang sein" 
        });
      }

      if (userId === adminUser.id) {
        return res.status(400).json({
          error: "Benutzen Sie die Profilseite um Ihr eigenes Passwort zu ändern"
        });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser.length) {
        return res.status(404).json({ error: "Benutzer nicht gefunden" });
      }

      res.json({ message: "Passwort erfolgreich zurückgesetzt" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  app.post("/api/admin/users", ensureAdmin, async (req: Request, res: Response) => {
    const { username, password, role } = req.body;

    try {
      if (!username || username.length < 3) {
        return res.status(400).json({ 
          error: "Benutzername muss mindestens 3 Zeichen lang sein" 
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ 
          error: "Passwort muss mindestens 6 Zeichen lang sein" 
        });
      }

      if (role !== "user" && role !== "admin") {
        return res.status(400).json({ error: "Ungültige Rolle" });
      }

      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        return res.status(400).json({ error: "Benutzername bereits vergeben" });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await db
        .insert(users)
        .values({ username, password: hashedPassword, role })
        .returning();

      res.status(201).json(newUser[0]);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });

  app.delete("/api/admin/users/:id", ensureAdmin, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const adminUser = req.user as SelectUser;

    try {
      if (userId === adminUser.id) {
        return res.status(400).json({ 
          error: "Sie können Ihren eigenen Account nicht löschen" 
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(watchlist_movies)
          .where(eq(watchlist_movies.user_id, userId));

        const deletedUser = await tx
          .delete(users)
          .where(eq(users.id, userId))
          .returning();

        if (!deletedUser.length) {
          throw new Error("Benutzer nicht gefunden");
        }
      });

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof Error && error.message === "Benutzer nicht gefunden") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  });
}