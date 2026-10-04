import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createConnection } from "mysql2/promise";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const conn = await createConnection({ uri: url });
await migrate(drizzle(conn), { migrationsFolder: "./drizzle" });
await conn.end();
console.log("migrations applied");
