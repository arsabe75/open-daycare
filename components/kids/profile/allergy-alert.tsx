interface AllergyAlertProps {
  notes: string;
}

export default function AllergyAlert({ notes }: AllergyAlertProps) {
  return (
    <div className="flex gap-4 bg-[#FBDAD6] rounded-2xl p-4">
      <div className="w-10 h-10 rounded-[11px] bg-[#F4A8A0] flex items-center justify-center flex-none">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </div>
      <div>
        <div className="font-extrabold text-[15px] text-[#C5413A] mb-0.5">
          Alergias y notas
        </div>
        <div className="text-[14.5px] text-[#B25249] leading-relaxed">
          {notes}
        </div>
      </div>
    </div>
  );
}
