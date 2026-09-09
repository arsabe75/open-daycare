"use client";

interface MaskedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

function formatDateDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function MaskedDateInput({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  hasError = false,
}: MaskedDateInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatDateDigits(event.target.value));
  };

  const borderColor = hasError ? "#D9583C" : "#EADFD0";

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className="w-full px-4 py-[13px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      style={{ borderColor }}
    />
  );
}
