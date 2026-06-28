import { useState } from 'react';
import { DateRangePicker } from '@palka/web';

export function Selected() {
  const [range, setRange] = useState({
    from: new Date(2026, 5, 1),
    to: new Date(2026, 5, 30),
  });
  return <DateRangePicker value={range} onChange={(next) => setRange(next ?? range)} />;
}

export function Empty() {
  const [range, setRange] = useState(undefined);
  return (
    <DateRangePicker
      value={range}
      onChange={setRange}
      placeholder="Pilih rentang tanggal"
    />
  );
}
