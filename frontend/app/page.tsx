"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardView } from "@/components/dashboard-view"
import { MapView } from "@/components/map-view"
import { BinControl } from "@/components/bin-control"
import { SmartBinLogo } from "@/components/smartbin-logo"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Map, Sparkles, LogIn, LogOut, User, Settings } from "lucide-react"
import { authApi, getUser, isAuthenticated } from "@/lib/api"
import type { Bin } from "@/lib/types"

export default function SmartBinApp() {
  const router = useRouter()
  const [view, setView] = useState<"dashboard" | "map">("dashboard")
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null)
  const [points, setPoints] = useState(1250)
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Load points from localStorage
    const savedPoints = localStorage.getItem("smartbin_points")
    if (savedPoints) {
      setPoints(Number.parseInt(savedPoints))
    }

    // Check authentication status
    const authenticated = isAuthenticated()
    const currentUser = getUser()
    setIsAuth(authenticated)
    setUser(currentUser)
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

  const handleLogout = () => {
    authApi.logout()
    setIsAuth(false)
    setUser(null)
    router.push("/")
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/50 glass sticky top-0 z-50 shadow-sm shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SmartBinLogo size="sm" />
              <div>
                <h1 className="text-2xl font-bold text-balance bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  SmartBin
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Eco-Friendly Waste Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 via-accent/10 to-secondary/20 border border-primary/30">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary text-lg tabular-nums">{points}</span>
                <span className="text-xs text-muted-foreground font-medium">eco points</span>
              </div>

              {/* User Menu */}
              {isAuth && user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  {user.is_staff && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/admin")}
                      className="gap-2 border-primary/30 hover:bg-primary/10"
                    >
                      <Settings className="w-4 h-4" />
                      Admin
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => router.push("/login")}
                  className="gap-2 bg-gradient-eco hover:scale-105 transition-all duration-300"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 shrink-0">
        <div className="flex gap-2 p-1.5 glass rounded-2xl border border-border/50 w-fit shadow-xl hover-lift">
          <Button
            variant={view === "dashboard" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("dashboard")}
            className="gap-2 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="font-medium">Dashboard</span>
          </Button>
          <Button
            variant={view === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("map")}
            className="gap-2 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Map className="w-4 h-4" />
            <span className="font-medium">Map View</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`container mx-auto px-4 ${view === "map" ? "flex-1 min-h-0 flex flex-col pb-0" : "pb-8"}`}>
        {view === "dashboard" ? (
          <DashboardView onBinSelect={handleBinSelect} />
        ) : (
          <MapView onBinSelect={handleBinSelect} selectedBin={selectedBin} />
        )}
      </main>

      {/* Bin Control Modal */}
      {selectedBin && <BinControl bin={selectedBin} onClose={handleBinClose} onTrashDeposited={handleTrashDeposited} />}
    </div>
  )
}
