"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Locate } from "lucide-react"

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  selectedLocation?: { lat: number; lng: number }
}

// Round coordinates to 6 decimal places to match database constraint (max_digits=9, decimal_places=6)
function roundCoord(value: number): number {
  return Math.round(value * 1000000) / 1000000
}

export function MapPicker({ onLocationSelect, selectedLocation }: MapPickerProps) {
  const [center, setCenter] = useState(selectedLocation || { lat: 40.7128, lng: -74.006 })
  const [marker, setMarker] = useState(selectedLocation)

  useEffect(() => {
    if (selectedLocation) {
      setCenter(selectedLocation)
      setMarker(selectedLocation)
    }
  }, [selectedLocation])

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: roundCoord(position.coords.latitude),
            lng: roundCoord(position.coords.longitude),
          }
          setCenter(location)
          setMarker(location)
          onLocationSelect(location.lat, location.lng)
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // Calculate approximate lat/lng based on click position
      // This is a simplified calculation - in production you'd use proper map projection
      const lng = roundCoord(center.lng + ((x - rect.width / 2) / rect.width) * 0.1)
      const lat = roundCoord(center.lat - ((y - rect.height / 2) / rect.height) * 0.1)
      
      const location = { lat, lng }
      setMarker(location)
      onLocationSelect(lat, lng)
    },
    [center, onLocationSelect]
  )

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.05},${center.lat - 0.05},${center.lng + 0.05},${center.lat + 0.05}&layer=mapnik${marker ? `&marker=${marker.lat},${marker.lng}` : ""}`

  return (
    <Card className="p-4 glass border-primary/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Click on map to select location</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            className="gap-2"
          >
            <Locate className="w-4 h-4" />
            Use My Location
          </Button>
        </div>

        <div
          onClick={handleMapClick}
          className="relative h-[400px] w-full rounded-lg overflow-hidden cursor-crosshair border-2 border-primary/20 hover:border-primary/50 transition-colors"
        >
          <iframe
            src={mapUrl}
            className="absolute inset-0 w-full h-full border-0 pointer-events-none"
            title="Location Picker"
          />
          
          {marker && (
            <div
              className="absolute z-10 -translate-x-1/2 -translate-y-full pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
              }}
            >
              <MapPin className="w-8 h-8 text-primary drop-shadow-lg" fill="currentColor" />
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
            <div className="glass px-3 py-2 rounded-lg text-xs font-mono">
              {marker ? (
                <>
                  <div>Lat: {marker.lat.toFixed(6)}</div>
                  <div>Lng: {marker.lng.toFixed(6)}</div>
                </>
              ) : (
                <div className="text-muted-foreground">Click on map to set location</div>
              )}
            </div>
          </div>
        </div>

        {marker && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>
              Location selected: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
