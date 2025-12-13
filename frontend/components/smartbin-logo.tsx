"use client"

import { motion } from "framer-motion"

interface SmartBinLogoProps {
  size?: "sm" | "md" | "lg"
}

export function SmartBinLogo({ size = "sm" }: SmartBinLogoProps) {
  const sizes = {
    sm: { container: "w-12 h-12" },
    md: { container: "w-16 h-16" },
    lg: { container: "w-20 h-20" },
  }

  const Container = motion.div
  const Inner = motion.div

  return (
    <div className={`${sizes[size].container} relative flex items-center justify-center`}>
      {/* Main container */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 opacity-90" />

      {/* Inner bin shape */}
      <div className={`${sizes[size].container} relative z-10 rounded-lg bg-background/90 backdrop-blur-sm`}>
        {/* Smart Bin Icon */}
        <svg
          viewBox="0 0 80 80"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main bin body */}
          <path
            d="M20 28 L24 68 C24 71 26 73 29 73 L51 73 C54 73 56 71 56 68 L60 28 Z"
            fill="url(#binBody)"
            stroke="#eab308"
            strokeWidth="2"
          />

          {/* Bin lid */}
          <rect x="16" y="22" width="48" height="6" rx="3" fill="url(#lidGradient)" />

          {/* Smart display screen */}
          <rect x="30" y="36" width="20" height="14" rx="2" fill="#1e293b" stroke="#fbbf24" strokeWidth="1.5" />

          {/* Display content - checkmark */}
          <path
            d="M35 43 L38 46 L45 39"
            stroke="#eab308"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Tech pattern - circuit lines */}
          <path d="M28 55 L32 55 L32 60" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <circle cx="32" cy="60" r="1.5" fill="#fbbf24" opacity="0.8" />
          <path d="M52 55 L48 55 L48 60" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <circle cx="48" cy="60" r="1.5" fill="#fbbf24" opacity="0.8" />

          {/* Smart indicators */}
          <circle cx="36" cy="32" r="2" fill="#22c55e" />
          <circle cx="40" cy="32" r="2" fill="#eab308" />
          <circle cx="44" cy="32" r="2" fill="#3b82f6" />

          {/* Recycling symbol */}
          <g transform="translate(34, 16) scale(0.08)">
            <path
              d="M60 50 L80 20 L100 50 Z M40 100 L60 70 L80 100 Z M100 100 L120 70 L140 100 Z"
              stroke="#16a34a"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          <defs>
            <linearGradient id="binBody" x1="40" y1="28" x2="40" y2="73">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="lidGradient" x1="16" y1="25" x2="64" y2="25">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
