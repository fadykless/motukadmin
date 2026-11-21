import {QueueError, validKey, sourceContext, liveTask, taskDto, millis} from "./whatsapp-queue-policy.mjs";
export function queueStore(db, clock = Date.now) {
  const ref = id => { if (!validKey(id)) throw new QueueError(400, "INVALID_KEY"); return db.collection("waDryRunAdvisorRequests").doc(id); };
  return {
    ingest: (receiptKey, actor) => db.runTransaction(async tx => {
      const now = clock(), target = ref(receiptKey);
      const [source, previous] = await Promise.all([tx.get(db.collection("waDryRunMessages").doc(receiptKey)), tx.get(target)]);
      if (!source.exists) throw new QueueError(404, "SOURCE_NOT_FOUND");
      const value = source.data(), context = sourceContext(value, now);
      if (previous.exists) {
        const old = previous.data();
        if (!liveTask(old, now) || old.sourceFingerprint !== value.fingerprint || JSON.stringify(old.context) !== JSON.stringify(context)) throw new QueueError(409, "SOURCE_CONFLICT");
        return {created: false, item: taskDto(target.id, old)};
      }
      const item = {receiptKey, sourceFingerprint: value.fingerprint, context, dryRun: true, fixtureOnly: true,
        state: "new", version: 0, assignedTo: null, createdAt: now, expiresAt: new Date(Math.min(millis(value.expiresAt), now + 7 * 86400000)),
        audit: {imported: {actorId: actor.uid, at: now}, claimed: null, closed: null}};
      tx.create(target, item);
      return {created: true, item: taskDto(target.id, item)};
    }),
    list: async limit => {
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new QueueError(400, "INVALID_LIMIT");
      const now = clock(), snapshot = await db.collection("waDryRunAdvisorRequests").orderBy("createdAt", "desc").limit(100).get();
      const items = snapshot.docs.filter(doc => liveTask(doc.data(), now)).slice(0, limit).map(doc => taskDto(doc.id, doc.data()));
      return {items, windowLimit: 100, partial: true};
    },
    update: (id, action, expectedVersion, actor) => db.runTransaction(async tx => {
      if (!["claim", "close"].includes(action) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 0 || expectedVersion >= Number.MAX_SAFE_INTEGER) throw new QueueError(400, "INVALID_ACTION");
      const now = clock(), target = ref(id), snapshot = await tx.get(target);
      if (!snapshot.exists || !liveTask(snapshot.data(), now)) throw new QueueError(404, "TASK_NOT_FOUND");
      const old = snapshot.data();
      // A retry of the same completed transition is a no-op, never another audit.
      if (old.version === expectedVersion + 1 && old.assignedTo === actor.uid &&
          ((action === "claim" && old.state === "in_progress") || (action === "close" && old.state === "closed"))) return {changed: false, item: taskDto(id, old)};
      if (old.version !== expectedVersion) throw new QueueError(409, "VERSION_CONFLICT");
      if (action === "claim" ? old.state !== "new" || old.assignedTo !== null : old.state !== "in_progress" || old.assignedTo !== actor.uid) throw new QueueError(409, "TRANSITION_CONFLICT");
      const item = {...old, state: action === "claim" ? "in_progress" : "closed", assignedTo: actor.uid,
        version: old.version + 1, audit: {...old.audit, [action === "claim" ? "claimed" : "closed"]: {actorId: actor.uid, at: now}}};
      tx.set(target, item);
      return {changed: true, item: taskDto(id, item)};
    })
  };
}
