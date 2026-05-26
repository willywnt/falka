import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold">Olshop</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Record. Upload. Sync.</h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Browser-based operational recording with Cloudflare R2 storage and marketplace
            integrations for Shopee and Tokopedia.
          </p>
          <Button className="mt-8" size="lg" asChild>
            <Link href="/dashboard">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Webcam Recording</CardTitle>
              <CardDescription>Capture operational workflows in the browser.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Record, process, and upload video with lifecycle management built in.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Marketplace Sync</CardTitle>
              <CardDescription>Connect Shopee and Tokopedia stores.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Keep inventory synchronized across marketplaces from a single dashboard.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Audit & Compliance</CardTitle>
              <CardDescription>Full activity logging for your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Track every action with organization-scoped audit logs and RBAC-ready architecture.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
