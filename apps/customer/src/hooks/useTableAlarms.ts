const ALARMS_KEY = 'sb-table-alarms';
const NOTIFS_KEY = 'sb-table-notifications';

export interface StoredAlarm {
  orderId: string;
  tableName: string;
  openedAt: string;
  thresholdMinutes: number;
  setAt: number;
}

export interface FiredNotification {
  orderId: string;
  tableName: string;
  firedAt: number;
}

export function readAlarms(): Record<string, StoredAlarm> {
  try { return JSON.parse(localStorage.getItem(ALARMS_KEY) ?? '{}'); } catch { return {}; }
}

export function readNotifications(): FiredNotification[] {
  try { return JSON.parse(localStorage.getItem(NOTIFS_KEY) ?? '[]'); } catch { return []; }
}

export function saveAlarm(alarm: StoredAlarm) {
  const all = readAlarms();
  all[alarm.orderId] = alarm;
  localStorage.setItem(ALARMS_KEY, JSON.stringify(all));
}

export function removeAlarm(orderId: string) {
  const all = readAlarms();
  delete all[orderId];
  localStorage.setItem(ALARMS_KEY, JSON.stringify(all));
}

export function addNotification(n: FiredNotification) {
  const all = readNotifications().filter(x => x.orderId !== n.orderId);
  all.push(n);
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(all));
}

export function removeNotification(orderId: string) {
  const all = readNotifications().filter(x => x.orderId !== orderId);
  localStorage.setItem(NOTIFS_KEY, JSON.stringify(all));
}

export function clearAllForOrder(orderId: string) {
  removeAlarm(orderId);
  removeNotification(orderId);
}

export function getTriggeredAlarms(): StoredAlarm[] {
  const now = Date.now();
  return Object.values(readAlarms()).filter(
    a => now - a.setAt >= a.thresholdMinutes * 60 * 1000
  );
}
