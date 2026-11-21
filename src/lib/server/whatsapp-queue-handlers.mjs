import {assertQueueEnvironment, QueueError} from "./whatsapp-queue-policy.mjs";
const json = (body, status = 200) => Response.json(body, {status, headers: {"Cache-Control": "no-store"}});
async function body(request, allowed) {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > 1024)) throw new QueueError(413, "BODY_LIMIT");
  const reader = request.body?.getReader();
  if (!reader) throw new QueueError(400, "INVALID_BODY");
  let size = 0; const chunks = [];
  try {
    while (true) {const {value, done} = await reader.read(); if (done) break; size += value.byteLength;
      if (size > 1024) {await reader.cancel(); throw new QueueError(413, "BODY_LIMIT");} chunks.push(Buffer.from(value));}
  } finally {reader.releaseLock();}
  let value; try {value = JSON.parse(Buffer.concat(chunks).toString("utf8"));} catch {throw new QueueError(400, "INVALID_BODY");}
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== allowed.length || Object.keys(value).some(key => !allowed.includes(key))) throw new QueueError(400, "FORBIDDEN_FIELDS");
  return value;
}
export function createQueueHandlers({open, env = () => process.env}) {
  const run = action => async (request, route) => {
    try {
      // Guard precedes even importing the existing Firebase Admin module.
      assertQueueEnvironment(env());
      const {staff, store} = await open(request);
      if (!staff?.uid || !["admin", "manager"].includes(staff.role)) throw new QueueError(403, "ACCESS_DENIED");
      return await action(request, route, store, staff);
    } catch (error) {
      const status = error instanceof QueueError || [401, 403].includes(error?.status) ? error.status : 500;
      return json({error: error instanceof QueueError ? error.message : status === 401 ? "AUTH_REQUIRED" : status === 403 ? "ACCESS_DENIED" : "QUEUE_FAILURE"}, status);
    }
  };
  return {
    GET: run(async (request, route, store) => {
      const params = new URL(request.url).searchParams;
      if ([...params.keys()].some(key => key !== "limit") || params.getAll("limit").length > 1) throw new QueueError(400, "INVALID_FILTER");
      return json(await store.list(Number(params.get("limit") || 20)));
    }),
    POST: run(async (request, route, store, staff) => {
      const value = await body(request, ["receiptKey"]);
      return json(await store.ingest(value.receiptKey, staff));
    }),
    PATCH: run(async (request, route, store, staff) => {
      const {id} = await route.params, value = await body(request, ["action", "expectedVersion"]);
      return json(await store.update(id, value.action, value.expectedVersion, staff));
    })
  };
}
