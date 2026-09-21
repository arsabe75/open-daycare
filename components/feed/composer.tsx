"use client";

interface ComposerProps {
  onClick?: () => void;
}

export default function Composer({ onClick }: ComposerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] px-4.5 py-3.5 mb-6 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)] text-left focus:outline-none cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-[#F2937A] text-white font-display font-semibold text-base flex items-center justify-center flex-none">
        C
      </div>
      <span className="flex-1 text-[#A89A8B] text-[15px]">
        Compartí un momento…
      </span>
      <span className="w-9.5 h-9.5 rounded-xl bg-[#FBE3D8] text-[#E0654A] flex items-center justify-center">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </span>
    </button>
  );
}
