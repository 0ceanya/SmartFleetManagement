import React from "react";

const MAX_WIDTH_CLASSES = {
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export default function DriverPageShell({ maxWidth = "4xl", className = "", children }) {
  const maxWidthClass = MAX_WIDTH_CLASSES[maxWidth] || MAX_WIDTH_CLASSES["4xl"];
  return (
    <main className={`${maxWidthClass} mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 space-y-6 ${className}`}>
      {children}
    </main>
  );
}
