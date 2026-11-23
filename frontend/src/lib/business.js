// Identitas usaha di footer dan bagian kontak, disalin apa adanya dari Figma Hi-fi (keputusan 22 Nov 2026).
export const BUSINESS = {
  tagline:
    'Cuci dan perawatan sepatu berbasis reservasi online, antar-jemput di Sidoarjo dan Surabaya.',
  taglineShort: 'Cuci dan perawatan sepatu, antar-jemput di Sidoarjo dan Surabaya.',
  address: 'Perumahan Jl. Pd. Jati No. 2 BM 55, Sidoarjo',
  hours: 'Setiap hari 09:00–18:00 WIB',
  whatsapp: '0851 2802 4120',
  whatsappUrl: 'https://wa.me/6285128024120',
  email: 'lavestreat@gmail.com',
  instagram: '@lave_streat',
  instagramUrl: 'https://www.instagram.com/lave_streat/',
};

/** Navigasi portal pembeli: Beranda dan halaman informasi PG-7 sampai PG-10 (AUDIT D-16). */
export const PUBLIC_NAV = [
  { label: 'Beranda', to: '/' },
  { label: 'Layanan', menuLabel: 'Layanan & tarif', to: '/layanan' },
  { label: 'Cara kerja', to: '/cara-kerja' },
  { label: 'Galeri', to: '/galeri' },
  { label: 'Kontak', to: '/kontak' },
];
