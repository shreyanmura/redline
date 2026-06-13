/*
 * backboard.ts — server-only wrapper around the Backboard SDK.
 * The API key lives in process.env.BACKBOARD_API_KEY and never reaches the client.
 *
 * `memory: "Auto"` plus a persisted threadId gives the coach memory of the
 * user's pattern history across sessions. In local dev (single process) the
 * threadId is cached in module scope; we also return it so callers can persist.
 *
 * The SDK is imported dynamically so a missing package or key degrades
 * gracefully to the local fallback instead of crashing the build.
 */
import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Durable thread store so the coach's memory survives across requests and dev
// recompiles (module-level state alone is unreliable in Next's dev runtime).
const THREAD_FILE = path.join(os.tmpdir(), "redline-thread.txt");
async function readThread(): Promise<string | undefined> {
  try {
    const id = (await fs.readFile(THREAD_FILE, "utf8")).trim();
    return id || undefined;
  } catch {
    return undefined;
  }
}
async function writeThread(id: string): Promise<void> {
  try {
    await fs.writeFile(THREAD_FILE, id);
  } catch {
    /* read-only fs (e.g. serverless) — fall back to in-memory cache */
  }
}

let cachedThreadId: string | undefined;
let clientPromise: Promise<any> | null = null;

async function getClient(): Promise<any | null> {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) return null;
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const mod: any = await import("backboard-sdk");
        const BackboardClient = mod.BackboardClient || mod.default?.BackboardClient || mod.default;
        return new BackboardClient({ apiKey });
      } catch (e) {
        console.warn("[redline] backboard-sdk unavailable:", (e as Error).message);
        return null;
      }
    })();
  }
  return clientPromise;
}

export async function coachMessage(
  content: string,
  threadId?: string
): Promise<{ text: string; threadId?: string }> {
  const client = await getClient();
  if (!client) throw new Error("backboard-unavailable");

  const tid = threadId || cachedThreadId || (await readThread());
  const payload = tid ? { content, threadId: tid } : { content, memory: "Auto" };
  const resp = await client.sendMessage(payload);

  const newTid = resp.threadId || resp.thread_id || tid;
  if (newTid) {
    cachedThreadId = newTid;
    await writeThread(newTid);
  }
  const text = resp.content || resp.message || resp.text || "";
  return { text, threadId: newTid };
}

export function hasKey(): boolean {
  return !!process.env.BACKBOARD_API_KEY;
}
