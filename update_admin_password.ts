import "dotenv/config";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function updateAdminPassword() {
  try {
    const hashedPassword = await hashPassword("adminpass123");

    // Check if admin user exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (existingAdmin) {
      // Update existing admin
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.username, "admin"))
        .execute();
      console.log("Admin password updated successfully");
    } else {
      // Create new admin user
      await db
        .insert(users)
        .values({
          username: "admin",
          password: hashedPassword,
          role: "admin",
          is_active: true,
          is_approved: true,
        })
        .execute();
      console.log("Admin user created successfully");
    }
  } catch (error) {
    console.error("Error updating/creating admin:", error);
    process.exit(1);
  }
}

updateAdminPassword().catch(console.error);
