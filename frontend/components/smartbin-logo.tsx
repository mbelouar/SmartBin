"use client"

interface SmartBinLogoProps {
  size?: "sm" | "md" | "lg"
}

export function SmartBinLogo({ size = "sm" }: SmartBinLogoProps) {
  const sizes = {
    sm: { container: "w-12 h-12" },
    md: { container: "w-16 h-16" },
    lg: { container: "w-20 h-20" },
  }

  return (
    <div className={`${sizes[size].container} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle with gradient */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGradient)" />
        
        {/* Modern bin shape - simplified and elegant */}
        <path
          d="M30 35 L35 70 C35 72.5 37 75 40 75 L60 75 C63 75 65 72.5 65 70 L70 35 Z"
          fill="url(#binGradient)"
          stroke="url(#binStroke)"
          strokeWidth="1.5"
        />
        
        {/* Bin lid with rounded corners */}
        <rect x="28" y="30" width="44" height="8" rx="4" fill="url(#lidGradient)" />
        
        {/* Smart indicator - leaf symbol */}
        <path
          d="M50 45 Q48 40 45 42 Q48 44 50 50 Q52 44 55 42 Q52 40 50 45"
          fill="url(#leafGradient)"
          stroke="#ffffff"
          strokeWidth="0.5"
          opacity="0.9"
        />
        
        {/* Recycling arrows - modern style */}
        <g transform="translate(50, 58) scale(0.4)">
          <path
            d="M-15 -10 L0 -20 L15 -10 M-15 10 L0 20 L15 10 M-15 0 L0 -10 L15 0"
            stroke="#ffffff"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </g>
        
        {/* Tech accent lines */}
        <line x1="40" y1="50" x2="60" y2="50" stroke="url(#accentGradient)" strokeWidth="1" opacity="0.6" />
        
        <defs>
          {/* Background gradient */}
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
          
          {/* Bin gradient */}
          <linearGradient id="binGradient" x1="50" y1="35" x2="50" y2="75">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f0fdf4" stopOpacity="0.9" />
          </linearGradient>
          
          {/* Bin stroke */}
          <linearGradient id="binStroke" x1="30" y1="35" x2="70" y2="75">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          
          {/* Lid gradient */}
          <linearGradient id="lidGradient" x1="28" y1="34" x2="72" y2="34">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="50%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          
          {/* Leaf gradient */}
          <linearGradient id="leafGradient" x1="45" y1="40" x2="55" y2="50">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          
          {/* Accent gradient */}
          <linearGradient id="accentGradient" x1="40" y1="50" x2="60" y2="50">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
