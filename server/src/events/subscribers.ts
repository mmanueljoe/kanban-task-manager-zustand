import { eventBus } from "@/events/eventBus.js";
import { ActivityService } from "@/services/ActivityService.js";

// Connects listeners to the bus. Called once at startup — this is the only place
// that knows both the bus and who reacts to it, so services stay ignorant of
// their listeners.
export function registerEventSubscribers(): void {
  const activityService = new ActivityService();
  eventBus.subscribe((event) => activityService.record(event));
}
