export type MonitorStatus = "online" | "offline" | "degraded" | "maintenance";

export type MonitorType = "http" | "https" | "ping" | "tcp" | "dns";

export interface Monitor {
  id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  interval: number; // in minutes
  timeout: number; // in seconds
  expectedStatusCode?: number;
  uptime: number;
  averageResponseTime: number;
  lastChecked?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitor?: Monitor;
  title: string;
  description: string;
  status: "open" | "investigating" | "resolved";
  severity: "low" | "medium" | "high" | "critical";
  startedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  monitorId: string;
  type: "email" | "slack" | "webhook" | "sms";
  destination: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricData {
  timestamp: Date;
  responseTime: number;
  statusCode?: number;
  success: boolean;
}

export interface DashboardStats {
  totalMonitors: number;
  onlineMonitors: number;
  offlineMonitors: number;
  degradedMonitors: number;
  averageUptime: number;
  openIncidents: number;
  totalIncidents: number;
}
