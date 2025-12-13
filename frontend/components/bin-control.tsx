"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { X, Trash2, Lock, Unlock, MapPin, Clock, Award, Sparkles } from "lucide-react"
import type { Bin } from "@/lib/types"

interface BinControlProps {
  bin: Bin
  onClose: () => void
  onTrashDeposited: () => void
}

export function BinControl({ bin, onClose, onTrashDeposited }: BinControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [isDepositing, setIsDepositing] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isOpen && !isDepositing) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleClose()
            return 10
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [isOpen, isDepositing])

  const handleOpen = async () => {
    console.log("[v0] Opening bin via Node-RED:", bin.id)
    try {
      setIsOpen(true)
      setTimeRemaining(10)
    } catch (error) {
      console.error("[v0] Error opening bin:", error)
    }
  }

  const handleClose = async () => {
    console.log("[v0] Closing bin via Node-RED:", bin.id)
    try {
      setIsOpen(false)
      setTimeRemaining(10)
      setIsDepositing(false)
    } catch (error) {
      console.error("[v0] Error closing bin:", error)
    }
  }

  const handleDepositTrash = () => {
    setIsDepositing(true)
    setTimeout(() => {
      onTrashDeposited()
      setIsDepositing(false)
      handleClose()
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg border-border/50 shadow-2xl shadow-yellow-400/10 animate-in slide-in-from-bottom-8 duration-500 bg-gradient-to-br from-card via-card to-card/90">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-card/80 via-card/60 to-card/80 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400/20 via-amber-400/20 to-yellow-500/20 flex items-center justify-center animate-pulse-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent animate-shimmer" />
                <Trash2 className="w-7 h-7 text-yellow-400 relative z-10" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {bin.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {bin.location} • {bin.distance}m away
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Bin Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground font-medium">Status</p>
              <Badge variant={bin.status === "online" ? "default" : "destructive"} className="px-3 py-1">
                {bin.status}
              </Badge>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-sm text-muted-foreground font-medium">Type</p>
              <p className="font-bold capitalize text-foreground">{bin.type}</p>
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-yellow-400/5 to-amber-400/5 border border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Current Capacity</span>
              <span className="font-bold text-xl text-yellow-400">{bin.capacity}%</span>
            </div>
            <Progress value={bin.capacity} className="h-3" />
          </div>

          {/* Timer Display */}
          {isOpen && (
            /* Updated timer display to yellow theme */
            <div className="relative flex items-center justify-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-yellow-400/20 via-amber-400/20 to-yellow-500/20 border-2 border-yellow-400/40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent animate-shimmer" />
              <Clock className="w-6 h-6 text-yellow-400 animate-pulse relative z-10" />
              <div className="text-center relative z-10">
                <p className="text-sm text-muted-foreground font-medium mb-1">Auto-close in</p>
                <p className="text-4xl font-bold text-yellow-400 animate-bounce-soft">{timeRemaining}s</p>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="space-y-3">
            {!isOpen ? (
              /* Updated open button to yellow theme */
              <Button
                onClick={handleOpen}
                className="w-full h-16 text-lg gap-3 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-400/90 hover:to-amber-400/90 text-black shadow-lg shadow-yellow-400/20 transition-all duration-300"
                size="lg"
              >
                <Unlock className="w-5 h-5" />
                Open Bin
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleDepositTrash}
                  disabled={isDepositing}
                  className="w-full h-16 text-lg gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-500/90 hover:to-yellow-500/90 text-black shadow-lg shadow-amber-400/20 transition-all duration-300 relative overflow-hidden group"
                  size="lg"
                >
                  {isDepositing ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Deposit Trash (+10 pts)
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full h-14 gap-3 bg-transparent border-2 hover:bg-muted/50 transition-all duration-300"
                  size="lg"
                >
                  <Lock className="w-5 h-5" />
                  Close Bin
                </Button>
              </>
            )}
          </div>

          {/* Info Message */}
          <div className="text-xs text-center text-muted-foreground bg-muted/50 p-4 rounded-xl border border-border/50">
            {isOpen
              ? "Bin will auto-close after 10 seconds of inactivity"
              : "Click to open this bin and dispose your waste responsibly"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
