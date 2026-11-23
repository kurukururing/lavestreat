import { PageHeader } from '@/components/layout/AdminLayout';
import { Card, CardTitle } from '@/components/ui/card';

// AD-8 Bantuan (opsional, tanpa frame Figma). Isi diambil dari aturan PRD agar tidak mengarang.
const SECTIONS = [
  {
    title: 'Alur status pesanan',
    points: [
      'Pesanan dari pembeli masuk sebagai Menunggu konfirmasi. Periksa item, jadwal, dan alamat, lalu tekan Konfirmasi pesanan.',
      'Urutan status: Diterima → Diproses → Selesai → Diambil/Diantar.',
      'Koreksi mundur hanya satu langkah dan wajib diberi catatan. Tidak bisa kembali ke Menunggu konfirmasi.',
      'Pembatalan wajib disertai alasan 5–200 karakter dan tidak dapat dibatalkan ulang.',
    ],
  },
  {
    title: 'Estimasi pengerjaan',
    points: [
      'Estimasi AI dihitung otomatis sekali bila belum ada. Gunakan Hitung ulang untuk menghitung lagi.',
      'Nilai estimasi bisa diubah manual (1–14 hari) sebelum pesanan diproses.',
      'Bila layanan AI tidak tersedia, saran baseline ditampilkan dan hanya dipakai bila Anda memilihnya.',
    ],
  },
  {
    title: 'Foto dan nota',
    points: [
      'Unggah foto sebelum dan sesudah cuci, maksimal 5 per jenis. Data lokasi pada foto dihapus otomatis.',
      'Nota PDF memuat foto sebelum dan sesudah. Bila belum lengkap, Anda akan diminta konfirmasi sebelum mengunduh.',
      'Foto tidak dapat diubah setelah pesanan Diambil/Diantar.',
    ],
  },
  {
    title: 'Fitur AI',
    points: [
      'Draf pesan perawatan dan isi otomatis dari chat tidak pernah dikirim otomatis. Periksa lalu salin secara manual.',
      'Hanya tempel teks contoh (dummy) karena teks dikirim ke layanan AI pihak ketiga.',
    ],
  },
];

export function HelpPage() {
  return (
    <>
      <PageHeader title="Bantuan" subtitle="Panduan singkat panel pemilik" />
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <Card key={s.title} className="flex flex-col gap-3">
            <CardTitle>{s.title}</CardTitle>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
