"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, Trash2, Wifi, Zap } from "lucide-react"
import type { Bin } from "@/lib/types"

interface BinCardProps {
  bin: Bin
  onClick: () => void
}

export function BinCard({ bin, onClick }: BinCardProps) {
  const getStatusColor = (fillLevel: number) => {
    if (fillLevel < 30) return "text-yellow-400"
    if (fillLevel < 70) return "text-amber-400"
    return "text-destructive"
  }
  
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: "default" as const, label: "Active" },
      inactive: { variant: "secondary" as const, label: "Offline" },
      maintenance: { variant: "secondary" as const, label: "Maintenance" },
      full: { variant: "destructive" as const, label: "Full" },
    }
    return statusMap[status as keyof typeof statusMap] || { variant: "secondary" as const, label: status }
  }

  return (
    <Card
      /* Updated hover effects to yellow theme */
      className="cursor-pointer hover:shadow-2xl hover:shadow-yellow-400/10 hover:scale-[1.03] transition-all duration-500 bg-gradient-to-br from-card via-card to-card/80 border-border hover:border-yellow-400/50 group overflow-hidden relative"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-400/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Trash2 className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-yellow-400 transition-colors">{bin.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{bin.location}</span>
                </div>
              </div>
            </div>
          </div>

          <Badge variant={getStatusBadge(bin.status).variant} className="gap-1.5 px-3">
            <Wifi className="w-3 h-3" />
            {getStatusBadge(bin.status).label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Fill Level</span>
            <span className={`font-bold text-lg ${getStatusColor(bin.fill_level)}`}>{bin.fill_level}%</span>
          </div>
          <Progress value={bin.fill_level} className="h-2.5" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-muted-foreground text-xs">Capacity</p>
            <p className="font-semibold capitalize text-foreground">{bin.capacity}L</p>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-muted-foreground text-xs">QR Code</p>
            <p className="font-semibold text-foreground text-xs">{bin.qr_code}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/50">
          <span>Last updated: {new Date(bin.updated_at).toLocaleTimeString()}</span>
          <Zap className="w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  )
}
