import React from "react";

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-gray-300 bg-white px-4 py-3 text-[11px] text-gray-500 sm:px-6 sm:py-4 sm:text-xs lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-1 text-center sm:flex-row sm:justify-between sm:gap-2 sm:text-left">
        <span>SmartFM - Smart Fleet Management - ABC-Trans</span>
        <span>&copy; {new Date().getFullYear()} ABC-Trans</span>
      </div>
    </footer>
  );
}
