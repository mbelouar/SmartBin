"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Bin } from "@/lib/types"
import { binApi } from "@/lib/api"
import { MapPin, Navigation, Locate, Layers, Loader2 } from "lucide-react"

interface MapViewProps {
  onBinSelect: (bin: Bin) => void
}

export function MapView({ onBinSelect }: MapViewProps) {
  const [bins, setBins] = useState<Bin[]>([])
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBins() {
      try {
        setLoading(true)
        const response = await binApi.list()
        setBins(response.results || response as any)
      } catch (err) {
        console.error("Failed to load bins:", err)
      } finally {
        setLoading(false)
      }
    }
    loadBins()
  }, [])

  const handleBinClick = (bin: Bin) => {
    setSelectedBinId(bin.id)
    onBinSelect(bin)
  }

  const availableBins = bins.filter((bin) => bin.status === "active" && bin.fill_level < 80)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-balance bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Eco Map View
            </h2>
            <p className="text-muted-foreground text-lg font-medium">Interactive bin locations near you</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 glass border-primary/30 hover:bg-primary/10 hover-lift">
              <Layers className="w-4 h-4" />
              <span className="font-medium">Layers</span>
            </Button>
            <Button className="gap-2 bg-gradient-eco hover:scale-105 transition-all duration-300 shadow-lg">
              <Locate className="w-4 h-4" />
              <span className="font-medium">My Location</span>
            </Button>
          </div>
        </div>

        {/* Decorative Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-1 bg-gradient-eco rounded-full origin-left shadow-lg"
        />
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex gap-4 flex-wrap"
      >
        <Badge className="gap-2 px-4 py-2 glass border-primary/30 text-sm text-primary font-semibold hover-lift">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {bins.length} Total Bins
        </Badge>
        <Badge className="gap-2 px-4 py-2 glass border-secondary/30 text-sm text-secondary font-semibold hover-lift">
          <div className="w-2 h-2 rounded-full bg-secondary" />
          {availableBins.length} Available
        </Badge>
      </motion.div>

      {/* Map Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="overflow-hidden border-border/50 shadow-2xl shadow-primary/10 glass">
          <div className="relative bg-card h-[600px] rounded-lg overflow-hidden">
            {/* Animated Map Background - Green Theme */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(132,204,22,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Animated Grid Lines - Green */}
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.1)_2px,transparent_2px),linear-gradient(to_bottom,rgba(34,197,94,0.1)_2px,transparent_2px)] bg-[size:80px_80px]"
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
                  className="w-5 h-5 rounded-full bg-primary shadow-lg"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(34, 197, 94, 0.5)",
                      "0 0 40px rgba(34, 197, 94, 0.9)",
                      "0 0 20px rgba(34, 197, 94, 0.5)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 w-5 h-5 rounded-full bg-primary/30"
                  animate={{
                    scale: [1, 2.5, 1],
                    opacity: [0.6, 0, 0.6],
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
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-primary whitespace-nowrap font-bold glass px-3 py-1 rounded-full border border-primary/30 shadow-lg"
              >
                <Navigation className="w-3 h-3 inline mr-1" />
                You are here
              </motion.div>
            </motion.div>

            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="glass px-6 py-4 rounded-2xl border border-primary/30 shadow-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Loading eco map...</p>
                </div>
              </div>
            )}

            {/* Bin Markers */}
            <AnimatePresence>
              {!loading && bins.map((bin, index) => {
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
                        className={`w-10 h-10 transition-all duration-300 drop-shadow-2xl ${
                          selectedBinId === bin.id
                            ? "text-primary scale-125 animate-bounce-soft"
                            : bin.fill_level > 70
                              ? "text-destructive/80 group-hover:text-destructive"
                              : "text-primary/80 group-hover:text-primary"
                        }`}
                        fill="currentColor"
                      />

                      {/* Pulse ring for selected bin */}
                      {selectedBinId === bin.id && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary shadow-lg"
                          animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.6, 0, 0.6],
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
                        <div className="glass border border-primary/30 rounded-xl px-4 py-3 text-sm font-medium shadow-2xl min-w-[180px]">
                          <div className="font-bold text-foreground mb-1">{bin.name}</div>
                          <div className="text-muted-foreground text-xs space-y-1 font-medium">
                            <div className="flex items-center justify-between">
                              <span>Location:</span>
                              <span className="text-primary font-bold truncate max-w-[100px]">{bin.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Fill Level:</span>
                              <span
                                className={
                                  bin.fill_level > 70
                                    ? "text-destructive font-bold"
                                    : bin.fill_level > 50
                                      ? "text-accent font-bold"
                                      : "text-primary font-bold"
                                }
                              >
                                {bin.fill_level}%
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
