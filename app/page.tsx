import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Activity, BarChart3, Shield, Zap } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">PulseOps</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
              Monitor Your Infrastructure
              <br />
              <span className="text-blue-600">In Real-Time</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              PulseOps provides comprehensive monitoring for your websites, APIs, and services.
              Get instant alerts when things go wrong and keep your systems running smoothly.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg">Start Monitoring Free</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Uptime Monitoring</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Monitor HTTP, HTTPS, TCP, DNS endpoints 24/7
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Performance Metrics</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Track response times and performance trends
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Instant Alerts</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Get notified via email, Slack, or webhooks
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Incident Management</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Track and resolve incidents efficiently
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            © 2026 PulseOps. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
