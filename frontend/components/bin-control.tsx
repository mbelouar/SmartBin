"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { X, Trash2, Lock, Unlock, MapPin, Clock, Sparkles, CheckCircle2 } from "lucide-react"
import type { Bin } from "@/lib/types"
import { binApi, detectionApi, getUser } from "@/lib/api"

interface BinControlProps {
  bin: Bin
  onClose: () => void
  onTrashDeposited: () => void
}

export function BinControl({ bin, onClose, onTrashDeposited }: BinControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [isDetecting, setIsDetecting] = useState(false)
  const [pointsAwarded, setPointsAwarded] = useState<number | null>(null)
  const [showPointsAnimation, setShowPointsAnimation] = useState(false)

  // Check if bin can be opened (memoized to prevent re-renders)
  const { canOpen, statusMessage } = useMemo(() => {
    if (bin.status === "full" || bin.fill_level >= 90) {
      return {
        canOpen: false,
        statusMessage: "This bin is full and cannot accept more waste. Please use another bin."
      }
    }
    if (bin.status === "maintenance") {
      return {
        canOpen: false,
        statusMessage: "This bin is currently under maintenance and temporarily unavailable. Please use another bin."
      }
    }
    if (bin.status === "inactive") {
      return {
        canOpen: false,
        statusMessage: "This bin is currently inactive and cannot be used. Please use another bin."
      }
    }
    return {
      canOpen: true,
      statusMessage: null
    }
  }, [bin.status, bin.fill_level])

  // Countdown timer (informational only - won't auto-close)
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isOpen && !isDetecting && !showPointsAnimation) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0 // Stop at 0, don't auto-close
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [isOpen, isDetecting, showPointsAnimation])

  // Poll for detection events from Node-RED (real-time detection)
  useEffect(() => {
    if (isOpen && !isDetecting && !showPointsAnimation) {
      // Record when bin was opened to check for detections after this time
      const openedAt = Date.now()
      
      const pollInterval = setInterval(async () => {
        try {
          // Get recent detections (only those created after bin was opened)
          const detections = await detectionApi.list()
          const recentDetection = detections.results?.find(
            (d: any) => {
              const detectionTime = new Date(d.created_at || d.detected_at).getTime()
              return d.bin_id === bin.id && detectionTime >= openedAt
            }
          )
          
          if (recentDetection) {
            clearInterval(pollInterval)
            handleTrashDetected(recentDetection.points_awarded || 10)
          }
        } catch (error) {
          console.error("Error polling for detection:", error)
          // Continue polling - don't stop on error
        }
      }, 500) // Poll every 500ms for real-time detection from Node-RED

      return () => clearInterval(pollInterval)
    }
  }, [isOpen, isDetecting, showPointsAnimation, bin.id])

  const handleOpen = async () => {
    // Check if bin can be opened
    if (!canOpen) {
      return
    }

    console.log("[v0] Opening bin:", bin.id)
    try {
      // Get user QR code or use default
      const user = getUser()
      const userQrCode = user?.qr_code || `SB-${user?.id || 'user-001'}`
      
      // Call API to open bin (this will publish to MQTT)
      await binApi.openBin(bin.id, userQrCode)
      
      setIsOpen(true)
      setTimeRemaining(10)
      setIsDetecting(false)
      setPointsAwarded(null)
      setShowPointsAnimation(false)
    } catch (error) {
      console.error("[v0] Error opening bin:", error)
      // Still show as open for testing
      setIsOpen(true)
      setTimeRemaining(10)
    }
  }

  const handleClose = async () => {
    console.log("[v0] Closing bin:", bin.id)
    try {
      // Call API to close bin
      await binApi.closeBin(bin.id)
      
      setIsOpen(false)
      setTimeRemaining(10)
      setIsDetecting(false)
      setPointsAwarded(null)
      setShowPointsAnimation(false)
    } catch (error) {
      console.error("[v0] Error closing bin:", error)
      // Still close UI
      setIsOpen(false)
      setTimeRemaining(10)
      setIsDetecting(false)
      setPointsAwarded(null)
      setShowPointsAnimation(false)
    }
  }

  const handleTrashDetected = (points: number = 10) => {
    setIsDetecting(true)
    setPointsAwarded(points)
    setShowPointsAnimation(true)
    
    // Award points
    onTrashDeposited()
    
    // Close bin after animation
    setTimeout(() => {
      handleClose()
      setTimeout(() => {
        onClose()
      }, 500)
    }, 2500)
  }

  const getStatusColor = () => {
    if (bin.fill_level >= 90) return "from-red-500 to-red-600"
    if (bin.fill_level >= 70) return "from-orange-500 to-orange-600"
    if (bin.fill_level >= 50) return "from-yellow-500 to-yellow-600"
    return "from-green-500 to-green-600"
  }

  const getStatusBadge = () => {
    if (bin.status === "full" || bin.fill_level >= 90) return { label: "Full", variant: "destructive" as const }
    if (bin.status === "maintenance") return { label: "Maintenance", variant: "secondary" as const }
    if (bin.status === "inactive") return { label: "Inactive", variant: "secondary" as const }
    if (bin.fill_level < 50) return { label: "Available", variant: "default" as const }
    return { label: "Filling", variant: "secondary" as const }
  }

  const statusBadge = getStatusBadge()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card className="overflow-hidden border-border/50 shadow-2xl glass backdrop-blur-xl bg-gradient-to-br from-card/95 via-card/90 to-card/95">
            {/* Header with Gradient */}
            <div className={`relative bg-gradient-to-r ${getStatusColor()} p-4 overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
              
              <CardHeader className="relative z-10 p-0 border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-xl"
                    >
                      <Trash2 className="w-6 h-6 text-white drop-shadow-lg" />
                    </motion.div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white mb-1 drop-shadow-lg">
                        {bin.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-white/90" />
                        <span className="text-xs text-white/90 font-medium">
                          {bin.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white border border-white/20 backdrop-blur-sm transition-all"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </div>

            <CardContent className="p-4 space-y-4">
              {/* Status and Info Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-lg p-3 border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Status</p>
                  <Badge variant={statusBadge.variant} className="text-xs font-semibold">
                    {statusBadge.label}
                  </Badge>
                </div>
                <div className="glass rounded-lg p-3 border border-border/50 bg-gradient-to-br from-secondary/10 to-secondary/5">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Capacity</p>
                  <p className="text-base font-bold text-foreground">{bin.capacity}L</p>
                </div>
                <div className="glass rounded-lg p-3 border border-border/50 bg-gradient-to-br from-accent/10 to-accent/5">
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Fill Level</p>
                  <p className="text-base font-bold text-foreground">{bin.fill_level}%</p>
                </div>
              </div>

              {/* Fill Level Progress */}
              <div className="space-y-2 glass rounded-lg p-3 border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Fill Level</span>
                  <span className={`text-xl font-bold bg-gradient-to-r ${getStatusColor()} bg-clip-text text-transparent`}>
                    {bin.fill_level}%
                  </span>
                </div>
                <div className="relative">
                  <Progress 
                    value={bin.fill_level} 
                    className="h-3 bg-muted/50"
                  />
                  <motion.div
                    className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${getStatusColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${bin.fill_level}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Detection Status */}
              <AnimatePresence>
                {isOpen && !showPointsAnimation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    {!isDetecting ? (
                      <div className="relative flex items-center justify-center gap-3 p-4 rounded-lg bg-gradient-to-br from-blue-500/20 via-blue-400/20 to-blue-500/20 border-2 border-blue-400/40 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-[shimmer_2s_infinite]" />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="relative z-10"
                        >
                          <Clock className="w-6 h-6 text-blue-500 relative z-10" />
                        </motion.div>
                        <div className="text-center relative z-10">
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">Waiting for Node-RED detection</p>
                          <p className="text-sm font-semibold text-blue-400">
                            Trigger detection from Node-RED
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center gap-3 p-4 rounded-lg bg-gradient-to-br from-green-500/20 via-emerald-400/20 to-green-500/20 border-2 border-green-400/40 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-[shimmer_2s_infinite]" />
                        <motion.div
                          animate={{ scale: [1, 1.2], rotate: 360 }}
                          transition={{ 
                            scale: { duration: 0.5, repeat: Infinity, repeatType: "reverse" },
                            rotate: { duration: 1, repeat: Infinity, ease: "linear" }
                          }}
                        >
                          <CheckCircle2 className="w-6 h-6 text-green-500 relative z-10" />
                        </motion.div>
                        <div className="text-center relative z-10">
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">Trash detected!</p>
                          <p className="text-sm font-bold text-green-500">Processing...</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Points Animation */}
              <AnimatePresence>
                {showPointsAnimation && pointsAwarded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="relative flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-green-500/30 via-emerald-400/20 to-green-500/30 border-2 border-green-400/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/30 to-transparent animate-[shimmer_2s_infinite]" />
                    
                    {/* Sparkles Animation */}
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        initial={{
                          x: "50%",
                          y: "50%",
                          opacity: 0,
                        }}
                        animate={{
                          x: `${50 + Math.cos((i * Math.PI * 2) / 12) * 100}%`,
                          y: `${50 + Math.sin((i * Math.PI * 2) / 12) * 100}%`,
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: 0.2,
                          repeat: 0,
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-green-400" />
                      </motion.div>
                    ))}
                    
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="relative z-10 mb-2"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/50">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                    </motion.div>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm font-medium text-muted-foreground mb-1 relative z-10"
                    >
                      Points Awarded!
                    </motion.p>
                    
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3, stiffness: 200, damping: 15 }}
                      className="relative z-10"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-green-400 animate-pulse" />
                        <motion.span
                          key={pointsAwarded}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.4, stiffness: 200, damping: 15 }}
                          className="text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent"
                        >
                          +{pointsAwarded}
                        </motion.span>
                        <Sparkles className="w-6 h-6 text-green-400 animate-pulse" />
                      </div>
                    </motion.div>
                    
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-muted-foreground mt-2 relative z-10"
                    >
                      Thank you for recycling! 🌱
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Message */}
              <AnimatePresence>
                {statusMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className={`p-4 rounded-lg border-2 ${
                      bin.status === "full" || bin.fill_level >= 90
                        ? "bg-red-500/10 border-red-500/40"
                        : bin.status === "maintenance"
                        ? "bg-orange-500/10 border-orange-500/40"
                        : "bg-gray-500/10 border-gray-500/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${
                        bin.status === "full" || bin.fill_level >= 90
                          ? "text-red-500"
                          : bin.status === "maintenance"
                          ? "text-orange-500"
                          : "text-gray-500"
                      }`}>
                        {bin.status === "full" || bin.fill_level >= 90 ? (
                          <X className="w-5 h-5" />
                        ) : bin.status === "maintenance" ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold mb-1 ${
                          bin.status === "full" || bin.fill_level >= 90
                            ? "text-red-500"
                            : bin.status === "maintenance"
                            ? "text-orange-500"
                            : "text-gray-500"
                        }`}>
                          {bin.status === "full" || bin.fill_level >= 90
                            ? "Bin is Full"
                            : bin.status === "maintenance"
                            ? "Under Maintenance"
                            : "Bin is Inactive"}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {statusMessage}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Control Buttons */}
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {!isOpen ? (
                    <motion.div
                      key="open"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Button
                        onClick={handleOpen}
                        disabled={!canOpen}
                        className="w-full h-12 text-base font-semibold gap-2 bg-gradient-to-r from-primary via-accent to-secondary hover:from-primary/90 hover:via-accent/90 hover:to-secondary/90 text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        size="lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <Unlock className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Open Bin</span>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        disabled={isDetecting}
                        className="w-full h-11 gap-2 bg-transparent border-2 border-border hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 font-semibold disabled:opacity-50"
                        size="lg"
                      >
                        <Lock className="w-4 h-4" />
                        Close Bin
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Info Message */}
              {!statusMessage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-blue-500/10 border border-blue-500/20"
                >
                  <div className="mt-0.5">
                    {isOpen ? (
                      isDetecting ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-500" />
                      )
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground mb-0.5">
                      {isOpen 
                        ? (isDetecting ? "Trash detected!" : "Bin is open - waiting for Node-RED detection")
                        : "Ready to use"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isOpen
                        ? (isDetecting 
                            ? "Node-RED detected your deposit. Points will be awarded automatically!"
                            : "Bin is open. Trigger detection from Node-RED to simulate trash deposit and award points.")
                        : "Click 'Open Bin' to unlock. The bin will automatically detect when you deposit waste and award eco points!"}
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
