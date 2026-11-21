import {createQueueHandlers} from "./whatsapp-queue-handlers.mjs";
import {queueStore} from "./whatsapp-queue-store.mjs";
export const queueHandlers = createQueueHandlers({open: async request => {
  const {requireStaff, adminDb} = await import("./admin.js");
  const staff = await requireStaff(request);
  return {staff, store: queueStore(adminDb())};
}});
