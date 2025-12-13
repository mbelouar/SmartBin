"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi, saveAuthToken, saveUser } from "@/lib/api"
import { SmartBinLogo } from "@/components/smartbin-logo"
import { LogIn, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authApi.login({
        username: formData.username,
        password: formData.password,
      })

      // Save token and user data
      saveAuthToken(response.access)
      saveUser(response.user)

      toast({
        title: "Login Successful!",
        description: `Welcome back, ${response.user.username}!`,
      })

      // Redirect based on user role
      if (response.user.is_staff) {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      console.error("Login failed:", err)
      toast({
        title: "Login Failed",
        description: err.message || "Invalid username or password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fillAdmin = () => {
    setFormData({ username: "admin", password: "admin123" })
  }

  const fillUser = () => {
    setFormData({ username: "user", password: "user123" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 glass border-primary/30 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <SmartBinLogo size="lg" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Welcome to SmartBin
            </h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                required
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2 bg-gradient-eco hover:scale-105 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Quick Fill Buttons for Testing */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3">Quick fill for testing:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillAdmin}
                disabled={loading}
                className="gap-2"
              >
                <CheckCircle2 className="w-3 h-3" />
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillUser}
                disabled={loading}
                className="gap-2"
              >
                <CheckCircle2 className="w-3 h-3" />
                User
              </Button>
            </div>
          </div>

          {/* Test Credentials Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Test Credentials:</p>
                <p>
                  <strong>Admin:</strong> admin / admin123
                </p>
                <p>
                  <strong>User:</strong> user / user123
                </p>
              </div>
            </div>
          </motion.div>

          {/* Back to Home */}
          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              disabled={loading}
            >
              Back to Home
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
