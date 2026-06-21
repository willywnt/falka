import { Calendar } from '@falka/web';

const selected = new Date(2026, 5, 15);

export function SingleDate() {
  return <Calendar mode="single" selected={selected} defaultMonth={selected} />;
}

export function RangeDates() {
  return (
    <Calendar
      mode="range"
      selected={{ from: new Date(2026, 5, 10), to: new Date(2026, 5, 18) }}
      defaultMonth={new Date(2026, 5, 1)}
    />
  );
}
