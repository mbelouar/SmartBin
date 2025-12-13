"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Bin } from "@/lib/types"
import { binApi } from "@/lib/api"
import { SimpleMap } from "@/components/simple-map"
import { Locate, Layers, Loader2 } from "lucide-react"

interface MapViewProps {
  onBinSelect: (bin: Bin) => void
}

export function MapView({ onBinSelect }: MapViewProps) {
  const [bins, setBins] = useState<Bin[]>([])
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)

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

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

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
            <Button
              onClick={handleGetLocation}
              className="gap-2 bg-gradient-eco hover:scale-105 transition-all duration-300 shadow-lg"
            >
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
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center z-50 bg-muted/50">
                <div className="glass px-6 py-4 rounded-2xl border border-primary/30 shadow-2xl">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Loading bins...</p>
                </div>
              </div>
            ) : (
              <SimpleMap
                bins={bins}
                selectedBinId={selectedBinId}
                onBinClick={handleBinClick}
                userLocation={userLocation}
              />
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
