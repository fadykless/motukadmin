import {queueHandlers} from "@/lib/server/whatsapp-queue-runtime.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const PATCH = queueHandlers.PATCH;
