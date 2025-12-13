"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Bin } from "@/lib/types"
import { generateMockBins } from "@/lib/mock-data"
import { MapPin, Navigation, Locate, Layers } from "lucide-react"

interface MapViewProps {
  onBinSelect: (bin: Bin) => void
}

export function MapView({ onBinSelect }: MapViewProps) {
  const [bins, setBins] = useState<Bin[]>([])
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null)

  useEffect(() => {
    setBins(generateMockBins())
  }, [])

  const handleBinClick = (bin: Bin) => {
    setSelectedBinId(bin.id)
    onBinSelect(bin)
  }

  const availableBins = bins.filter((bin) => bin.status === "online" && bin.capacity < 80)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-balance bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Map View
            </h2>
            <p className="text-muted-foreground text-lg">Interactive bin locations</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 bg-transparent border-yellow-400/30 hover:bg-yellow-400/10">
              <Layers className="w-4 h-4" />
              Layers
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-400/90 hover:to-yellow-400/90 text-black">
              <Locate className="w-4 h-4" />
              My Location
            </Button>
          </div>
        </div>

        {/* Decorative Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-full origin-left"
        />
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex gap-4 flex-wrap"
      >
        <Badge className="gap-2 px-4 py-2 bg-yellow-400/20 border-yellow-400/30 text-sm text-yellow-400">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          {bins.length} Total Bins
        </Badge>
        <Badge className="gap-2 px-4 py-2 bg-amber-400/20 border-amber-400/30 text-sm text-amber-400">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          {availableBins.length} Available
        </Badge>
      </motion.div>

      {/* Map Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="overflow-hidden border-border/50 shadow-2xl shadow-yellow-400/5 bg-gradient-to-br from-card via-card to-card/80">
          <div className="relative bg-card h-[600px] rounded-lg overflow-hidden">
            {/* Animated Map Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Animated Grid Lines */}
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(234,179,8,0.1)_2px,transparent_2px),linear-gradient(to_bottom,rgba(234,179,8,0.1)_2px,transparent_2px)] bg-[size:80px_80px]"
              animate={{
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />

            {/* Center Point (User Location) */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              <div className="relative">
                <motion.div
                  className="w-5 h-5 rounded-full bg-amber-400"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(251, 191, 36, 0.5)",
                      "0 0 40px rgba(251, 191, 36, 0.8)",
                      "0 0 20px rgba(251, 191, 36, 0.5)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 w-5 h-5 rounded-full bg-amber-400/30"
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-amber-400 whitespace-nowrap font-semibold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30"
              >
                <Navigation className="w-3 h-3 inline mr-1" />
                You are here
              </motion.div>
            </motion.div>

            {/* Bin Markers */}
            <AnimatePresence>
              {bins.map((bin, index) => {
                const angle = index * (360 / bins.length) * (Math.PI / 180)
                const radius = 150 + Math.random() * 100
                const x = 50 + (radius / 500) * 50 * Math.cos(angle)
                const y = 50 + (radius / 500) * 50 * Math.sin(angle)

                return (
                  <motion.button
                    key={bin.id}
                    onClick={() => handleBinClick(bin)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.5 + index * 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                    whileHover={{ scale: 1.2, zIndex: 30 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="relative">
                      <MapPin
                        className={`w-10 h-10 transition-all duration-300 drop-shadow-lg ${
                          selectedBinId === bin.id
                            ? "text-amber-400 scale-125"
                            : bin.capacity > 70
                              ? "text-destructive/80 group-hover:text-destructive"
                              : "text-yellow-400/80 group-hover:text-yellow-400"
                        }`}
                        fill="currentColor"
                      />

                      {/* Pulse ring for selected bin */}
                      {selectedBinId === bin.id && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-amber-400"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        />
                      )}

                      {/* Hover Tooltip */}
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="absolute -top-20 left-1/2 -translate-x-1/2 pointer-events-none"
                      >
                        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 text-sm font-medium shadow-2xl min-w-[180px]">
                          <div className="font-bold text-foreground mb-1">{bin.name}</div>
                          <div className="text-muted-foreground text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Distance:</span>
                              <span className="text-yellow-400">{bin.distance}m</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Capacity:</span>
                              <span
                                className={
                                  bin.capacity > 70
                                    ? "text-destructive"
                                    : bin.capacity > 50
                                      ? "text-amber-400"
                                      : "text-yellow-400"
                                }
                              >
                                {bin.capacity}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
