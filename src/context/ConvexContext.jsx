import React from "react";
import { ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";

// Create the Convex client
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

export function ConvexWrapper({ children }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
