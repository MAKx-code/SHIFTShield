// ============================================================
// SHIFTShield 2.0 — Cooling Resource Map (Supervisor)
// Sub-Task 5 — Full Implementation
//
// Interactive Leaflet + OpenStreetMap map showing:
// - Drinking water points
// - Shaded recovery locations
// - First-aid facilities
// - Workplace locations
//
// Supervisors can add and edit demo resource points.
// All demo data is clearly labelled as simulated.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin, Droplets, Trees, Plus,
  RefreshCw, Filter, Trash2,
  AlertTriangle, HelpCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, ResourceStatusBadge, SimulatedDataBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState, InfoBanner } from '@/components/ui/Spinner'
import api from '@/lib/api'
import { isDemoMode } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import type { CoolingResource, ResourceCategory, ResourceStatus } from '@/types'

// ---- Category display config --------------------------------
const CATEGORY_CONFIG: Record<ResourceCategory, {
  label: string
  icon: React.ReactNode
  markerColor: string
  badgeVariant: 'info' | 'success' | 'critical'
}> = {
  water:     { label: 'Drinking Water',      icon: <Droplets size={14} />, markerColor: '#12B8A6', badgeVariant: 'info'     },
  shade:     { label: 'Shaded Recovery',     icon: <Trees size={14} />,   markerColor: '#16A36A', badgeVariant: 'success'  },
  first_aid: { label: 'First Aid Facility',  icon: <Plus size={14} />,    markerColor: '#DC4545', badgeVariant: 'critical' },
}

const FILTER_OPTIONS: { value: ResourceCategory | 'all'; label: string }[] = [
  { value: 'all',       label: 'All Resources' },
  { value: 'water',     label: 'Water'         },
  { value: 'shade',     label: 'Shade'         },
  { value: 'first_aid', label: 'First Aid'     },
]

// ---- Status colours for markers ----------------------------
const STATUS_OPACITY: Record<ResourceStatus, string> = {
  available:   '1',
  unverified:  '0.7',
  unavailable: '0.4',
}

// ============================================================
// Main Component
// ============================================================

export default function ResourceMapPage() {
  const queryClient = useQueryClient()
  const mapRef          = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all')
  const [selectedResource, setSelectedResource] = useState<CoolingResource | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFormData, setAddFormData] = useState({
    name: '',
    category: 'water' as ResourceCategory,
    address: '',
    status: 'available' as ResourceStatus,
    latitude: -33.865,
    longitude: 151.209,
  })

  // ---- Fetch resources ----------------------------------------
  const {
    data: resources = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['resources', categoryFilter],
    queryFn: () => api.resources.list(categoryFilter !== 'all' ? categoryFilter : undefined),
  })

  // ---- Create resource mutation --------------------------------
  const createMutation = useMutation({
    mutationFn: (data: typeof addFormData) => api.resources.create({
      ...data,
      workplace_id: 'wp-001',
      last_verified: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      setShowAddForm(false)
      setAddFormData({ name: '', category: 'water', address: '', status: 'available', latitude: -33.865, longitude: 151.209 })
    },
  })

  // ---- Delete resource mutation --------------------------------
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.resources.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      setSelectedResource(null)
    },
  })

  // ---- Initialise Leaflet map ---------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapContainerRef.current!, {
        center: [-33.865, 151.209],
        zoom: 14,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setLeafletLoaded(true)
    }).catch(console.error)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ---- Update markers when resources change -------------------
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || isLoading) return

    import('leaflet').then((L) => {
      // Clear existing markers
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          mapRef.current.removeLayer(layer)
        }
      })

      // Add resource markers
      resources.forEach(resource => {
        if (categoryFilter !== 'all' && resource.category !== categoryFilter) return

        const cfg = CATEGORY_CONFIG[resource.category]
        const opacity = parseFloat(STATUS_OPACITY[resource.status])

        // Create custom icon using SVG circle with category colour
        const svgIcon = L.divIcon({
          html: `<svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22s14-12.375 14-22C28 6.27 21.73 0 14 0z"
              fill="${cfg.markerColor}" opacity="${opacity}" />
            <circle cx="14" cy="14" r="7" fill="white" opacity="${opacity}" />
          </svg>`,
          className: '',
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -36],
        })

        const marker = L.marker([resource.latitude, resource.longitude], { icon: svgIcon })
          .addTo(mapRef.current)

        marker.bindTooltip(resource.name, { direction: 'top', offset: [0, -36] })
        marker.on('click', () => setSelectedResource(resource))
      })

      // Workplace marker (primary)
      L.marker([-33.868, 151.206], {
        icon: L.divIcon({
          html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 11 16 24 16 24s16-13 16-24C32 7.16 24.84 0 16 0z"
              fill="#10243A" />
            <text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-family="sans-serif">🏗</text>
          </svg>`,
          className: '',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        }),
      }).addTo(mapRef.current).bindTooltip('Riverside Construction Site', { direction: 'top', offset: [0, -40] })
    })
  }, [resources, leafletLoaded, isLoading, categoryFilter])

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeading />
        <Card><ErrorState title="Failed to load cooling resources" onRetry={refetch} /></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cooling Resource Map</h1>
          <p className="text-sm text-secondary mt-0.5">
            Interactive map of drinking water, shaded recovery areas and first-aid facilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && <SimulatedDataBadge />}
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setShowAddForm(v => !v)}
          >
            Add Resource
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Simulated data notice */}
      {isDemoMode && (
        <InfoBanner
          variant="warning"
          icon={<HelpCircle size={14} />}
          message="Resource locations shown are simulated demonstration data for the Sydney Riverside Construction Site. They do not represent actual facilities."
        />
      )}

      {/* Add resource form */}
      {showAddForm && (
        <Card>
          <CardHeader title="Add New Resource Point" icon={<MapPin size={16} />} />
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(addFormData) }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs text-secondary mb-1">Resource Name *</label>
              <input
                required
                value={addFormData.name}
                onChange={e => setAddFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Water Station A"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Category</label>
              <select
                value={addFormData.category}
                onChange={e => setAddFormData(p => ({ ...p, category: e.target.value as ResourceCategory }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="water">Drinking Water</option>
                <option value="shade">Shaded Recovery</option>
                <option value="first_aid">First Aid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Address / Description</label>
              <input
                value={addFormData.address}
                onChange={e => setAddFormData(p => ({ ...p, address: e.target.value }))}
                placeholder="Near Gate B, Block 3…"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Status</label>
              <select
                value={addFormData.status}
                onChange={e => setAddFormData(p => ({ ...p, status: e.target.value as ResourceStatus }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="available">Available</option>
                <option value="unverified">Unverified</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={addFormData.latitude}
                onChange={e => setAddFormData(p => ({ ...p, latitude: parseFloat(e.target.value) || 0 }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={addFormData.longitude}
                onChange={e => setAddFormData(p => ({ ...p, longitude: parseFloat(e.target.value) || 0 }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" size="sm" variant="primary" loading={createMutation.isPending}>
                Add Resource Point
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-secondary" />
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.value}
            onClick={() => setCategoryFilter(f.value)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              categoryFilter === f.value
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-secondary hover:bg-gray-50'
            )}
          >
            {f.value !== 'all' && CATEGORY_CONFIG[f.value as ResourceCategory].icon}
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-secondary">{resources.length} resource{resources.length !== 1 ? 's' : ''} shown</span>
      </div>

      {/* Map + sidebar layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            {/* Leaflet CSS */}
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />
            <div
              ref={mapContainerRef}
              className="w-full"
              style={{ height: '480px', zIndex: 0 }}
            />
            {!leafletLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <p className="text-sm text-secondary">Loading map…</p>
              </div>
            )}
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3 px-1">
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-secondary">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.markerColor }} />
                {cfg.label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <div className="w-3 h-3 rounded-full bg-primary" />
              Workplace
            </div>
          </div>
        </div>

        {/* Resource list sidebar */}
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-card" />)
          ) : resources.length === 0 ? (
            <Card>
              <EmptyState icon={<MapPin size={18} />} title="No resources found" />
            </Card>
          ) : (
            resources.map(resource => (
              <ResourceListCard
                key={resource.id}
                resource={resource}
                selected={selectedResource?.id === resource.id}
                onSelect={() => setSelectedResource(prev => prev?.id === resource.id ? null : resource)}
                onDelete={() => deleteMutation.mutate(resource.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))
          )}
        </div>
      </div>

      {/* Selected resource detail */}
      {selectedResource && (
        <Card className="border-l-4 border-accent">
          <CardHeader
            title={selectedResource.name}
            subtitle={CATEGORY_CONFIG[selectedResource.category].label}
            icon={CATEGORY_CONFIG[selectedResource.category].icon}
            action={
              <ResourceStatusBadge status={selectedResource.status} />
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
            {selectedResource.address && (
              <div>
                <p className="text-xs text-secondary">Location</p>
                <p className="text-gray-700">{selectedResource.address}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-secondary">Coordinates</p>
              <p className="text-gray-700 font-mono text-xs">{selectedResource.latitude.toFixed(4)}, {selectedResource.longitude.toFixed(4)}</p>
            </div>
            {selectedResource.last_verified && (
              <div>
                <p className="text-xs text-secondary">Last Verified</p>
                <p className="text-gray-700 text-xs">{format(parseISO(selectedResource.last_verified), 'dd MMM yyyy HH:mm')}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// Resource List Card
// ============================================================

interface ResourceListCardProps {
  resource: CoolingResource
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  isDeleting: boolean
}

function ResourceListCard({ resource, selected, onSelect, onDelete, isDeleting }: ResourceListCardProps) {
  const cfg = CATEGORY_CONFIG[resource.category]

  return (
    <div
      className={clsx(
        'bg-white rounded-card shadow-card p-3 cursor-pointer transition-all border-2',
        selected ? 'border-accent' : 'border-transparent hover:border-gray-200'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.markerColor + '20', color: cfg.markerColor }}
        >
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{resource.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-secondary">{cfg.label}</span>
            <ResourceStatusBadge status={resource.status} />
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-critical rounded transition-opacity"
          title="Remove resource"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

function PageHeading() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Cooling Resource Map</h1>
      <p className="text-sm text-secondary mt-0.5">Interactive map of drinking water, shade and first-aid facilities</p>
    </div>
  )
}
