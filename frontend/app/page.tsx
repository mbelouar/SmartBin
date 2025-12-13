"use client"

import { useState, useEffect } from "react"
import { DashboardView } from "@/components/dashboard-view"
import { MapView } from "@/components/map-view"
import { BinControl } from "@/components/bin-control"
import { SmartBinLogo } from "@/components/smartbin-logo"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Map, Sparkles } from "lucide-react"
import type { Bin } from "@/lib/types"

export default function SmartBinApp() {
  const [view, setView] = useState<"dashboard" | "map">("dashboard")
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null)
  const [points, setPoints] = useState(1250)

  useEffect(() => {
    // Load points from localStorage
    const savedPoints = localStorage.getItem("smartbin_points")
    if (savedPoints) {
      setPoints(Number.parseInt(savedPoints))
    }
  }, [])

  const handleBinSelect = (bin: Bin) => {
    setSelectedBin(bin)
  }

  const handleBinClose = () => {
    setSelectedBin(null)
  }

  const handleTrashDeposited = () => {
    const newPoints = points + 10
    setPoints(newPoints)
    localStorage.setItem("smartbin_points", newPoints.toString())
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-yellow-500/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SmartBinLogo size="sm" />
              <div>
                <h1 className="text-2xl font-bold text-balance bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  SmartBin
                </h1>
                <p className="text-xs text-muted-foreground">Smart Waste Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-yellow-400/20 via-amber-400/10 to-yellow-500/20 border border-yellow-400/30 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="font-bold text-yellow-400 text-lg">{points}</span>
                <span className="text-xs text-muted-foreground font-medium">points</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 p-1.5 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 w-fit shadow-lg">
          <Button
            variant={view === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("dashboard")}
            className="gap-2 rounded-xl transition-all duration-300"
          >
            <LayoutGrid className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            variant={view === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("map")}
            className="gap-2 rounded-xl transition-all duration-300"
          >
            <Map className="w-4 h-4" />
            Map View
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8">
        {view === "dashboard" ? (
          <DashboardView onBinSelect={handleBinSelect} />
        ) : (
          <MapView onBinSelect={handleBinSelect} />
        )}
      </main>

      {/* Bin Control Modal */}
      {selectedBin && <BinControl bin={selectedBin} onClose={handleBinClose} onTrashDeposited={handleTrashDeposited} />}
    </div>
  )
}
