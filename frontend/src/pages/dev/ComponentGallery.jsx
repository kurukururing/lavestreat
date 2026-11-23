import { useState } from 'react';
import { BadgeCheck, Droplets, Package, Plus, Sparkles } from 'lucide-react';

import { Container, PageHeader } from '@/components/layout/PublicLayout';
import { BeforeAfterPair, BeforeAfterSlider } from '@/components/ui/before-after';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ItemRow } from '@/components/ui/item-row';
import { OrderStepper } from '@/components/ui/order-stepper';
import { SectionHeading } from '@/components/ui/section-heading';
import { ServiceAccordion, ServiceAccordionItem } from '@/components/ui/service-accordion';
import { StatusTimeline } from '@/components/ui/status-timeline';
import { StickyActionBar } from '@/components/ui/sticky-action-bar';
import { SummaryDivider, SummaryList, SummaryRow } from '@/components/ui/summary-list';
import beforeSrc from '@/assets/galeri/diadora-sebelum.jpg';
import afterSrc from '@/assets/galeri/diadora-sesudah.jpg';
import { formatRupiah } from '@/lib/format';

// Data contoh untuk melihat komponen; bukan data pesanan.
const ITEMS = [
  {
    code: 'EASY',
    name: 'Easy Clean',
    description: 'Pembersihan ringan upper dan midsole',
    price: 15000,
  },
  {
    code: 'MEDIUM',
    name: 'Medium Clean',
    description: 'Bagian luar: upper dan midsole',
    price: 20000,
  },
  {
    code: 'DEEP',
    name: 'Deep Clean',
    description: 'Menyeluruh, termasuk insole dan tali',
    price: 25000,
  },
];
const BEFORE = { src: beforeSrc, alt: 'Sepatu Diadora sebelum dicuci, upper kusam' };
const AFTER = { src: afterSrc, alt: 'Sepatu Diadora sesudah dicuci, upper bersih' };

function Block({ title, children }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="font-sans text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Galeri komponen portal pembeli (dev saja) untuk memeriksa tampilan di 360 dan 1280 px. */
export function ComponentGallery() {
  const [qty, setQty] = useState({ EASY: 1 });
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('done');
  const selected = ITEMS.filter((i) => qty[i.code] > 0);
  const subtotal = selected.reduce((sum, i) => sum + i.price * qty[i.code], 0);

  return (
    <Container className="flex flex-col gap-10 pt-12 pb-44 lg:pb-16">
      <PageHeader
        crumbs={[{ label: 'Beranda', to: '/' }, { label: 'Komponen' }]}
        title="Galeri komponen"
        description="Pratinjau komponen penyusun portal pembeli."
      />

      <Block title="SectionHeading">
        <SectionHeading eyebrow="Cara kerja" title="Tiga langkah, sepatu kembali bersih" />
      </Block>

      <Block title="OrderStepper">
        <Card className="px-4 py-5 md:px-8">
          <OrderStepper steps={['Layanan', 'Metode', 'Data', 'Ringkasan']} current={step} />
        </Card>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Mundur
          </Button>
          <Button variant="secondary" onClick={() => setStep((s) => Math.min(3, s + 1))}>
            Maju
          </Button>
        </div>
      </Block>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_384px]">
        <Block title="ServiceAccordion + ItemRow">
          <ServiceAccordion defaultValue="regular">
            <ServiceAccordionItem
              value="regular"
              icon={Droplets}
              title="Cuci reguler"
              description="Easy, Medium, Deep · mulai Rp15.000"
              selectedCount={selected.length}
            >
              {ITEMS.map((i) => (
                <ItemRow
                  key={i.code}
                  name={i.name}
                  description={i.description}
                  price={i.price}
                  icon={Droplets}
                  qty={qty[i.code] ?? 0}
                  onQtyChange={(n) => setQty((q) => ({ ...q, [i.code]: n }))}
                />
              ))}
            </ServiceAccordionItem>
            <ServiceAccordionItem
              value="material"
              icon={Sparkles}
              title="Bahan & warna"
              description="White, Leather, Suede · mulai Rp35.000"
            />
            <ServiceAccordionItem
              value="special"
              icon={BadgeCheck}
              title="Khusus"
              description="Boots, Kids, Express · mulai Rp30.000"
            />
            <ServiceAccordionItem
              value="addon"
              icon={Plus}
              title="Add-on (opsional)"
              description="Unyellowing, Fast Track · per pasang"
            />
            <ServiceAccordionItem
              value="product"
              icon={Package}
              title="Produk (opsional)"
              description="Shoe Cleaner, Shoe Refresher · per botol"
            />
          </ServiceAccordion>
        </Block>

        <Block title="SummaryList">
          <Card className="flex flex-col gap-3 p-6 shadow-sm md:p-6">
            <h3 className="text-h3 text-brand-900">Ringkasan pesanan</h3>
            <SummaryList>
              {selected.map((i) => (
                <SummaryRow
                  key={i.code}
                  label={`${i.name} × ${qty[i.code]}`}
                  value={formatRupiah(i.price * qty[i.code])}
                />
              ))}
              <SummaryDivider />
              <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} emphasis />
            </SummaryList>
          </Card>
        </Block>
      </div>

      <Block title="StatusTimeline">
        <div className="flex flex-wrap gap-2">
          {['pending_confirmation', 'received', 'processing', 'done', 'completed', 'cancelled'].map(
            (s) => (
              <Button
                key={s}
                size="sm"
                variant={s === status ? 'primary' : 'secondary'}
                onClick={() => setStatus(s)}
              >
                {s}
              </Button>
            ),
          )}
        </div>
        <Card className="max-w-160">
          <StatusTimeline
            status={status}
            times={{
              pending_confirmation: '2026-11-30T03:00:00Z',
              received: '2026-12-01T02:12:00Z',
              processing: '2026-12-01T07:05:00Z',
              done: '2026-12-03T09:30:00Z',
            }}
          />
        </Card>
      </Block>

      <Block title="BeforeAfterSlider">
        <BeforeAfterSlider before={BEFORE} after={AFTER} />
      </Block>

      <Block title="BeforeAfterPair">
        <BeforeAfterPair before={BEFORE} after={AFTER} />
        <BeforeAfterPair before={BEFORE} after={null} />
      </Block>

      <StickyActionBar>
        <SummaryList className="gap-2.5">
          <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
          <SummaryRow label="Estimasi total" value={formatRupiah(subtotal)} emphasis />
        </SummaryList>
        <div className="flex gap-2">
          <Button variant="secondary">Kembali</Button>
          <Button className="flex-1">Lanjutkan</Button>
        </div>
      </StickyActionBar>
    </Container>
  );
}
