// /mnt/data/MapContainer.jsx
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useState, useCallback, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { auth } from "../lib/firebase";
import ReportIssueModal from "./ReportIssueModal";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin, Filter, LocateFixed } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = { lat: 13.0290, lng: 80.0189 };
const ADMIN_EMAIL = "kamalraj3106@gmail.com";

const CAMPUS_PLACES = [
  { id: "library_2f", name: "Library (2nd floor)", lat: 13.0296, lng: 80.0194 },
  { id: "way_to_ground", name: "Way to Ground", lat: 13.0284, lng: 80.0181 },
  { id: "main_entrance", name: "Main Entrance", lat: 13.0301, lng: 80.0178 },
  { id: "cafe_block", name: "Cafeteria", lat: 13.0289, lng: 80.0190 },
];

function emojiForType(type) {
  if (!type) return "📍";
  const t = type.toLowerCase();
  if (t.includes("lift") || t.includes("elevator")) return "♿";
  if (t.includes("ramp")) return "🛣️";
  if (t.includes("noise")) return "🔊";
  if (t.includes("broken") || t.includes("repair") || t.includes("damage")) return "🚧";
  if (t.includes("clean") || t.includes("hygiene")) return "🧼";
  if (t.includes("safety") || t.includes("danger")) return "⚠️";
  if (t.includes("parking")) return "🅿️";
  return "📍";
}

function MapContainer() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filter, setFilter] = useState("All");
  const [center, setCenter] = useState(defaultCenter);
  const [modalOpen, setModalOpen] = useState(false);
  const [newIssueLocation, setNewIssueLocation] = useState(null);

  // UI states
  const [menuOpen, setMenuOpen] = useState(false);
  const [showIssuesList, setShowIssuesList] = useState(false);
  const [activeNav, setActiveNav] = useState("map");
  const [mapType, setMapType] = useState("roadmap");

  // Directions
  const [originPlace, setOriginPlace] = useState("");
  const [destinationPlace, setDestinationPlace] = useState("");
  const [directionsResult, setDirectionsResult] = useState(null);

  const mapRef = useRef(null);
  const pressTimeoutRef = useRef(null);
  const lastDownEventRef = useRef(null);
  const listenersRef = useRef([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "issues"), (snapshot) => {
      setIssues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // handle double-click report
  const handleMapDoubleClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setNewIssueLocation({ lat, lng });
    setModalOpen(true);
  };

  // Setup map DOM listeners for long-press detection (mousedown/up on map)
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const map = mapRef.current;
    const gmaps = window.google.maps;

    const clearPressTimer = () => {
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
        pressTimeoutRef.current = null;
      }
    };

    const downListener = gmaps.event.addListener(map, "mousedown", (e) => {
      lastDownEventRef.current = e;
      pressTimeoutRef.current = setTimeout(() => {
        const ev = lastDownEventRef.current;
        if (ev && ev.latLng) {
          const lat = ev.latLng.lat();
          const lng = ev.latLng.lng();
          setNewIssueLocation({ lat, lng });
          setModalOpen(true);
        }
        pressTimeoutRef.current = null;
      }, 2000);
    });

    const upListener = gmaps.event.addListener(map, "mouseup", () => {
      clearPressTimer();
      lastDownEventRef.current = null;
    });

    const dragListener = gmaps.event.addListener(map, "drag", () => {
      clearPressTimer();
      lastDownEventRef.current = null;
    });

    const mapDiv = map.getDiv && map.getDiv();
    const touchStart = () => {
      if (pressTimeoutRef.current) return;
      pressTimeoutRef.current = setTimeout(() => {
        const evMap = lastDownEventRef.current;
        if (evMap && evMap.latLng) {
          const lat = evMap.latLng.lat();
          const lng = evMap.latLng.lng();
          setNewIssueLocation({ lat, lng });
          setModalOpen(true);
        }
        pressTimeoutRef.current = null;
      }, 2000);
    };
    const touchEnd = () => {
      clearPressTimer();
      lastDownEventRef.current = null;
    };

    if (mapDiv) {
      mapDiv.addEventListener("touchstart", touchStart, { passive: true });
      mapDiv.addEventListener("touchend", touchEnd);
      mapDiv.addEventListener("touchcancel", touchEnd);
    }

    listenersRef.current.push(downListener, upListener, dragListener);

    return () => {
      listenersRef.current.forEach((l) => {
        try {
          gmaps.event.removeListener(l);
        } catch (err) {
          // ignore
        }
      });
      listenersRef.current = [];
      if (mapDiv) {
        mapDiv.removeEventListener("touchstart", touchStart);
        mapDiv.removeEventListener("touchend", touchEnd);
        mapDiv.removeEventListener("touchcancel", touchEnd);
      }
      clearPressTimer();
      lastDownEventRef.current = null;
    };
  }, [isLoaded]); // note: rely on isLoaded; mapRef is assigned in onLoadMap

  const handleDeleteIssue = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this issue?");
    if (confirmDelete) {
      await deleteDoc(doc(db, "issues", id));
      setSelectedIssue(null);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          alert("Could not get your location. Please enable GPS.");
          console.error(err);
        }
      );
    } else {
      alert("Geolocation is not supported in your browser.");
    }
  };

  const filteredIssues =
    filter === "All" ? issues : issues.filter((i) => (i.type || "").toLowerCase().includes(filter.toLowerCase()));

  const zoomToIssue = (issue) => {
    if (issue?.lat && issue?.lng) {
      setCenter({ lat: issue.lat, lng: issue.lng });
      setSelectedIssue(issue);
      if (window.innerWidth < 760) setShowIssuesList(false);
    } else {
      console.warn("Issue has no position", issue);
    }
  };

  // handle map load
  const onLoadMap = (map) => {
    mapRef.current = map;
    try {
      if (map && map.setMapTypeId) map.setMapTypeId(mapType);
    } catch (err) {
      // ignore
    }
  };

  // update map type live
  useEffect(() => {
    if (mapRef.current && mapRef.current.setMapTypeId) {
      try {
        mapRef.current.setMapTypeId(mapType);
      } catch (err) {
        // ignore
      }
    }
  }, [mapType]);

  // Directions
  const requestRoute = async () => {
    if (!originPlace || !destinationPlace) {
      alert("Select both origin and destination places.");
      return;
    }
    if (originPlace === destinationPlace) {
      alert("Origin and destination are the same. Choose different places.");
      return;
    }

    const origin = CAMPUS_PLACES.find((p) => p.id === originPlace);
    const destination = CAMPUS_PLACES.find((p) => p.id === destinationPlace);
    if (!origin || !destination) {
      alert("Selected places not found. Please choose valid campus places.");
      return;
    }

    if (!window.google || !window.google.maps) {
      alert("Google Maps API not loaded. Try reloading the page.");
      console.error("window.google not available", window.google);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        console.log("Directions status:", status, { result });
        if (status === "OK" && result) {
          setDirectionsResult(result);
          try {
            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].overview_path.forEach((p) => bounds.extend(p));
            mapRef.current && mapRef.current.fitBounds(bounds);
          } catch (err) {
            console.warn("Could not fit bounds to route:", err);
          }
        } else {
          const msg = `Could not calculate route: ${status}`;
          alert(msg);
          console.error(msg, result);
        }
      }
    );
  };

  const clearRoute = () => {
    setDirectionsResult(null);
    setOriginPlace("");
    setDestinationPlace("");
    setCenter(defaultCenter);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* TOP BAR */}
      <div className="top-bar" role="toolbar" aria-label="top controls">
        <div className="top-bar__left">
          <button
            className="three-dot-btn"
            aria-label="open menu"
            onClick={() => setMenuOpen((s) => !s)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="5" cy="12" r="2" fill="#111827" />
              <circle cx="12" cy="12" r="2" fill="#111827" />
              <circle cx="19" cy="12" r="2" fill="#111827" />
            </svg>
          </button>

          {menuOpen && (
            <div className="menu-panel" role="menu">
              <button
                onClick={() => {
                  setActiveNav("home");
                  setShowIssuesList(false);
                  setMenuOpen(false);
                }}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setActiveNav("map");
                  setShowIssuesList(false);
                  setCenter(defaultCenter);
                  setMenuOpen(false);
                }}
              >
                Map
              </button>
              <button
                onClick={() => {
                  setActiveNav("issues");
                  setShowIssuesList(true);
                  setMenuOpen(false);
                }}
              >
                Issues Reported
              </button>
            </div>
          )}
        </div>

        <div className="top-bar__center">
          <div className="map-type-group" role="group" aria-label="map type">
            <button
              className={`map-type-btn ${mapType === "roadmap" ? "active" : ""}`}
              onClick={() => setMapType("roadmap")}
            >
              Map
            </button>
            <button
              className={`map-type-btn ${mapType === "satellite" ? "active" : ""}`}
              onClick={() => setMapType("satellite")}
            >
              Satellite
            </button>
            <button
              className={`map-type-btn ${mapType === "terrain" ? "active" : ""}`}
              onClick={() => setMapType("terrain")}
            >
              Terrain
            </button>
          </div>

          <div className="filters-group" role="group" aria-label="filters">
            {["All", "Lift", "Ramp", "Noise"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
              >
                <Filter className="icon" />
                <span className="label">{f}</span>
              </button>
            ))}
          </div>

          <div className="actions-group">
            <button className="action-btn" onClick={handleMyLocation}>
              <LocateFixed className="icon" />
              <span className="label">My Location</span>
            </button>

            <button
              className="action-btn"
              onClick={() => {
                // MAIN FIX: ensure newIssueLocation is set when opening modal manually
                try {
                  if (mapRef.current && typeof mapRef.current.getCenter === "function") {
                    const c = mapRef.current.getCenter();
                    if (c && c.lat && c.lng) {
                      // in some builds getCenter returns LatLng with methods
                      setNewIssueLocation({ lat: c.lat(), lng: c.lng() });
                    } else if (c && c.lat && c.lng) {
                      setNewIssueLocation({ lat: c.lat, lng: c.lng });
                    } else {
                      setNewIssueLocation(center || defaultCenter);
                    }
                  } else {
                    setNewIssueLocation(center || defaultCenter);
                  }
                } catch (err) {
                  console.warn("Could not read map center", err);
                  setNewIssueLocation(center || defaultCenter);
                }
                setModalOpen(true);
              }}
            >
              <MapPin className="icon" />
              <span className="label">Report</span>
            </button>
          </div>
        </div>

        <div className="top-bar__right" />
      </div>

      {/* Left issues sidebar */}
      <aside className={`left-sidebar ${showIssuesList ? "" : "collapsed"}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Reported Issues</h3>
          <div className="flex gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded px-2 py-1 text-sm">
              <option>All</option>
              <option>Lift</option>
              <option>Ramp</option>
              <option>Noise</option>
            </select>
            <button onClick={() => setShowIssuesList((s) => !s)} className="px-2 py-1 rounded bg-gray-100">
              {showIssuesList ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
          {filteredIssues.length === 0 ? (
            <div className="text-sm text-gray-500">No issues reported yet.</div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="mb-3 p-2 rounded hover:bg-gray-50 cursor-pointer border"
                onClick={() => zoomToIssue(issue)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-sm">{issue.type}</div>
                    <div className="text-xs text-gray-500">{issue.user || "Unknown"}</div>
                    <div className="text-xs text-gray-400 mt-1">{(issue.description || "").slice(0, 70)}</div>
                  </div>
                  <div className="text-xs text-gray-400">{issue.timestamp ? new Date(issue.timestamp).toLocaleString() : ""}</div>
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      zoomToIssue(issue);
                    }}
                    className="px-3 py-1 rounded bg-gray-900 text-white text-sm hover:opacity-90"
                    aria-label={`View issue ${issue.id}`}
                  >
                    View
                  </button>

                  {auth.currentUser?.email === ADMIN_EMAIL && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteIssue(issue.id);
                      }}
                      className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:opacity-90 flex items-center gap-2"
                      aria-label={`Delete issue ${issue.id}`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M3 6h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
        onDblClick={handleMapDoubleClick}
        onLoad={onLoadMap}
        options={{
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: true,
        }}
      >
        {filteredIssues.map((issue) => {
          const emoji = emojiForType(issue.type);
          return (
            <Marker
              key={issue.id}
              position={{ lat: issue.lat, lng: issue.lng }}
              onClick={() => setSelectedIssue(issue)}
              label={{
                text: emoji,
                fontSize: "32px",
              }}
              icon={null}
            />
          );
        })}

        {/* Preview marker for the location selected when opening the Report modal */}
        {newIssueLocation && (
          <Marker
            key="new-issue-preview"
            position={{ lat: newIssueLocation.lat, lng: newIssueLocation.lng }}
            label={{ text: "🟣", fontSize: "28px" }}
            onClick={() => {
              /* optional: could focus modal or open a small preview info window */
            }}
          />
        )}

        {selectedIssue && (
          <InfoWindow position={{ lat: selectedIssue.lat, lng: selectedIssue.lng }} onCloseClick={() => setSelectedIssue(null)}>
            <div style={{ maxWidth: "220px" }}>
              <h3 className="font-semibold text-gray-900">{selectedIssue.type}</h3>
              <p className="text-sm text-gray-600 mb-1">{selectedIssue.description}</p>
              <p className="text-xs text-gray-400 mb-2">Reported by: {selectedIssue.user || "Unknown"}</p>
              <p className="text-xs text-gray-400 mb-2">{selectedIssue.timestamp ? new Date(selectedIssue.timestamp).toLocaleString() : ""}</p>

              {auth.currentUser?.email === ADMIN_EMAIL && (
                <Button variant="report" onClick={() => handleDeleteIssue(selectedIssue.id)} size="sm" className="text-xs">
                  <Trash2 className="w-4 h-4" />
                  Delete Issue
                </Button>
              )}
            </div>
          </InfoWindow>
        )}

        {directionsResult && <DirectionsRenderer directions={directionsResult} />}
      </GoogleMap>

      {/* Directions box */}
      <div className="absolute bottom-6 left-6 z-40 bg-white/95 p-3 rounded-lg shadow-md w-80">
        <h4 className="font-semibold mb-2">Get Directions (campus places)</h4>

        <div className="flex flex-col gap-2">
          <select value={originPlace} onChange={(e) => setOriginPlace(e.target.value)} className="px-2 py-1 rounded">
            <option value="">Select origin</option>
            {CAMPUS_PLACES.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select value={destinationPlace} onChange={(e) => setDestinationPlace(e.target.value)} className="px-2 py-1 rounded">
            <option value="">Select destination</option>
            {CAMPUS_PLACES.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button onClick={requestRoute} className="px-3 py-1">
              Show Path
            </Button>
            <Button variant="outline" onClick={clearRoute} className="px-3 py-1">
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Report modal */}
      <ReportIssueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async ({ type, description }) => {
          if (!type) {
            alert("Issue type is required");
            return;
          }

          if (!newIssueLocation || !newIssueLocation.lat || !newIssueLocation.lng) {
            alert("Could not determine issue location. Please double-click or long-press on the map to choose a location, or reopen the Report button near the place you want to report.");
            console.warn("Attempted submit with missing newIssueLocation:", newIssueLocation);
            return;
          }

          try {
            await addDoc(collection(db, "issues"), {
              lat: newIssueLocation.lat,
              lng: newIssueLocation.lng,
              type,
              description,
              timestamp: new Date().toISOString(),
              user: auth.currentUser?.email || "anonymous",
            });

            alert("Issue reported successfully!");
            setModalOpen(false);
            // reset preview marker
            setNewIssueLocation(null);
          } catch (err) {
            console.error("Error adding doc:", err);
            alert("Failed to report issue. See console for details.");
          }
        }}
      />
    </div>
  );
}

export default MapContainer;
