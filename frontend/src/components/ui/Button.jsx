import React from "react";

export default function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  type = "button",
}) {
  const baseStyle =
    "font-medium font-heading px-6 py-3 transition-all duration-150 flex items-center justify-center gap-2 text-sm";

  const variants = {
    primary:
      "bg-primary hover:bg-primary-hover text-white disabled:bg-gray-300",
    secondary:
      "bg-secondary hover:bg-secondary-hover text-white disabled:bg-gray-50",
    outline:
      "border-2 border-primary hover:border-primary-hover bg-white text-primary",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}
