"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminDashboard } from "@/components/admin-dashboard"
import { SmartBinLogo } from "@/components/smartbin-logo"
import { Button } from "@/components/ui/button"
import { Home, LogOut, User } from "lucide-react"
import { authApi, getUser, isAuthenticated } from "@/lib/api"

export default function AdminPage() {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const authenticated = isAuthenticated()
    const currentUser = getUser()
    setIsAuth(authenticated)
    setUser(currentUser)
  }, [])

  const handleLogout = () => {
    authApi.logout()
    router.push("/login")
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
              {isAuth && user && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user.username}</span>
                  {user.is_staff && (
                    <span className="text-xs text-primary font-semibold ml-1">(Admin)</span>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="gap-2 border-primary/30 hover:bg-primary/10"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>

              {isAuth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
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
