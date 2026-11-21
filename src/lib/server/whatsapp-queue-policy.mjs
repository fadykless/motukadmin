export class QueueError extends Error {
  constructor(status, code) { super(code); this.status = status; }
}
export const validKey = key => typeof key === "string" && /^[a-f0-9]{64}$/.test(key);
const TYPES = ["sale", "rent", "parts"], CURRENCIES = ["USD", "CDF"], UNITS = ["day", "week", "month"];
const CITIES = ["Kinshasa", "Lubumbashi", "Goma", "Matadi", "Kisangani", "Mbuji-Mayi", "Bukavu"];
const BRANDS = ["Toyota", "Nissan", "Honda", "Hyundai", "Kia", "Mercedes", "BMW", "Suzuki", "Mitsubishi", "Ford", "Renault", "Peugeot", "Volkswagen", "Mazda", "Lexus", "Isuzu", "Chevrolet", "Jeep"];
export function millis(value) {
  try { return value instanceof Date ? value.getTime() : typeof value?.toMillis === "function" ? value.toMillis() : NaN; }
  catch { return NaN; }
}
export function assertQueueEnvironment(env = process.env) {
  const exact = {WHATSAPP_ADMIN_DRY_RUN_ENABLED: "true", NEXT_PUBLIC_C2_EMULATOR_MODE: "true", GCLOUD_PROJECT: "demo-motuka-c2", GOOGLE_CLOUD_PROJECT: "demo-motuka-c2", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080"};
  if (!["test", "development"].includes(env.NODE_ENV) || Object.entries(exact).some(([key, value]) => env[key] !== value) ||
    ["GOOGLE_APPLICATION_CREDENTIALS", "FIREBASE_SERVICE_ACCOUNT_KEY", "FIREBASE_SERVICE_ACCOUNT_JSON", "WHATSAPP_ACCESS_TOKEN", "META_ACCESS_TOKEN"].some(key => Boolean(env[key]))) throw new QueueError(503, "DRY_RUN_DISABLED");
}
const bad = () => { throw new QueueError(400, "INVALID_SOURCE"); };
const hasOnly = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
const nullableChoice = (value, choices) => value === null || choices.includes(value);
export function sourceContext(source, now) {
  if (!source || source.dryRun !== true || source.status !== "prepared" || !validKey(source.fingerprint) || !validKey(source.sessionKey) ||
      !Number.isInteger(source.receivedAt) || source.receivedAt > now + 300000 || source.receivedAt < now - 7 * 86400000 ||
      !(millis(source.expiresAt) > now) || millis(source.expiresAt) > source.receivedAt + 7 * 86400000 || source.draft?.kind !== "human_intent") bad();
  return normalizeContext(source.draft.context);
}
export function normalizeContext(context) {
  const criteria = context?.criteria;
  if (!hasOnly(context, ["schema", "dryRun", "scope", "criteria", "offer"]) || context.schema !== "motuka.whatsapp.human-intent.v1" || context.dryRun !== true ||
      !["general", "selected", "selection_unavailable"].includes(context.scope) || !hasOnly(criteria, ["type", "city", "brand", "budgetMax", "currency", "rentType"]) ||
      !nullableChoice(criteria.type, TYPES) || !nullableChoice(criteria.city, CITIES) || !nullableChoice(criteria.brand, BRANDS) ||
      !nullableChoice(criteria.currency, CURRENCIES) || !nullableChoice(criteria.rentType, UNITS) ||
      !(criteria.budgetMax === null || (Number.isFinite(criteria.budgetMax) && criteria.budgetMax > 0 && criteria.budgetMax <= 1e12))) bad();
  let offer = null;
  if (context.scope === "selected") {
    const v = context.offer;
    if (!hasOnly(v, ["id", "type", "price", "currency", "url", "rentType"]) || !/^[A-Za-z0-9_-]{1,128}$/.test(v.id || "") || !TYPES.includes(v.type) || !CURRENCIES.includes(v.currency) ||
        !Number.isFinite(v.price) || v.price < 0.01 || v.price > 1e12 || Math.round(v.price * 100) / 100 !== v.price ||
        v.url !== `https://motukapp.com/${v.type === "rent" ? "location" : "marketplace"}/${v.id}` ||
        (v.type === "rent" ? !UNITS.includes(v.rentType) : Object.hasOwn(v, "rentType"))) bad();
    offer = {id: v.id, type: v.type, price: v.price, currency: v.currency, url: v.url, ...(v.type === "rent" ? {rentType: v.rentType} : {})};
  } else if (context.offer !== null) bad();
  return {schema: context.schema, dryRun: true, scope: context.scope, criteria: {...criteria}, offer};
}
export function liveTask(value, now) {
  try { normalizeContext(value?.context); } catch { return false; }
  const actor = item => hasOnly(item, ["actorId", "at"]) && typeof item.actorId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(item.actorId) && Number.isInteger(item.at);
  if (!actor(value?.audit?.imported) || !(value.audit.claimed === null || actor(value.audit.claimed)) || !(value.audit.closed === null || actor(value.audit.closed)) ||
      !(value.assignedTo === null || (typeof value.assignedTo === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value.assignedTo)))) return false;
  if (value.state === "new" ? value.version !== 0 || value.assignedTo !== null || value.audit.claimed !== null || value.audit.closed !== null
    : value.state === "in_progress" ? value.version !== 1 || value.assignedTo !== value.audit.claimed?.actorId || value.audit.closed !== null
    : value.state === "closed" ? value.version !== 2 || value.assignedTo !== value.audit.claimed?.actorId || value.assignedTo !== value.audit.closed?.actorId : true) return false;
  return value?.dryRun === true && value.fixtureOnly === true && validKey(value.sourceFingerprint) && validKey(value.receiptKey) &&
    ["new", "in_progress", "closed"].includes(value.state) && Number.isSafeInteger(value.version) && value.version >= 0 &&
    Number.isInteger(value.createdAt) && value.createdAt > 0 && value.createdAt <= now + 300000 &&
    millis(value.expiresAt) > now && millis(value.expiresAt) <= value.createdAt + 7 * 86400000;
}
export function taskDto(id, value) {
  return {id, state: value.state, version: value.version, assignedTo: value.assignedTo, createdAt: value.createdAt,
    expiresAt: millis(value.expiresAt), context: normalizeContext(value.context), dryRun: true, fixtureOnly: true,
    audit: {imported: value.audit.imported, claimed: value.audit.claimed, closed: value.audit.closed}};
}
