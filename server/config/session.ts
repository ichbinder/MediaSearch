import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "@db";

const PostgresSessionStore = connectPg(session);

export function createSessionStore() {
  const store = new PostgresSessionStore({
    pool,
    createTableIfMissing: true,
    tableName: "session",
    schemaName: "public",
    pruneSessionInterval: 86400,
  });

  store.on("error", function (error) {
    console.error("Session Store Error:", error);
  });

  return store;
}

export function getSessionConfig(store: session.Store): session.SessionOptions {
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      "SESSION_SECRET environment variable is required for user authentication"
    );
  }

  return {
    store,
    secret: process.env.SESSION_SECRET,
    name: "sid",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    },
  };
}
