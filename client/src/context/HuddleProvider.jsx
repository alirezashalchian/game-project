import React from "react";
import { HuddleClient, HuddleProvider as HuddleReactProvider } from "@huddle01/react";

const projectId = import.meta.env.VITE_HUDDLE_PROJECT_ID;
const huddleClient = new HuddleClient({ projectId });
console.log("[Huddle] projectId:", projectId);
export default function HuddleProvider({ children }) {
  console.log("[Huddle] projectId:", projectId);
  if (!projectId) console.warn("VITE_HUDDLE_PROJECT_ID is missing");
  return <HuddleReactProvider client={huddleClient}>{children}</HuddleReactProvider>;
}

