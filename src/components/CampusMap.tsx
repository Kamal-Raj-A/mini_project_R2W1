import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { IssueWithCategory } from '../lib/database.types';
import CampusNavigationPanel from './CampusNavigationPanel';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';


/* Fix default Leaflet marker icons */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CampusMapProps {
  onLocationSelect?: (lat: number, lng: number, name: string) => void;
  selectMode?: boolean;
}

/* Handle map click for location selection */
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/* Draw route and distance */
function RoutingControl({
  start,
  end,
  onClose,
}: {
  start: [number, number];
  end: [number, number];
  onClose: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1]),
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      lineOptions: {
        styles: [{ color: '#2563EB', weight: 5 }],
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
      }),
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [start, end, map]);

  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 z-[1000] bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
    >
      <X size={18} />
      Clear Route
    </button>
  );
}

export default function CampusMap({ onLocationSelect, selectMode = false }: CampusMapProps) {
  const [issues, setIssues] = useState<IssueWithCategory[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeStart, setRouteStart] = useState<[number, number] | null>(null);
  const [routeEnd, setRouteEnd] = useState<[number, number] | null>(null);
  const [showRouting, setShowRouting] = useState(false);

  const mapRef = useRef<L.Map | null>(null);

  const defaultCenter: [number, number] = [13.0290, 80.0189];
  const defaultZoom = 16;

  /* Ensure map always centers on campus when mounted */
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, defaultZoom);
    }
  }, []);

  useEffect(() => {
    fetchIssues();

    const subscription = supabase
      .channel('issues-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, fetchIssues)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchIssues = async () => {
    const { data } = await supabase
      .from('issues')
      .select(`*, category:issue_categories(*)`)
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null);

    if (data) setIssues(data as any);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    onLocationSelect?.(lat, lng, `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleNavigateToIssue = (issue: IssueWithCategory) => {
    if (!issue.location_lat || !issue.location_lng) return;

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setRouteStart([pos.coords.latitude, pos.coords.longitude]);
        setRouteEnd([issue.location_lat!, issue.location_lng!]);
        setShowRouting(true);
      },
      () => {
        setRouteStart(defaultCenter);
        setRouteEnd([issue.location_lat!, issue.location_lng!]);
        setShowRouting(true);
      }
    );
  };

  /* Campus place → place navigation */
  const handleCampusNavigate = (start: [number, number], end: [number, number]) => {
    setRouteStart(start);
    setRouteEnd(end);
    setShowRouting(true);
  };

  const createCustomIcon = (color: string, status: string) => {
    const statusEmoji: Record<string, string> = {
      pending: '🔴',
      in_progress: '🟡',
      resolved: '🟢',
      closed: '⚪',
    };

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color:${color};
          width:32px;
          height:32px;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;">
          ${statusEmoji[status] || '🔴'}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CampusNavigationPanel
          onNavigate={handleCampusNavigate}
          onClear={() => {
            setShowRouting(false);
            setRouteStart(null);
            setRouteEnd(null);
          }}
        />

        {selectMode && <MapClickHandler onLocationSelect={handleMapClick} />}

        {issues.map(
          (issue) =>
            issue.location_lat &&
            issue.location_lng && (
              <Marker
                key={issue.id}
                position={[issue.location_lat, issue.location_lng]}
                icon={createCustomIcon(issue.category?.color || '#3B82F6', issue.status)}
              >
                <Popup>
                  <h3 className="font-bold">{issue.title}</h3>
                  <p className="text-sm">{issue.description}</p>
                  <button
                    onClick={() => handleNavigateToIssue(issue)}
                    className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Navigation size={14} /> Navigate Here
                  </button>
                </Popup>
              </Marker>
            )
        )}

        {showRouting && routeStart && routeEnd && (
          <RoutingControl
            start={routeStart}
            end={routeEnd}
            onClose={() => {
              setShowRouting(false);
              setRouteStart(null);
              setRouteEnd(null);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
