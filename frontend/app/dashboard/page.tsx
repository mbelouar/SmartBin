"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { DashboardView } from "@/components/dashboard-view"
import { MapView } from "@/components/map-view"
import { BinControl } from "@/components/bin-control"
import { SmartBinLogo } from "@/components/smartbin-logo"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Map, Sparkles, LogOut, User } from "lucide-react"
import { useClerkApi } from "@/hooks/use-clerk-api"
import { isAdminUser } from "@/lib/utils"
import { authApi } from "@/lib/api"
import type { Bin } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, signOut } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  useClerkApi() // Initialize Clerk API integration
  
  // Redirect admins to admin dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn && userLoaded && user) {
      if (isAdminUser(user)) {
        router.replace("/admin")
      }
    }
  }, [isLoaded, isSignedIn, userLoaded, user, router])
  
  const [view, setView] = useState<"dashboard" | "map">("dashboard")
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loadingPoints, setLoadingPoints] = useState(true)
  const [userNfcCode, setUserNfcCode] = useState<string | null>(null)

  // Fetch user points and NFC code from backend
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoadingPoints(false)
        return
      }

      try {
        setLoadingPoints(true)
        // Get user by Clerk ID
        const userData = await authApi.getUserByClerkId(user.id)
        setPoints(userData.points || 5) // Default to 5 if points is null
        setUserNfcCode(userData.nfc_code || null) // Store NFC code for Node-RED
      } catch (error: any) {
        console.error("Failed to fetch user data:", error)
        // Fallback to localStorage if API fails
        const savedPoints = localStorage.getItem("smartbin_points")
        if (savedPoints) {
          setPoints(Number.parseInt(savedPoints))
        } else {
          setPoints(5) // Default to 5 points for new users
        }
      } finally {
        setLoadingPoints(false)
      }
    }

    if (isLoaded && isSignedIn && userLoaded && user) {
      fetchUserData()
    }
  }, [isLoaded, isSignedIn, userLoaded, user])

  const handleBinSelect = (bin: Bin) => {
    setSelectedBin(bin)
  }

  const handleBinClose = () => {
    setSelectedBin(null)
  }

  const handleTrashDeposited = async () => {
    // Points are awarded by the detection service via MQTT
    // Refresh user points with retries to ensure we get the updated balance
    if (user?.id) {
      const refreshPoints = async (retries = 3, delay = 1000) => {
        for (let i = 0; i < retries; i++) {
          try {
            await new Promise(resolve => setTimeout(resolve, delay))
            const userData = await authApi.getUserByClerkId(user.id)
            const newPoints = userData.points || 5
            
            // Update points and NFC code
            setPoints(newPoints)
            if (userData.nfc_code) {
              setUserNfcCode(userData.nfc_code)
            }
            
            // If points changed, we're done
            if (newPoints !== points) {
              console.log("✅ Points refreshed:", newPoints)
              return // Success, stop retrying
            } else if (i === retries - 1) {
              // Last retry, log final state
              console.log("✅ Points refresh complete (no change):", newPoints)
            }
          } catch (error) {
            console.error(`Failed to refresh points (attempt ${i + 1}/${retries}):`, error)
            if (i === retries - 1) {
              // Last retry failed, log error but don't throw
              console.error("Failed to refresh points after all retries")
            }
          }
        }
      }
      
      // Start refreshing after a short delay
      refreshPoints(3, 1500) // 3 retries with 1.5 second delay between each
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/sign-in")
  }

  // Show loading state while checking auth
  // Note: Middleware handles route protection, so we just wait for auth to load
  if (!isLoaded || !userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If somehow we reach here without being signed in (shouldn't happen due to middleware),
  // don't redirect here - let middleware handle it to avoid loops
  // Just show loading and wait - if auth fails, middleware will redirect
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    )
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
                {loadingPoints ? (
                  <span className="font-bold text-primary text-lg tabular-nums">...</span>
                ) : (
                  <span className="font-bold text-primary text-lg tabular-nums">{points ?? 5}</span>
                )}
                <span className="text-xs text-muted-foreground font-medium">eco points</span>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user?.username || user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
                </div>
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
      {selectedBin && <BinControl bin={selectedBin} onClose={handleBinClose} onTrashDeposited={handleTrashDeposited} userNfcCode={userNfcCode} />}
    </div>
  )
}
