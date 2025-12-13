"use client"

import { useState, useEffect } from "react"
import { AdminDashboard } from "@/components/admin-dashboard"
import { SmartBinLogo } from "@/components/smartbin-logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getUser } from "@/lib/api"

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
  }, [])

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

            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Button>
              </Link>
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
