"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Bin } from "@/lib/types"
import { binApi } from "@/lib/api"
import { SimpleMap } from "@/components/simple-map"
import { Locate, Layers, Loader2, Map, Satellite, Mountain } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MapViewProps {
  onBinSelect: (bin: Bin) => void
  selectedBin?: Bin | null
  adminMode?: boolean
}

type MapLayer = "osm" | "satellite" | "terrain"

const mapLayers: { id: MapLayer; name: string; icon: React.ReactNode }[] = [
  { id: "osm", name: "Street Map", icon: <Map className="w-4 h-4" /> },
  { id: "satellite", name: "Satellite", icon: <Satellite className="w-4 h-4" /> },
  { id: "terrain", name: "Terrain", icon: <Mountain className="w-4 h-4" /> },
]

export function MapView({ onBinSelect, selectedBin, adminMode = false }: MapViewProps) {
  const [bins, setBins] = useState<Bin[]>([])
  const [filteredBins, setFilteredBins] = useState<Bin[]>([])
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [mapLayer, setMapLayer] = useState<MapLayer>("osm")
  const [selectedCity, setSelectedCity] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

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

  // Filter bins based on city and status
  useEffect(() => {
    let filtered = bins

    // Filter by city
    if (selectedCity !== "all") {
      filtered = filtered.filter(bin => bin.city === selectedCity)
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(bin => bin.status === selectedStatus)
    }

    setFilteredBins(filtered)
  }, [bins, selectedCity, selectedStatus])

  // Get unique cities from bins
  const cities = Array.from(new Set(bins.map(bin => bin.city).filter(Boolean)))

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
    // Only select the bin to show in sidebar, don't trigger full-screen modal
    setSelectedBinId(bin.id)
  }

  const handleUseBin = (bin: Bin) => {
    // In admin mode we just show info/edit, in user mode this opens the use flow
    onBinSelect(bin)
  }

  const availableBins = filteredBins.filter((bin) => bin.status === "active" && bin.fill_level < 80)

  return (
    <div className="space-y-6 flex flex-col h-full min-h-0">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-balance bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Eco Map View
            </h2>
            <p className="text-muted-foreground text-lg font-medium">Interactive bin locations near you</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Filters */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[160px] glass border-primary/30">
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[160px] glass border-primary/30">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 glass border-primary/30 hover:bg-primary/10 hover-lift">
              <Layers className="w-4 h-4" />
                  <span className="font-medium">Layers</span>
            </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-primary/30">
                {mapLayers.map((layer) => (
                  <DropdownMenuItem
                    key={layer.id}
                    onClick={() => setMapLayer(layer.id)}
                    className={`gap-2 cursor-pointer ${
                      mapLayer === layer.id ? "bg-primary/20 font-semibold" : ""
                    }`}
                  >
                    {layer.icon}
                    <span>{layer.name}</span>
                    {mapLayer === layer.id && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
          {filteredBins.length} Total Bins
          {filteredBins.length !== bins.length && ` (${bins.length} total)`}
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
        className="flex-1 min-h-0"
      >
        {loading ? (
          <Card className="overflow-hidden border-border/50 shadow-2xl shadow-primary/10 glass h-full">
            <div className="relative bg-card h-full rounded-lg overflow-hidden flex items-center justify-center">
              <div className="glass px-6 py-4 rounded-2xl border border-primary/30 shadow-2xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Loading bins...</p>
              </div>
            </div>
          </Card>
        ) : (
          <SimpleMap
            bins={filteredBins}
            selectedBinId={selectedBinId}
            onBinClick={handleBinClick}
            onUseBin={handleUseBin}
            userLocation={userLocation}
            isModalOpen={!!selectedBin}
            mapLayer={mapLayer}
            adminMode={adminMode}
          />
        )}
      </motion.div>
    </div>
  )
}
