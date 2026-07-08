// scripts/_env.ts
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // also load .env if present (does not override already-set vars)
