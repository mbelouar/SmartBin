"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BinCard } from "@/components/bin-card"
import { binApi } from "@/lib/api"
import type { Bin } from "@/lib/types"
import { Plus, MapPin, Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AdminDashboard() {
  const [bins, setBins] = useState<Bin[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    qr_code: "",
    location: "",
    latitude: "",
    longitude: "",
    capacity: "100",
    status: "active" as "active" | "inactive" | "maintenance" | "full",
  })

  useEffect(() => {
    loadBins()
  }, [])

  const loadBins = async () => {
    try {
      setLoading(true)
      const response = await binApi.list()
      setBins(response.results || (response as any))
    } catch (err: any) {
      console.error("Failed to load bins:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to load bins",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const binData = {
        name: formData.name,
        qr_code: formData.qr_code,
        location: formData.location,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        capacity: parseInt(formData.capacity),
        status: formData.status,
      }

      await binApi.create(binData)
      
      toast({
        title: "Success",
        description: "Bin created successfully!",
      })

      // Reset form
      setFormData({
        name: "",
        qr_code: "",
        location: "",
        latitude: "",
        longitude: "",
        capacity: "100",
        status: "active",
      })
      setShowForm(false)
      loadBins()
    } catch (err: any) {
      console.error("Failed to create bin:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create bin. Make sure you're logged in as admin.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (binId: string) => {
    if (!confirm("Are you sure you want to delete this bin?")) return

    try {
      await binApi.delete(binId)
      
      toast({
        title: "Success",
        description: "Bin deleted successfully!",
      })
      loadBins()
    } catch (err: any) {
      console.error("Failed to delete bin:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete bin",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-4xl font-bold mb-2 text-balance bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Bin Management
            </h2>
            <p className="text-muted-foreground text-lg font-medium">Add and manage smart bins</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2 bg-gradient-eco hover:scale-105 transition-all duration-300 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Cancel" : "Add New Bin"}
          </Button>
        </div>
      </motion.div>

      {/* Add Bin Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 glass border-primary/30">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bin Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Smart Bin #001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qr_code">QR Code *</Label>
                  <Input
                    id="qr_code"
                    value={formData.qr_code}
                    onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                    placeholder="e.g., SB-001"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Central Park, Main Street"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g., 40.7128"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g., -74.0060"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (Liters) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="100"
                    required
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 bg-gradient-eco hover:scale-105 transition-all duration-300"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Create Bin
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Bins List */}
      <div>
        <h3 className="text-2xl font-bold mb-4 text-foreground">All Bins ({bins.length})</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bins.length === 0 ? (
          <Card className="p-12 text-center glass">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground text-lg">No bins found. Create your first bin!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bins.map((bin) => (
              <div key={bin.id} className="relative group">
                <BinCard bin={bin} onSelect={() => {}} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(bin.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
