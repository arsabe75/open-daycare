export default function SearchBox() {
  return (
    <div className="flex items-center gap-2.75 bg-[#FFFDF9] border border-[#ECE0D0] rounded-[14px] px-4 py-3">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#B0A290"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="text"
        placeholder="Buscar niño…"
        readOnly
        className="flex-1 border-none bg-transparent text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />
    </div>
  );
}
