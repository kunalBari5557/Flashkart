import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num || 0);
}

export function getTimeRemainingSeconds(expiresAtISO: string): number {
  const diffMs = new Date(expiresAtISO).getTime() - new Date().getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

export function formatCountdown(totalSeconds: number): { text: string; isUrgent: boolean; progressPct: number } {
  if (totalSeconds <= 0) {
    return { text: "Expired", isUrgent: true, progressPct: 0 };
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');

  // 300 seconds is max 5-min TTL
  const progressPct = Math.min(100, Math.max(0, (totalSeconds / 300) * 100));

  return {
    text: `${formattedMins}:${formattedSecs}`,
    isUrgent: totalSeconds < 60,
    progressPct,
  };
}
