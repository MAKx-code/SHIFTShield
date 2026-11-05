// ============================================================
// SHIFTShield 2.0 — Worker Map Page (Mobile)
// Sub-Task 6 — Full Implementation
//
// Simple mobile-optimised cooling resource map.
// Reuses Leaflet — shows water, shade and first-aid nearby.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Droplets, Trees, Plus, MapPin, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { Badge, ResourceStatusBadge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/Spinner'
import api from '@/lib/api'
import type { CoolingResource, ResourceCategory } from '@/types'

const CATEGORY_CONFIG: Record<ResourceCategory, {
  label: string; icon: React.ReactNode; color: string
}> = {
  water:     { label: 'Water',     icon: <Droplets size={14} />, color: '#12B8A6' },
  shade:     { label: 'Shade',     icon: <Trees size={14} />,   color: '#16A36A' },
  first_aid: { label: 'First Aid', icon: <Plus size={14} />,    color: '#DC4545' },
}

export default function WorkerMapPage() {
  const mapRef          = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [selected, setSelected] = useState<CoolingResource | null>(null)
  const [filter, setFilter]     = useState<ResourceCategory | 'all'>('all')

  const { data: resources = [], isLoading, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn:  () => api.resources.list(),
  })

  // ---- Init map -----------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      const map = L.map(mapContainerRef.current!, { center: [-33.865, 151.209], zoom: 15 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19,
      }).addTo(map)
      mapRef.current = map
      setLeafletLoaded(true)
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  // ---- Update markers -----------------------------------------
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || isLoading) return
    import('leaflet').then((L) => {
      mapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) mapRef.current.removeLayer(layer)
      })
      resources
        .filter(r => filter === 'all' || r.category === filter)
        .forEach(resource => {
          const cfg = CATEGORY_CONFIG[resource.category]
          const icon = L.divIcon({
            html: `<svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 8.25 12 20 12 20s12-11.75 12-20C24 5.37 18.63 0 12 0z"
                fill="${cfg.color}" opacity="${resource.status === 'unavailable' ? '0.4' : '1'}" />
              <circle cx="12" cy="12" r="6" fill="white" />
            </svg>`,
            className: '', iconSize: [24, 32], iconAnchor: [12, 32],
          })
          L.marker([resource.latitude, resource.longitude], { icon })
            .addTo(mapRef.current)
            .bindTooltip(resource.name, { direction: 'top', offset: [0, -32] })
            .on('click', () => setSelected(resource))
        })
    })
  }, [resources, leafletLoaded, isLoading, filter])

  const displayedResources = resources.filter(r => filter === 'all' || r.category === filter)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-bold text-gray-900">Recovery Resources</h2>
        <button onClick={() => refetch()} className="text-secondary">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Filter chips */}
      <div className="flex gap-2 px-4 pb-3 flex-shrink-0 overflow-x-auto">
        {(['all', 'water', 'shade', 'first_aid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
              filter === f ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-secondary'
            )}
          >
            {f !== 'all' && CATEGORY_CONFIG[f as ResourceCategory].icon}
            {f === 'all' ? 'All' : CATEGORY_CONFIG[f as ResourceCategory].label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="px-4 flex-shrink-0">
        <div ref={mapContainerRef} className="w-full rounded-2xl overflow-hidden" style={{ height: 260, zIndex: 0 }} />
      </div>

      {/* Selected resource */}
      {selected && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-card p-4 flex items-start gap-3 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: CATEGORY_CONFIG[selected.category].color + '20', color: CATEGORY_CONFIG[selected.category].color }}
          >
            {CATEGORY_CONFIG[selected.category].icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
            <p className="text-xs text-secondary">{selected.address || `${selected.latitude.toFixed(4)}, ${selected.longitude.toFixed(4)}`}</p>
          </div>
          <ResourceStatusBadge status={selected.status} />
        </div>
      )}

      {/* Resource list */}
      <div className="px-4 mt-3 flex-1 overflow-y-auto space-y-2 pb-4">
        <p className="text-xs font-medium text-secondary uppercase tracking-wide">
          {displayedResources.length} resource{displayedResources.length !== 1 ? 's' : ''}
        </p>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : displayedResources.length === 0 ? (
          <EmptyState icon={<MapPin size={18} />} title="No resources found" />
        ) : (
          displayedResources.map(resource => (
            <button
              key={resource.id}
              className={clsx(
                'w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left',
                selected?.id === resource.id ? 'border-accent bg-accent-50/30' : 'border-transparent bg-white shadow-card'
              )}
              onClick={() => setSelected(resource)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: CATEGORY_CONFIG[resource.category].color + '20', color: CATEGORY_CONFIG[resource.category].color }}
              >
                {CATEGORY_CONFIG[resource.category].icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{resource.name}</p>
                <p className="text-xs text-secondary truncate">{resource.address || CATEGORY_CONFIG[resource.category].label}</p>
              </div>
              <ResourceStatusBadge status={resource.status} />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
