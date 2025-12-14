"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Locate } from "lucide-react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const useMapEvents = dynamic(() => import("react-leaflet").then((mod) => mod.useMapEvents), { ssr: false })

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  selectedLocation?: { lat: number; lng: number }
}

// Helper to get Leaflet (only on client)
let leafletModule: any = null
const getLeaflet = () => {
  if (typeof window === "undefined") return null
  if (!leafletModule) {
    try {
      leafletModule = require("leaflet")
      // Fix for default marker icons in Next.js
      if (leafletModule && leafletModule.Icon && leafletModule.Icon.Default) {
        delete (leafletModule.Icon.Default.prototype as any)._getIconUrl
        leafletModule.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })
      }
    } catch (e) {
      console.error("Failed to load Leaflet:", e)
      return null
    }
  }
  return leafletModule
}

// Round coordinates to 6 decimal places to match database constraint
function roundCoord(value: number): number {
  return Math.round(value * 1000000) / 1000000
}

// Custom marker icon
const createCustomIcon = () => {
  const L = getLeaflet()
  if (!L) return null
  
  return L.divIcon({
    className: "custom-location-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: #22c55e;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 18px;
        ">📍</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Component to handle map clicks
function LocationMarker({ onLocationSelect, position }: { 
  onLocationSelect: (lat: number, lng: number) => void,
  position: { lat: number; lng: number } | null 
}) {
  const { useMapEvents } = require("react-leaflet")
  const map = useMapEvents({
    click(e: any) {
      const lat = roundCoord(e.latlng.lat)
      const lng = roundCoord(e.latlng.lng)
      onLocationSelect(lat, lng)
    },
  })

  useEffect(() => {
    if (position && map) {
      // Keep the current zoom level when updating position
      const currentZoom = map.getZoom ? map.getZoom() : 13
      map.setView([position.lat, position.lng], currentZoom)
    }
  }, [position, map])

  return position ? (
    <Marker position={[position.lat, position.lng]} icon={createCustomIcon()} />
  ) : null
}

export function MapPicker({ onLocationSelect, selectedLocation }: MapPickerProps) {
  const [center, setCenter] = useState<[number, number]>(
    selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [33.5731, -7.5898]
  )
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(selectedLocation || null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    setMapLoaded(true)
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      setCenter([selectedLocation.lat, selectedLocation.lng])
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
          setCenter([location.lat, location.lng])
          setMarker(location)
          onLocationSelect(location.lat, location.lng)
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    const location = { lat, lng }
    setMarker(location)
    onLocationSelect(lat, lng)
  }

  return (
    <Card className="p-4 glass border-primary/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Click on map to select location</label>
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

        <div className="relative h-[400px] w-full rounded-lg overflow-hidden border-2 border-primary/20">
          {mapLoaded ? (
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker onLocationSelect={handleLocationSelect} position={marker} />
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <div className="glass px-4 py-3 rounded-lg border border-primary/30">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {/* Coordinates Display */}
          <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
            <div className="glass px-3 py-2 rounded-lg text-xs font-mono border border-primary/30">
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
