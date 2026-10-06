import type { ReactNode } from "react";
import Link, { type LinkProps } from "next/link";

interface AuthSubmitProps {
  href?: LinkProps["href"];
  type?: "submit" | "button";
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function AuthSubmit({
  href,
  type = "button",
  children,
  className = "",
  disabled,
}: AuthSubmitProps) {
  const classes = [
    "block w-full text-center py-[15px] rounded-[15px]",
    "bg-linear-to-b from-[#F4977E] to-[#EE8164]",
    "text-white font-extrabold text-base",
    "shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]",
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled}>
      {children}
    </button>
  );
}
