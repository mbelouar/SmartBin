"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BinCard } from "@/components/bin-card"
import { Badge } from "@/components/ui/badge"
import type { Bin } from "@/lib/types"
import { binApi } from "@/lib/api"
import { Sparkles, TrendingUp, Loader2 } from "lucide-react"

interface DashboardViewProps {
  onBinSelect: (bin: Bin) => void
}

export function DashboardView({ onBinSelect }: DashboardViewProps) {
  const [bins, setBins] = useState<Bin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const availableBins = bins.filter((bin) => bin.status === "active" && bin.fill_level < 80)

  return (
    <div className="space-y-8">
      {/* Header Section with Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-balance bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Nearby Bins
            </h2>
            <p className="text-muted-foreground text-lg">Find and use smart bins near you</p>
          </div>

          {/* Stats Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <Badge className="gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 border-yellow-400/30 text-base text-yellow-400">
              <TrendingUp className="w-4 h-4" />
              {availableBins.length} Available
            </Badge>
          </motion.div>
        </div>

        {/* Decorative Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-full origin-left"
        />
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        /* Updated banner to yellow theme */
        className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-yellow-400/10 via-amber-400/10 to-yellow-500/10 border border-yellow-400/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-shimmer" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-400/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Earn Points & Make a Difference</h3>
            <p className="text-sm text-muted-foreground">
              Deposit your waste responsibly and earn 10 points for each disposal
            </p>
          </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bins.map((bin, index) => (
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
