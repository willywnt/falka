'use client';

import { type FormEvent, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/formatters';
import {
  useAccountSecurityQuery,
  useChangePasswordMutation,
} from '@/modules/auth/hooks/use-account-security';

const MIN_PASSWORD = 8;

/** "Keamanan" section in Settings → Umum: last-login info + self-service password change. */
export function SecuritySection() {
  const security = useAccountSecurityQuery();
  const changePassword = useChangePasswordMutation();
  const [editing, setEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const busy = changePassword.isPending;

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  }

  function closeForm() {
    setEditing(false);
    resetForm();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < MIN_PASSWORD) {
      setError(`Password baru minimal ${MIN_PASSWORD} karakter.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success('Password berhasil diganti');
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengganti password.');
    }
  }

  return (
    <section className="space-y-3">
      <p className="eyebrow text-muted-foreground">Keamanan</p>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Login terakhir</span>
        {security.isLoading ? (
          <Skeleton className="h-4 w-44" />
        ) : security.data?.lastLoginAt ? (
          <span className="text-right font-medium" suppressHydrationWarning>
            {formatDateTime(security.data.lastLoginAt)}
            {security.data.lastLoginIp ? (
              <span className="text-muted-foreground ml-1 font-normal">
                · {security.data.lastLoginIp}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-muted-foreground text-right">Belum ada catatan</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Password</span>
        {editing ? null : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <KeyRound className="size-4" />
            Ganti password
          </Button>
        )}
      </div>

      {editing ? (
        <form
          className="space-y-3 rounded-xl border p-4"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Password lama</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Password baru</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Konfirmasi password baru</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={busy}
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={busy || !currentPassword || !newPassword || !confirmPassword}
            >
              {busy ? 'Menyimpan…' : 'Simpan password'}
            </Button>
            <Button type="button" variant="ghost" onClick={closeForm} disabled={busy}>
              Batal
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
