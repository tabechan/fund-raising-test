"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
    { name: "Document Upload", href: "/upload" },
    { name: "Document Checker", href: "/checker" },
    { name: "Review Simulator", href: "/simulator" },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-line bg-surface px-6 pt-4">
            <div className="flex gap-8">
                {TABS.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={clsx(
                                "pb-3 text-xs font-bold transition-colors relative",
                                isActive ? "text-ink" : "text-muted hover:text-ink"
                            )}
                        >
                            {tab.name}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-ink" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export function BlueprintBackground() {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-[0.03]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern
                        id="grid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
        </div>
    );
}
