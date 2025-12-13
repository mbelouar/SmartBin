"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"
import type { Bin } from "@/lib/types"

interface SimpleMapProps {
  bins: Bin[]
  selectedBinId: string | null
  onBinClick: (bin: Bin) => void
  userLocation?: { lat: number; lng: number }
}

export function SimpleMap({
  bins,
  selectedBinId,
  onBinClick,
  userLocation,
}: SimpleMapProps) {
  // Filter bins with coordinates
  const binsWithCoords = useMemo(
    () => bins.filter((bin) => bin.latitude && bin.longitude),
    [bins]
  )

  // Calculate center and bounds
  const { center, zoom } = useMemo(() => {
    if (userLocation) {
      return { center: userLocation, zoom: 13 }
    }
    if (binsWithCoords.length > 0) {
      const firstBin = binsWithCoords[0]
      return {
        center: { lat: firstBin.latitude!, lng: firstBin.longitude! },
        zoom: 13,
      }
    }
    return { center: { lat: 40.7128, lng: -74.006 }, zoom: 10 }
  }, [binsWithCoords, userLocation])

  // Create OpenStreetMap iframe URL with markers
  const mapUrl = useMemo(() => {
    const baseUrl = "https://www.openstreetmap.org/export/embed.html"
    const params = new URLSearchParams({
      bbox: `${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}`,
      layer: "mapnik",
      marker: `${center.lat},${center.lng}`,
    })
    return `${baseUrl}?${params.toString()}`
  }, [center])

  const getMarkerColor = (bin: Bin) => {
    if (bin.fill_level > 70) return "text-destructive"
    if (bin.fill_level > 50) return "text-accent"
    return "text-primary"
  }

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* OpenStreetMap iframe */}
      <iframe
        src={mapUrl}
        className="absolute inset-0 w-full h-full border-0"
        title="OpenStreetMap"
        loading="lazy"
      />

      {/* Overlay with bin information */}
      <div className="absolute top-4 left-4 right-4 z-10 max-h-[calc(100%-2rem)] overflow-y-auto space-y-2">
        {binsWithCoords.map((bin) => {
          const isSelected = selectedBinId === bin.id
          return (
            <motion.button
              key={bin.id}
              onClick={() => onBinClick(bin)}
              className={`w-full text-left p-3 rounded-lg glass border transition-all ${
                isSelected
                  ? "border-primary shadow-lg scale-105"
                  : "border-border/30 hover:border-primary/50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <MapPin className={`w-5 h-5 flex-shrink-0 ${getMarkerColor(bin)}`} fill="currentColor" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-1 truncate">{bin.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{bin.location}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium">Fill:</span>
                    <span className={`text-xs font-bold ${getMarkerColor(bin).replace("text-", "text-")}`}>
                      {bin.fill_level}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
