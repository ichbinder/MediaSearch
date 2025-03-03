import { db } from "@db";
import { eq } from "drizzle-orm";
import { download_status } from "@db/schema";

const NZB_API_URL = process.env.NZB_API_URL?.replace(/\/+$/, "");
const NZB_USERNAME = process.env.NZB_USERNAME;
const NZB_PASSWORD = process.env.NZB_PASSWORD;

if (!NZB_API_URL || !NZB_USERNAME || !NZB_PASSWORD) {
  throw new Error("NZB API credentials are required");
}

let nzbToken: string | null = null;
let tokenExpiration: Date | null = null;

export async function getNzbToken() {
  try {
    if (nzbToken && tokenExpiration && new Date() < tokenExpiration) {
      return nzbToken;
    }

    const response = await fetch(`${NZB_API_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: NZB_USERNAME,
        password: NZB_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get NZB token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    nzbToken = data.token;
    tokenExpiration = new Date(Date.now() + 55 * 60 * 1000); // Token expires in 55 minutes
    return nzbToken;
  } catch (error) {
    console.error("Detailed NZB token error:", error);
    throw new Error(
      "Failed to get NZB token: " +
        (error instanceof Error ? error.message : "Unknown error"),
    );
  }
}

export async function fetchNzbMovieData(tmdbId: string) {
  const token = await getNzbToken();
  const response = await fetch(`${NZB_API_URL}/movies/${tmdbId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch movie data: ${response.status}`);
  }

  return response.json();
}

export async function fetchNzbVersionData(hash: string) {
  const token = await getNzbToken();
  const response = await fetch(`${NZB_API_URL}/movies/version/${hash}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NZB file: ${response.status}`);
  }

  return response.json();
}

export async function updateDownloadStatus(hash: string, status: string) {
  try {
    const existingStatus = await db.query.download_status.findFirst({
      where: eq(download_status.hash, hash),
    });

    if (existingStatus) {
      return await db
        .update(download_status)
        .set({ status, updated_at: new Date() })
        .where(eq(download_status.hash, hash))
        .returning();
    } 

    return await db
      .insert(download_status)
      .values({
        hash,
        status,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();
  } catch (error) {
    console.error("Error updating download status:", error);
    throw error;
  }
}
