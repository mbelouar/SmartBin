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
    if (fillLevel >= 90) return "text-red-600"
    if (fillLevel >= 70) return "text-orange-600"
    if (fillLevel >= 50) return "text-yellow-600"
    return "text-green-600"
  }
  
  const getFillLevelGradient = (fillLevel: number) => {
    if (fillLevel >= 90) return "from-red-500 to-red-600"
    if (fillLevel >= 70) return "from-orange-500 to-orange-600"
    if (fillLevel >= 50) return "from-yellow-500 to-yellow-600"
    return "from-green-500 to-green-600"
  }
  
  const getProgressColor = (fillLevel: number) => {
    if (fillLevel >= 90) return "bg-red-500"
    if (fillLevel >= 70) return "bg-orange-500"
    if (fillLevel >= 50) return "bg-yellow-500"
    return "bg-green-500"
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
      className="cursor-pointer glass hover-lift hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-500 border-border hover:border-primary/50 group overflow-hidden relative animate-scale-in"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-eco opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-lg" />

      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center group-hover:scale-110 group-hover:animate-wiggle transition-transform duration-300 shadow-md">
                <Trash2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{bin.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary/70" />
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
            <span className="text-muted-foreground font-semibold">Fill Level</span>
            <span className={`font-bold text-lg tabular-nums ${getStatusColor(bin.fill_level)}`}>
              {bin.fill_level}%
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/30 shadow-inner">
            <div 
              className={`h-full bg-gradient-to-r ${getFillLevelGradient(bin.fill_level)} transition-all duration-500 ease-out`}
              style={{ width: `${bin.fill_level}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1 p-3 rounded-lg glass border border-border/50 hover-lift">
            <p className="text-muted-foreground text-xs font-medium">Capacity Used</p>
            <p className="font-bold capitalize text-foreground">
              {((bin.fill_level / 100) * bin.capacity).toFixed(1)}L
            </p>
          </div>
          <div className="space-y-1 p-3 rounded-lg glass border border-border/50 hover-lift">
            <p className="text-muted-foreground text-xs font-medium">Capacity</p>
            <p className="font-bold text-foreground">{bin.capacity}L</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/50 font-medium">
          <span>Updated: {new Date(bin.updated_at).toLocaleTimeString()}</span>
          <Zap className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 group-hover:animate-bounce-soft transition-opacity" />
        </div>
      </CardContent>
    </Card>
  )
}
