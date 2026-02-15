"use client";

import { UserButton } from "./user-button";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-[#F3F4F6] flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-[#212861]">
          {title || "Dashboard"}
        </h1>
      </div>

      <UserButton />
    </header>
  );
}
