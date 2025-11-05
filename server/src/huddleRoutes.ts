import { Router } from "express";
import { AccessToken, Role } from "@huddle01/server-sdk/auth";

const router = Router();

const HUDDLE_API_KEY = process.env.HUDDLE_API_KEY;

// In-memory mapping from our alias (e.g., "h-room-4-4-4") to real Huddle roomId
const roomAliasToId = new Map<string, string>();
// Prevent duplicate creations under race
const roomAliasPending = new Map<string, Promise<string>>();

// Minimal fetch wrapper (Node 20 has global fetch; type cast to avoid TS lib issues)
const doFetch = (globalThis as any).fetch as (url: string, init?: any) => Promise<any>;

async function getOrCreateHuddleRoomId(alias: string): Promise<string> {
  if (roomAliasToId.has(alias)) return roomAliasToId.get(alias)!;
  if (roomAliasPending.has(alias)) return roomAliasPending.get(alias)!;

  const promise = (async () => {
    try {
      // Double-check cache
      if (roomAliasToId.has(alias)) return roomAliasToId.get(alias)!;

      const url = "https://api.huddle01.com/api/v2/sdk/rooms/create-room";
      const body = JSON.stringify({ title: alias });
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": String(HUDDLE_API_KEY),
      } as Record<string, string>;

      console.log("[Huddle] creating room via REST for alias:", alias);
      const resp = await doFetch(url, { method: "POST", headers, body });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        console.error("[Huddle] create-room failed", resp.status, json);
        throw new Error("create-room failed: " + resp.status);
      }

      const roomId = json?.data?.roomId || json?.roomId || json?.data?.id || json?.id;
      if (!roomId || typeof roomId !== "string") {
        console.error("[Huddle] unexpected create-room response", json);
        throw new Error("create-room: missing roomId in response");
      }
      roomAliasToId.set(alias, roomId);
      console.log("[Huddle] room created:", alias, "=>", roomId);
      return roomId;
    } finally {
      roomAliasPending.delete(alias);
    }
  })();

  roomAliasPending.set(alias, promise);
  return promise;
}

router.post("/api/huddle/token", async (req, res) => {
  try {
    const { huddleRoomId, role } = req.body || {};
    console.log("[Huddle] token request", {
      huddleRoomId,
      role,
      hasKey: !!HUDDLE_API_KEY,
    });

    if (!huddleRoomId || typeof huddleRoomId !== "string") {
      console.error("[Huddle] invalid room id input");
      return res.status(400).json({ error: "huddleRoomId required" });
    }

    // Basic validation: enforce our expected naming convention
    if (!/^h-room-[0-9]+-[0-9]+-[0-9]+$/.test(huddleRoomId)) {
      console.error("[Huddle] invalid room id format", huddleRoomId);
      return res.status(400).json({ error: "invalid room id format" });
    }

    if (!HUDDLE_API_KEY) {
      console.error("[Huddle] missing HUDDLE_API_KEY env");
      return res.status(501).json({ error: "Server not configured with HUDDLE_API_KEY" });
    }

    // Resolve real Huddle roomId (create room if needed) from our alias
    const realRoomId = await getOrCreateHuddleRoomId(huddleRoomId);

    // Map our role to Huddle Role and permissions
    const isSpeaker = role === "speaker";
    const accessToken = new AccessToken({
      apiKey: HUDDLE_API_KEY as string,
      roomId: realRoomId,
      role: isSpeaker ? Role.HOST : Role.GUEST,
      permissions: {
        admin: isSpeaker,               // host can be admin; guest not required
        canConsume: true,
        canProduce: isSpeaker,          // only speaker publishes
        canProduceSources: { cam: false, mic: isSpeaker, screen: false },
        canRecvData: true,
        canSendData: true,              // allow data channel so peers can discover each other
        canUpdateMetadata: true,        // allow SDK to sync metadata
      },
      options: { metadata: {} },
    });
    const tokenStr = await accessToken.toJwt();

    if (!tokenStr || typeof tokenStr !== "string" || tokenStr.length < 10) {
      console.error("[Huddle] token mint returned empty/invalid");
      return res.status(500).json({ error: "failed to mint token" });
    }

    console.log("[Huddle] token minted:", tokenStr.slice(0, 16) + "...", "len:", tokenStr.length);
    return res.json({ token: tokenStr, roomId: realRoomId });
  } catch (err: any) {
    console.error("[Huddle] token mint error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "token error" });
  }
});

// Optional debug endpoint to verify server configuration
router.get("/api/huddle/debug", (req, res) => {
  res.json({ hasKey: !!HUDDLE_API_KEY, keyPreview: HUDDLE_API_KEY ? String(HUDDLE_API_KEY).slice(0, 6) + "..." : null });
});

export default router;


