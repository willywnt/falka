import { StockFlowChart } from '@palka/web';

export function DailyFlow() {
  return (
    <div style={{ width: 560, height: 300 }}>
      <StockFlowChart
        data={[
          { date: '2026-06-15', in: 0, out: 42 },
          { date: '2026-06-16', in: 120, out: 38 },
          { date: '2026-06-17', in: 0, out: 51 },
          { date: '2026-06-18', in: 80, out: 47 },
          { date: '2026-06-19', in: 0, out: 33 },
          { date: '2026-06-20', in: 200, out: 64 },
          { date: '2026-06-21', in: 0, out: 58 },
        ]}
      />
    </div>
  );
}
