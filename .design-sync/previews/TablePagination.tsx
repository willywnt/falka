import { TablePagination } from '@falka/web';

export function MidRange() {
  return (
    <div style={{ width: 560 }}>
      <TablePagination
        page={2}
        pageSize={20}
        total={148}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    </div>
  );
}

export function FirstPage() {
  return (
    <div style={{ width: 560 }}>
      <TablePagination
        page={1}
        pageSize={50}
        total={312}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    </div>
  );
}
