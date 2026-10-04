import { z } from "zod";

// Everything deployment-specific (domain, keys, DB credentials) comes from the
// environment. Nothing identifying lives in the repo. See .env.example.
const schema = z.object({
  DATABASE_URL: z.string().url(),
  APP_ORIGIN: z.string().url(), // e.g. https://your.domain — used for links and WebAuthn origin
  WEBAUTHN_RP_ID: z.string().min(1), // bare hostname, no scheme/port
  SESSION_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Parsed lazily so `next build` doesn't need runtime secrets. */
export function env(): Env {
  cached ??= schema.parse(process.env);
  return cached;
}
