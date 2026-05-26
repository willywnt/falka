import type { Metadata } from 'next';
import Link from 'next/link';

import { LoginForm } from '@/modules/auth/components/login-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Olshop account</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="text-muted-foreground mt-6 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-foreground font-medium underline-offset-4 hover:underline">
            Create account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
