import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate, formatRupiah, formatSlot } from '@/lib/format';
import { cn } from '@/lib/utils';

// Nama di daftar disingkat "Budi C." seperti Figma AD-3, nama lengkap tetap ada di detail.
function shortName(name = '') {
  const [first, second] = name.trim().split(/\s+/);
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
}

const schedule = (order) =>
  `${formatDate(order.scheduled_date)} · ${formatSlot(order.scheduled_slot)}`;

/**
 * Daftar pesanan antrean (Figma OrderTableRow 7:324 dan OrderCard 7:325, AD-3).
 * ≥ md: tabel. < md: daftar kartu. Elemen `orders` mengikuti ADM-04.
 * `getHref(order)` membentuk tautan detail; `LinkComponent` diisi Link router (bawaan `<a>`).
 */
function OrderList({ orders, getHref, LinkComponent = 'a', className }) {
  const linkProps = (order) =>
    LinkComponent === 'a' ? { href: getHref(order) } : { to: getHref(order) };

  return (
    <div className={className}>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="h-10 bg-accent text-left text-xs font-medium tracking-[0.06em] text-brand-900 uppercase">
            <th scope="col" className="px-4 font-medium">
              ID
            </th>
            <th scope="col" className="px-4 font-medium">
              Nama
            </th>
            <th scope="col" className="px-4 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 font-medium">
              Jadwal
            </th>
            <th scope="col" className="px-4 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="h-14 border-b border-border transition-colors hover:bg-accent"
            >
              <td className="px-4">
                <LinkComponent
                  {...linkProps(order)}
                  className="rounded-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:focus-ring"
                >
                  {order.code}
                </LinkComponent>
              </td>
              <td className="px-4">
                <span className="flex items-center gap-3">
                  <Avatar name={order.customer_name} size="sm" className="rounded-sm" />
                  {shortName(order.customer_name)}
                </span>
              </td>
              <td className="px-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-4">{schedule(order)}</td>
              <td className="px-4 text-right">{formatRupiah(order.total_idr)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <LinkComponent
              {...linkProps(order)}
              className={cn(
                'flex flex-col gap-2 rounded-lg border border-border bg-card p-4 outline-none hover:bg-muted focus-visible:focus-ring',
              )}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium whitespace-nowrap text-accent-foreground">
                  {order.code}
                </span>
                <StatusBadge status={order.status} />
              </span>
              <span>{shortName(order.customer_name)}</span>
              <span className="flex items-center text-sm">
                <span className="flex-1 text-muted-foreground">{schedule(order)}</span>
                <span className="font-medium">{formatRupiah(order.total_idr)}</span>
              </span>
            </LinkComponent>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { OrderList };
