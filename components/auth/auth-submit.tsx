import type { ReactNode } from "react";
import Link from "next/link";

interface AuthSubmitProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function AuthSubmit({
  href,
  children,
  className = "",
}: AuthSubmitProps) {
  return (
    <Link
      href={href}
      className={[
        "block w-full text-center py-[15px] rounded-[15px]",
        "bg-linear-to-b from-[#F4977E] to-[#EE8164]",
        "text-white font-extrabold text-base",
        "shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
