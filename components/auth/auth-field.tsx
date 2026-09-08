interface AuthFieldProps {
  label: string;
  name?: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export default function AuthField({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  className = "",
  inputClassName = "",
}: AuthFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-[12px] font-bold tracking-[0.7px] text-[#94887B] mb-2 uppercase"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={[
          "w-full px-4 py-3.5 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white",
          "text-[15px] text-[#3F362E]",
          inputClassName,
        ].join(" ")}
      />
    </div>
  );
}
