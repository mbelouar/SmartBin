"use client"

import { useMemo, useCallback } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import type { Bin } from "@/lib/types"

// TypeScript declaration for google.maps
declare const google: typeof import("@types/google.maps")


const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"]

interface GoogleMapComponentProps {
  bins: Bin[]
  selectedBinId: string | null
  onBinClick: (bin: Bin) => void
  userLocation?: { lat: number; lng: number }
}

const defaultCenter = {
  lat: 40.7128, // Default to New York if no location
  lng: -74.0060,
}

const mapContainerStyle = {
  width: "100%",
  height: "100%",
}

const defaultOptions = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
}

export function GoogleMapComponent({
  bins,
  selectedBinId,
  onBinClick,
  userLocation,
}: GoogleMapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  })

  const center = useMemo(() => {
    if (userLocation) {
      return userLocation
    }
    // If we have bins with coordinates, center on the first one
    const binWithCoords = bins.find((bin) => bin.latitude && bin.longitude)
    if (binWithCoords && binWithCoords.latitude && binWithCoords.longitude) {
      return {
        lat: binWithCoords.latitude,
        lng: binWithCoords.longitude,
      }
    }
    return defaultCenter
  }, [bins, userLocation])

  const getMarkerColor = (bin: Bin) => {
    if (bin.fill_level > 70) return "#ef4444" // red
    if (bin.fill_level > 50) return "#f59e0b" // amber
    return "#22c55e" // green
  }

  const handleMarkerClick = useCallback(
    (bin: Bin) => {
      onBinClick(bin)
    },
    [onBinClick]
  )

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center p-6">
          <p className="text-destructive font-semibold mb-2">Error loading Google Maps</p>
          <p className="text-sm text-muted-foreground">
            {apiKey ? "Please check your API key configuration." : "Google Maps API key is missing."}
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading Google Maps...</p>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={bins.length > 0 ? 13 : 10}
      options={defaultOptions}
    >
      {/* User Location Marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          }}
          title="Your Location"
        />
      )}

      {/* Bin Markers */}
      {bins
        .filter((bin) => bin.latitude && bin.longitude)
        .map((bin) => {
          const isSelected = selectedBinId === bin.id
          const markerColor = getMarkerColor(bin)

          return (
            <Marker
              key={bin.id}
              position={{
                lat: bin.latitude!,
                lng: bin.longitude!,
              }}
              onClick={() => handleMarkerClick(bin)}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="${isSelected ? "32" : "28"}" height="${isSelected ? "32" : "28"}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="${isSelected ? "10" : "8"}" fill="${markerColor}" stroke="#ffffff" stroke-width="2"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(isSelected ? 32 : 28, isSelected ? 32 : 28),
                anchor: new google.maps.Point(12, 12),
              }}
              title={bin.name}
              animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
            >
              {isSelected && (
                <InfoWindow
                  position={{
                    lat: bin.latitude!,
                    lng: bin.longitude!,
                  }}
                  onCloseClick={() => {}}
                >
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg mb-1 text-foreground">{bin.name}</h3>
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">
                        <span className="font-semibold">Location:</span> {bin.location}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-semibold">Fill Level:</span>{" "}
                        <span
                          className={
                            bin.fill_level > 70
                              ? "text-destructive font-bold"
                              : bin.fill_level > 50
                                ? "text-accent font-bold"
                                : "text-primary font-bold"
                          }
                        >
                          {bin.fill_level}%
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-semibold">Status:</span>{" "}
                        <span className="capitalize">{bin.status}</span>
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-semibold">Capacity:</span> {bin.capacity}L
                      </p>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )
        })}
    </GoogleMap>
  )
}
