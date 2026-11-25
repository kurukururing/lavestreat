import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { CircleCheck, Lock, User } from 'lucide-react';

import { errorCode, errorMessage } from '@/api/client';
import heroUrl from '@/assets/login-hero.webp';
import { PageLoader } from '@/app/PageLoader';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/features/auth/auth-context';

const POINTS = [
  'Antrean dan status pesanan dari pembeli',
  'Foto before-after dan nota PDF otomatis',
  'Estimasi waktu AI dan dasbor bisnis',
];

/** AD-1 Login pemilik (Figma 34:3118, AC-02.1). */
export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Masuk · LAVE STREAT';
  }, []);

  if (status === 'loading') return <PageLoader variant="blank" fullscreen />;
  if (status === 'authed' && !submitting) return <Navigate to="/admin" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Isi username dan kata sandi.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login({ username: form.username.trim(), password: form.password });
      const from = location.state?.from;
      navigate(typeof from === 'string' && from.startsWith('/admin') ? from : '/admin', {
        replace: true,
      });
    } catch (err) {
      // Pesan login dari server sengaja umum (tidak membedakan username atau kata sandi).
      setError(
        errorCode(err) === 'UNAUTHORIZED'
          ? 'Username atau kata sandi salah.'
          : errorMessage(err, 'Gagal masuk. Coba lagi.'),
      );
      setForm((f) => ({ ...f, password: '' }));
      setSubmitting(false);
    }
  }

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="relative hidden w-140 shrink-0 overflow-hidden bg-brand-900 text-sidebar-foreground lg:flex">
        <img
          src={heroUrl}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-28"
          aria-hidden="true"
        />
        <div className="relative flex flex-1 flex-col justify-between p-12">
          <Logo tone="dark" />
          <div className="flex flex-col gap-6">
            <p className="font-heading text-[28px] leading-9 font-semibold">
              Satu tempat untuk pesanan, foto, nota, dan ringkasan bisnis.
            </p>
            <ul className="flex flex-col gap-3">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3 text-base">
                  <CircleCheck className="size-5 shrink-0 text-brand-200" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-sidebar-muted-foreground">Prototype Asah 2026 · data dummy</p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-100 flex-col gap-6">
          <Logo className="lg:hidden" />
          <div>
            <h1 className="text-h1 lg:text-h1-lg">Masuk ke panel pemilik</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gunakan akun pemilik LAVE STREAT.</p>
          </div>
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {error && <Alert type="danger">{error}</Alert>}
            <Field label="Username">
              <Input
                icon={User}
                name="username"
                autoComplete="username"
                maxLength={50}
                value={form.username}
                onChange={update('username')}
                autoFocus
              />
            </Field>
            <Field label="Kata sandi">
              <Input
                icon={Lock}
                type="password"
                name="password"
                autoComplete="current-password"
                maxLength={200}
                value={form.password}
                onChange={update('password')}
              />
            </Field>
            <Button type="submit" className="w-full" loading={submitting} loadingText="Masuk…">
              Masuk
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Lupa kata sandi? Hubungi tim untuk reset akun.
          </p>
        </div>
      </main>
    </div>
  );
}
