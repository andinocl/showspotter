import { index, int, mysqlTable, timestamp, varchar, text } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(), // uuid
  displayName: varchar("display_name", { length: 100 }).notNull(),
  // IATA code entered in-app, e.g. "SEA". Home location is per-user data, never in code.
  homeAirport: varchar("home_airport", { length: 3 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passkeys = mysqlTable(
  "passkeys",
  {
    id: varchar("id", { length: 255 }).primaryKey(), // base64url credential id
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(), // base64url
    counter: int("counter").notNull().default(0),
    transports: varchar("transports", { length: 255 }),
    label: varchar("label", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("passkeys_user_idx").on(t.userId)],
);
