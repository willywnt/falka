import * as React from 'react';

import { Input } from '@/components/ui/input';

type NumberInputProps = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (value: number) => void;
};

/**
 * Numeric `<Input>` for react-hook-form fields. Shows an empty box for 0 (with a
 * "0" placeholder) so there are no awkward leading zeros, and reports a clean
 * number back. Spread an RHF `field` onto it: `<NumberInput {...field} />`.
 */
function NumberInput({ value, onChange, placeholder = '0', ...props }: NumberInputProps) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value === 0 ? '' : String(value)}
      onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
      {...props}
    />
  );
}

export { NumberInput };
