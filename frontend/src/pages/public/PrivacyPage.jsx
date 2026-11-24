import { ClipboardList, ClipboardCheck, Sparkles, Trash2 } from 'lucide-react';

import { Container, PageHeader } from '@/components/layout/PublicLayout';
import { Alert } from '@/components/ui/alert';

// SEC-13, SEC-14: data yang dikumpulkan, tujuan, pihak ketiga, dan status prototype.
const SECTIONS = [
  {
    icon: ClipboardList,
    title: 'Data yang dikumpulkan',
    text: 'Nama, nomor WhatsApp, email (opsional), alamat (bila dijemput), catatan, dan foto sepatu.',
  },
  {
    icon: ClipboardCheck,
    title: 'Tujuan',
    text: 'Memproses pesanan cuci sepatu dan menampilkan status kepada Anda.',
  },
  {
    icon: Sparkles,
    title: 'Pihak ketiga',
    text: 'Bila fitur AI aktif, teks contoh dikirim ke Google Gemini. Bila peta aktif, peramban Anda menghubungi OpenStreetMap.',
  },
  {
    icon: Trash2,
    title: 'Penghapusan',
    text: 'Seluruh data contoh dihapus berkala oleh tim.',
  },
];

/** PG-6 Privasi (`/privasi`, Figma 91:5275 web, 81:3715 ponsel). */
export function PrivacyPage() {
  return (
    <Container className="flex flex-col gap-6 pt-6 pb-16 lg:gap-8 lg:pt-12 lg:pb-24">
      <PageHeader
        className="hidden lg:flex"
        crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Privasi' }]}
        title="Kebijakan privasi"
        description="Cara LAVE STREAT memakai data yang Anda isi saat memesan."
      />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_400px] lg:gap-6">
        <aside className="flex flex-col gap-4 lg:order-last">
          <div>
            <h2 className="font-heading text-h1 text-brand-900 lg:text-h2">Catatan privasi</h2>
            <p className="text-sm text-muted-foreground">Diperbarui 20 Nov 2026</p>
          </div>
          <Alert type="warning" title="Ini prototype">
            Aplikasi ini adalah prototype tugas Asah 2026 yang memakai data contoh. Jangan
            memasukkan data pribadi asli.
          </Alert>
          <div className="hidden flex-col gap-1 rounded-lg bg-accent p-4 text-sm lg:flex">
            <p className="font-medium text-brand-900">Ingin data Anda dihapus?</p>
            <p className="text-muted-foreground">
              Hubungi LAVE STREAT lewat WhatsApp dan sebutkan ID pesanan Anda.
            </p>
          </div>
        </aside>
        <div className="flex flex-col gap-4">
          {SECTIONS.map(({ icon: Icon, title, text }) => (
            <section
              key={title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:p-5"
            >
              <h2 className="flex items-center gap-3 font-heading text-h3 text-brand-900">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">{text}</p>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
