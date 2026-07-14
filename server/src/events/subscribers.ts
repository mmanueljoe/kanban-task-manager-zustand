import { eventBus } from "@/events/eventBus.js";
import { ActivityService } from "@/services/ActivityService.js";
import { NotificationService } from "@/services/NotificationService.js";

// Connects listeners to the bus. Called once at startup — this is the only place
// that knows both the bus and who reacts to it, so services stay ignorant of
// their listeners.
export function registerEventSubscribers(): void {
  const activityService = new ActivityService();
  const notificationService = new NotificationService();

  eventBus.subscribe((event) => activityService.record(event));
  eventBus.subscribe((event) => notificationService.notifyFromEvent(event));
}
