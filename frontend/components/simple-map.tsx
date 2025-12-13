"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Trash2, AlertCircle, CheckCircle2, XCircle, Navigation } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Bin } from "@/lib/types"

interface SimpleMapProps {
  bins: Bin[]
  selectedBinId: string | null
  onBinClick: (bin: Bin) => void
  userLocation?: { lat: number; lng: number }
}

// Convert lat/lng to pixel coordinates on the map (Mercator projection approximation)
function latLngToPixel(lat: number, lng: number, center: { lat: number; lng: number }, mapSize: { width: number; height: number }, zoom: number = 13) {
  // Simplified Mercator projection
  const scale = Math.pow(2, zoom - 1)
  const latRad = lat * Math.PI / 180
  const centerLatRad = center.lat * Math.PI / 180
  
  // Calculate pixel coordinates
  const x = (lng - center.lng) * 111320 * Math.cos(centerLatRad) * scale
  const y = (lat - center.lat) * 111320 * scale
  
  // Convert to pixel position (assuming 256px tiles)
  const pixelX = (mapSize.width / 2) + (x / 256)
  const pixelY = (mapSize.height / 2) - (y / 256)
  
  return { x: pixelX, y: pixelY }
}

export function SimpleMap({
  bins,
  selectedBinId,
  onBinClick,
  userLocation,
}: SimpleMapProps) {
  const [hoveredBinId, setHoveredBinId] = useState<string | null>(null)
  const mapSize = { width: 800, height: 600 } // Approximate map size

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
      const avgLat = binsWithCoords.reduce((sum, bin) => sum + (bin.latitude || 0), 0) / binsWithCoords.length
      const avgLng = binsWithCoords.reduce((sum, bin) => sum + (bin.longitude || 0), 0) / binsWithCoords.length
      return {
        center: { lat: avgLat, lng: avgLng },
        zoom: 12,
      }
    }
    return { center: { lat: 40.7128, lng: -74.006 }, zoom: 10 }
  }, [binsWithCoords, userLocation])

  // Create OpenStreetMap iframe URL
  const mapUrl = useMemo(() => {
    const baseUrl = "https://www.openstreetmap.org/export/embed.html"
    const bbox = `${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}`
    return `${baseUrl}?bbox=${bbox}&layer=mapnik`
  }, [center])

  const getBinColor = (bin: Bin): "destructive" | "accent" | "secondary" | "primary" => {
    if (bin.status === "full" || bin.fill_level >= 90) return "destructive"
    if (bin.fill_level >= 70) return "accent"
    if (bin.fill_level >= 50) return "secondary"
    return "primary"
  }

  const getBinColorClass = (bin: Bin) => {
    const color = getBinColor(bin)
    const colorMap = {
      destructive: "bg-destructive text-destructive-foreground border-destructive",
      accent: "bg-accent text-accent-foreground border-accent",
      secondary: "bg-secondary text-secondary-foreground border-secondary",
      primary: "bg-primary text-primary-foreground border-primary",
    }
    return colorMap[color]
  }

  const getBinBorderClass = (bin: Bin) => {
    const color = getBinColor(bin)
    const colorMap = {
      destructive: "border-destructive",
      accent: "border-accent",
      secondary: "border-secondary",
      primary: "border-primary",
    }
    return colorMap[color]
  }

  const getBinBgClass = (bin: Bin) => {
    const color = getBinColor(bin)
    const colorMap = {
      destructive: "bg-destructive",
      accent: "bg-accent",
      secondary: "bg-secondary",
      primary: "bg-primary",
    }
    return colorMap[color]
  }

  const getBinGradientClass = (bin: Bin) => {
    const color = getBinColor(bin)
    const colorMap = {
      destructive: "from-destructive to-destructive/80",
      accent: "from-accent to-accent/80",
      secondary: "from-secondary to-secondary/80",
      primary: "from-primary to-primary/80",
    }
    return colorMap[color]
  }

  const getBinIcon = (bin: Bin) => {
    if (bin.status === "full" || bin.fill_level >= 90) return XCircle
    if (bin.status === "maintenance") return AlertCircle
    if (bin.status === "inactive") return XCircle
    return Trash2
  }

  const getStatusBadge = (bin: Bin) => {
    if (bin.status === "full" || bin.fill_level >= 90) return { label: "Full", variant: "destructive" as const }
    if (bin.status === "maintenance") return { label: "Maintenance", variant: "secondary" as const }
    if (bin.status === "inactive") return { label: "Inactive", variant: "secondary" as const }
    if (bin.fill_level < 50) return { label: "Available", variant: "default" as const }
    return { label: "Filling", variant: "secondary" as const }
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

      {/* Custom Bin Markers Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {binsWithCoords.map((bin) => {
          const pixelPos = latLngToPixel(bin.latitude!, bin.longitude!, center, mapSize, zoom)
          const isSelected = selectedBinId === bin.id
          const isHovered = hoveredBinId === bin.id
          const BinIcon = getBinIcon(bin)
          const color = getBinColor(bin)
          const statusBadge = getStatusBadge(bin)
          const gradientClass = getBinGradientClass(bin)
          const borderClass = getBinBorderClass(bin)

          return (
            <motion.div
              key={bin.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${(pixelPos.x / mapSize.width) * 100}%`,
                top: `${(pixelPos.y / mapSize.height) * 100}%`,
                transform: "translate(-50%, -100%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isSelected ? 1.3 : isHovered ? 1.15 : 1,
                opacity: 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onMouseEnter={() => setHoveredBinId(bin.id)}
              onMouseLeave={() => setHoveredBinId(null)}
              onClick={() => onBinClick(bin)}
            >
              {/* Marker Pin */}
              <div className="relative">
                <motion.div
                  className={`relative z-10 cursor-pointer transition-all duration-300 ${
                    isSelected ? "drop-shadow-2xl" : "drop-shadow-lg"
                  }`}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Pulsing ring effect for selected/hovered */}
                  {(isSelected || isHovered) && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${getBinBgClass(bin)} opacity-30`}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "60px", height: "60px", margin: "-20px" }}
                    />
                  )}

                  {/* Main marker */}
                  <div
                    className={`relative bg-gradient-to-br ${gradientClass} rounded-full p-2.5 border-2 border-background shadow-xl ${
                      isSelected ? "ring-4 ring-primary/50" : ""
                    }`}
                  >
                    <BinIcon className="w-5 h-5 text-background" />
                  </div>

                  {/* Pin tail */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent ${borderClass} drop-shadow-md`}
                  />
                </motion.div>

                {/* Info Card (appears on hover/select) */}
                <AnimatePresence>
                  {(isSelected || isHovered) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 z-20"
                    >
                      <Card className="glass border-primary/30 shadow-2xl p-3">
                        <div className="space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm mb-1 truncate">{bin.name}</h4>
                              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {bin.location}
                              </p>
                            </div>
                            <Badge
                              variant={statusBadge.variant}
                              className="text-xs shrink-0"
                            >
                              {statusBadge.label}
                            </Badge>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Fill Level</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full bg-gradient-to-r ${gradientClass} rounded-full`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${bin.fill_level}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                                <span className="text-xs font-bold tabular-nums">{bin.fill_level}%</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Capacity</p>
                              <p className="text-xs font-semibold">{bin.capacity}L</p>
                            </div>
                          </div>

                          {/* Action button */}
                          <motion.button
                            onClick={() => onBinClick(bin)}
                            className="w-full mt-2 py-1.5 px-3 rounded-md bg-gradient-eco text-primary-foreground text-xs font-semibold hover:scale-105 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details
                          </motion.button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}

        {/* User Location Marker */}
        {userLocation && (
          <motion.div
            className="absolute pointer-events-auto"
            style={{
              left: `${((latLngToPixel(userLocation.lat, userLocation.lng, center, mapSize, zoom).x / mapSize.width) * 100)}%`,
              top: `${((latLngToPixel(userLocation.lat, userLocation.lng, center, mapSize, zoom).y / mapSize.height) * 100)}%`,
              transform: "translate(-50%, -50%)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-background shadow-lg" />
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Bin List Sidebar (for mobile/compact view) */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-auto md:hidden">
        <div className="max-h-48 overflow-y-auto space-y-2">
          {binsWithCoords.slice(0, 3).map((bin) => {
            const isSelected = selectedBinId === bin.id
            const color = getBinColor(bin)
            const statusBadge = getStatusBadge(bin)

            return (
              <motion.button
                key={bin.id}
                onClick={() => onBinClick(bin)}
                className={`w-full text-left p-2 rounded-lg glass border transition-all ${
                  isSelected
                    ? "border-primary shadow-lg"
                    : "border-border/30 hover:border-primary/50"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getBinBgClass(bin)} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{bin.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{bin.location}</p>
                  </div>
                  <Badge variant={statusBadge.variant} className="text-xs shrink-0">
                    {bin.fill_level}%
                  </Badge>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
