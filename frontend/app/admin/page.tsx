"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { AdminDashboard } from "@/components/admin-dashboard"
import { SmartBinLogo } from "@/components/smartbin-logo"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { isAdminUser } from "@/lib/utils"
import { useClerkApi } from "@/hooks/use-clerk-api"

// Force dynamic rendering to avoid build-time errors with Clerk
export const dynamic = 'force-dynamic'

export default function AdminPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, signOut } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  useClerkApi() // Initialize Clerk API integration - CRITICAL for sending tokens

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
      return
    }
    
    // Redirect to dashboard if not admin
    if (isLoaded && isSignedIn && userLoaded && user) {
      if (!isAdminUser(user)) {
        router.push("/dashboard")
      }
    }
  }, [isLoaded, isSignedIn, userLoaded, user, router])

  const handleLogout = async () => {
    await signOut()
    router.push("/sign-in")
  }

  // Show loading state while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not signed in (will redirect)
  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 glass sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SmartBinLogo size="sm" />
              <div>
                <h1 className="text-2xl font-bold text-balance bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Manage Smart Bins</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.firstName || user.emailAddresses[0]?.emailAddress}</span>
                  <span className="text-xs text-primary font-semibold ml-1">(Admin)</span>
                </div>
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <AdminDashboard />
      </main>
    </div>
  )
}
