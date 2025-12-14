"use client"

import { useMemo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Trash2, AlertCircle, XCircle, Navigation, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Bin } from "@/lib/types"
import dynamic from "next/dynamic"

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

interface SimpleMapProps {
  bins: Bin[]
  selectedBinId: string | null
  onBinClick: (bin: Bin) => void
  userLocation?: { lat: number; lng: number }
}

// Helper to parse coordinate (handles both string and number)
const parseCoord = (coord: string | number | undefined): number => {
  if (coord === undefined || coord === null) return 0
  return typeof coord === 'string' ? parseFloat(coord) : coord
}

// Component to fit map bounds to markers
function FitBounds({ bins }: { bins: Bin[] }) {
  const { useMap } = require("react-leaflet")
  const map = useMap()
  const binsWithCoords = bins.filter((bin) => bin.latitude && bin.longitude)

  useEffect(() => {
    if (binsWithCoords.length === 0 || !map) return

    const bounds = L.latLngBounds(
      binsWithCoords.map((bin) => [
        parseCoord(bin.latitude),
        parseCoord(bin.longitude),
      ])
    )

    map.fitBounds(bounds, { padding: [50, 50] })
  }, [binsWithCoords, map])

  return null
}

// Custom marker icon based on bin status
const createBinIcon = (bin: Bin) => {
  const getColor = () => {
    if (bin.status === "full" || bin.fill_level >= 90) return "#ef4444" // red
    if (bin.fill_level >= 70) return "#f97316" // orange
    if (bin.fill_level >= 50) return "#eab308" // yellow
    return "#22c55e" // green
  }

  return L.divIcon({
    className: "custom-bin-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: ${getColor()};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">🗑️</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

export function SimpleMap({
  bins,
  selectedBinId,
  onBinClick,
  userLocation,
}: SimpleMapProps) {
  const [activeInfoCard, setActiveInfoCard] = useState<string | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Filter bins with coordinates
  const binsWithCoords = useMemo(
    () => bins.filter((bin) => bin.latitude && bin.longitude),
    [bins]
  )

  // Calculate center
  const center = useMemo(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng] as [number, number]
    }
    if (binsWithCoords.length > 0) {
      const avgLat = binsWithCoords.reduce((sum, bin) => sum + parseCoord(bin.latitude), 0) / binsWithCoords.length
      const avgLng = binsWithCoords.reduce((sum, bin) => sum + parseCoord(bin.longitude), 0) / binsWithCoords.length
      return [avgLat, avgLng] as [number, number]
    }
    return [33.5731, -7.5898] as [number, number] // Default to Casablanca, Morocco
  }, [binsWithCoords, userLocation])

  const getBinColor = (bin: Bin) => {
    if (bin.status === "full" || bin.fill_level >= 90) return "destructive"
    if (bin.fill_level >= 70) return "warning"
    if (bin.fill_level >= 50) return "secondary"
    return "primary"
  }

  const getBinColorClass = (bin: Bin) => {
    const color = getBinColor(bin)
    const colorMap: Record<string, string> = {
      destructive: "bg-red-500/90 border-red-500 text-white",
      warning: "bg-orange-500/90 border-orange-500 text-white",
      secondary: "bg-yellow-500/90 border-yellow-500 text-white",
      primary: "bg-green-500/90 border-green-500 text-white",
    }
    return colorMap[color] || colorMap.primary
  }

  const getBinGradientClass = (bin: Bin) => {
    const color = getBinColor(bin)
    const colorMap: Record<string, string> = {
      destructive: "from-red-500 via-red-600 to-red-500/80",
      warning: "from-orange-500 via-orange-400 to-orange-500/80",
      secondary: "from-yellow-500 via-yellow-400 to-yellow-500/80",
      primary: "from-green-500 via-green-400 to-green-500/80",
    }
    return colorMap[color] || colorMap.primary
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

  const openInOSM = (bin: Bin) => {
    const lat = parseCoord(bin.latitude)
    const lng = parseCoord(bin.longitude)
    if (lat && lng) {
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`, '_blank')
    }
  }

  useEffect(() => {
    setMapLoaded(true)
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Map Container - Takes 2 columns on large screens */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden border-border/50 shadow-2xl shadow-primary/10 glass h-full">
          <div className="relative bg-muted/20 h-[500px] lg:h-[600px] rounded-lg overflow-hidden">
            {mapLoaded && binsWithCoords.length > 0 ? (
              <MapContainer
                center={center}
                zoom={binsWithCoords.length === 1 ? 15 : 13}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds bins={binsWithCoords} />
                
                {/* Bin Markers */}
                {binsWithCoords.map((bin) => {
                  const lat = parseCoord(bin.latitude)
                  const lng = parseCoord(bin.longitude)
                  const isSelected = selectedBinId === bin.id
                  
                  return (
                    <Marker
                      key={bin.id}
                      position={[lat, lng]}
                      icon={createBinIcon(bin)}
                      eventHandlers={{
                        click: () => {
                          onBinClick(bin)
                          setActiveInfoCard(bin.id === activeInfoCard ? null : bin.id)
                        },
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <h3 className="font-bold text-sm mb-1">{bin.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{bin.location}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span>Fill Level: <strong>{bin.fill_level}%</strong></span>
                            <Badge variant={getStatusBadge(bin).variant} className="text-xs">
                              {getStatusBadge(bin).label}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-2 text-xs"
                            onClick={() => onBinClick(bin)}
                          >
                            View Details
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}

                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    position={[userLocation.lat, userLocation.lng]}
                    icon={L.divIcon({
                      className: "custom-user-marker",
                      html: `
                        <div style="
                          width: 24px;
                          height: 24px;
                          background-color: #3b82f6;
                          border: 3px solid white;
                          border-radius: 50%;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        "></div>
                      `,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    })}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="text-sm font-semibold">Your Location</p>
                        <p className="text-xs text-muted-foreground">
                          {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="glass px-6 py-4 rounded-2xl border border-primary/30 shadow-2xl text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {binsWithCoords.length === 0 ? "No bins with locations found" : "Loading map..."}
                  </p>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute top-4 right-4 z-[1000] glass border border-primary/30 rounded-lg p-3 shadow-xl">
              <h4 className="text-xs font-bold mb-2 text-foreground">Bin Status</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs">Filling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs">Almost Full</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs">Full</span>
                </div>
              </div>
            </div>

            {/* User Location Indicator */}
            {userLocation && (
              <div className="absolute bottom-4 left-4 z-[1000] glass border border-blue-500/50 rounded-lg px-3 py-2 shadow-xl">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Navigation className="w-4 h-4 text-blue-500" />
                  </motion.div>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Your Location</p>
                    <p className="text-muted-foreground font-mono">
                      {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bin List Sidebar - Takes 1 column on large screens */}
      <div className="lg:col-span-1">
        <Card className="overflow-hidden border-border/50 shadow-2xl glass h-full">
          <div className="flex flex-col h-full max-h-[500px] lg:max-h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10">
              <h3 className="text-sm font-bold text-foreground">
                Smart Bins ({binsWithCoords.length})
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Click to select and use a bin
              </p>
            </div>

            {/* Bin Cards List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {binsWithCoords.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No bins with locations found</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Add bins with GPS coordinates from the admin dashboard
                    </p>
                  </motion.div>
                ) : (
                  binsWithCoords.map((bin, index) => {
                    const isSelected = selectedBinId === bin.id
                    const isActive = activeInfoCard === bin.id
                    const colorClass = getBinColorClass(bin)
                    const gradientClass = getBinGradientClass(bin)
                    const BinIcon = getBinIcon(bin)
                    const statusBadge = getStatusBadge(bin)

                    return (
                      <motion.div
                        key={bin.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                            isSelected
                              ? "border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                              : "border-transparent hover:border-primary/30 hover:shadow-lg"
                          }`}
                          onClick={() => {
                            onBinClick(bin)
                            setActiveInfoCard(bin.id === activeInfoCard ? null : bin.id)
                          }}
                        >
                          {/* Card Header with Gradient */}
                          <div className={`relative h-2 bg-gradient-to-r ${gradientClass} overflow-hidden`}>
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              initial={{ x: "-100%" }}
                              animate={{ x: "100%" }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                          </div>

                          {/* Card Content */}
                          <div className="p-3 bg-card">
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <motion.div
                                className={`shrink-0 rounded-full p-2 border-2 ${colorClass}`}
                                whileHover={{ rotate: 15, scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <BinIcon className="w-4 h-4" />
                              </motion.div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="font-bold text-sm truncate text-foreground">{bin.name}</h4>
                                  <Badge variant={statusBadge.variant} className="text-xs shrink-0">
                                    {statusBadge.label}
                                  </Badge>
                                </div>
                                
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-2">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  {bin.location}
                                </p>

                                {/* Fill Level Bar */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Fill Level</span>
                                    <span className="font-bold tabular-nums">{bin.fill_level}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full bg-gradient-to-r ${gradientClass}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${bin.fill_level}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>

                                {/* Quick Info */}
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Trash2 className="w-3 h-3" />
                                    <span>{bin.capacity}L</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs gap-1 ml-auto hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openInOSM(bin)
                                    }}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View on Map
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground">Coordinates</p>
                                        <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                          {parseCoord(bin.latitude).toFixed(6)}
                                        </p>
                                        <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                          {parseCoord(bin.longitude).toFixed(6)}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-muted-foreground">QR Code</p>
                                        <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                          {bin.qr_code}
                                        </p>
                                        <p className="text-muted-foreground mt-2">Status</p>
                                        <p className="font-semibold capitalize">{bin.status}</p>
                                      </div>
                                    </div>

                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onBinClick(bin)
                                      }}
                                      className="w-full gap-2 bg-gradient-eco hover:scale-105 transition-all text-xs"
                                      size="sm"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Use This Bin
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Stats Footer */}
            <div className="p-4 border-t border-border/50 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
              <div className="grid grid-cols-2 gap-2">
                <div className="glass rounded-lg p-2 border border-primary/30">
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-lg font-bold text-primary">
                    {binsWithCoords.filter(b => b.status === "active" && b.fill_level < 80).length}
                  </p>
                </div>
                <div className="glass rounded-lg p-2 border border-border/30">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">{binsWithCoords.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
