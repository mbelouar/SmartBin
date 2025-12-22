"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BinCard } from "@/components/bin-card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Bin } from "@/lib/types"
import { binApi } from "@/lib/api"
import { TrendingUp, Loader2, AlertCircle } from "lucide-react"

interface DashboardViewProps {
  onBinSelect: (bin: Bin) => void
}

export function DashboardView({ onBinSelect }: DashboardViewProps) {
  const [bins, setBins] = useState<Bin[]>([])
  const [filteredBins, setFilteredBins] = useState<Bin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        setError("Failed to load bins. Please try again.")
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

  const availableBins = filteredBins.filter((bin) => bin.status === "active" && bin.fill_level < 80)

  return (
    <div className="space-y-8">
      {/* Header Section with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-balance bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Nearby Eco Bins
            </h2>
            <p className="text-muted-foreground text-lg font-medium">Find and use smart bins near you</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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

            {/* Stats Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <Badge className="gap-2 px-4 py-2 glass border-primary/30 text-base text-primary font-semibold hover-lift">
                <TrendingUp className="w-4 h-4" />
                {availableBins.length} Available
                {filteredBins.length !== bins.length && ` (${filteredBins.length} total)`}
              </Badge>
            </motion.div>
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

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative overflow-hidden p-6 rounded-2xl glass border border-primary/20 hover-lift"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
        <div className="relative">
          <h3 className="font-bold text-lg mb-1 text-primary">Earn Eco Points & Save the Planet</h3>
          <p className="text-sm text-muted-foreground font-medium">
            Deposit your waste responsibly and earn 5 eco points for each smart disposal
            </p>
        </div>
      </motion.div>

      {/* Bins Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500">{error}</p>
        </div>
      ) : bins.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No bins found. Please add bins via the admin panel.</p>
        </div>
      ) : filteredBins.length === 0 ? (
        <Card className="p-12 text-center glass">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg mb-4">No bins match the selected filters.</p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCity("all")
              setSelectedStatus("all")
            }}
            className="gap-2"
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBins.map((bin, index) => (
          <motion.div
            key={bin.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.5,
              type: "spring",
              stiffness: 100,
            }}
          >
            <BinCard bin={bin} onClick={() => onBinSelect(bin)} />
          </motion.div>
        ))}
      </div>
      )}
    </div>
  )
}
