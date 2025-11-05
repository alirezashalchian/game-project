/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting (without Colyseus Cloud), you can manually
 * instantiate a Colyseus Server as documented here:
 *
 * See: https://docs.colyseus.io/server/api/#constructor-options
 */
import { listen } from "@colyseus/tools";
import * as dotenv from "dotenv";

// Load environment variables (.env.production or .env.development)
dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env.production" : ".env.development" });

// Import Colyseus config
import app from "./app.config";

// Create and listen on 2567 (or PORT environment variable.)
listen(app);
