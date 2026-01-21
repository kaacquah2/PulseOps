import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatUptime(uptimePercentage: number): string {
  return `${uptimePercentage.toFixed(2)}%`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    online: "text-green-600 bg-green-100",
    offline: "text-red-600 bg-red-100",
    degraded: "text-yellow-600 bg-yellow-100",
    maintenance: "text-blue-600 bg-blue-100",
  };
  return colors[status] || "text-gray-600 bg-gray-100";
}

export function calculateResponseTime(times: number[]): number {
  if (times.length === 0) return 0;
  return times.reduce((a, b) => a + b, 0) / times.length;
}
