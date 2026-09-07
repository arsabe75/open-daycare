import type { Child } from "@/lib/data/children";

interface ChildDetailsProps {
  child: Child;
}

export default function ChildDetails({ child }: ChildDetailsProps) {
  const rows = [
    { label: "Fecha de nacimiento", value: child.birthDate },
    { label: "Sala", value: child.room },
    { label: "Ingreso", value: child.admission },
  ];

  return (
    <div className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-2xl overflow-hidden">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={`flex justify-between px-4.5 py-3.75 ${
            index < rows.length - 1 ? "border-b border-[#F0E6D8]" : ""
          }`}
        >
          <span className="text-[14.5px] text-[#94887B]">{row.label}</span>
          <span className="font-extrabold text-[14.5px] text-[#3F362E]">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
