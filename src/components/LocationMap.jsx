import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- 2. Search Component (Sub-component) ---
const SearchField = ({ provider }) => {
  const map = useMap();

  useEffect(() => {
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: "button", // 'bar' or 'button'
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: "Search location...",
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map, provider]);

  return null;
};

// --- 3. Click-to-Drop Pin Component (Sub-component) ---
const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} colorable="red">
      <Popup>Selected Location</Popup>
    </Marker>
  );
};

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, map.getZoom());
  }, [position, map]);
  return null;
};

// --- 4. Main Map Component ---
const LocationMap = ({ theme, onLocationSelect, initialPosition }) => {
  // theme can be 'light', 'dark', or 'satellite'
  const [position, setPosition] = useState(initialPosition);
  const provider = new OpenStreetMapProvider();

  // Notify parent when position changes
  useEffect(() => {
    if (position) {
      onLocationSelect(position);
      localStorage.setItem("selectedLocation", JSON.stringify(position));
    }
  }, [position, onLocationSelect]);

  // Define Tile Layers
  const tileLayers = {
    light: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },
    dark: {
      // CartoDB Dark Matter (Free, great for dark mode)
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; CartoDB",
    },
    satellite: {
      // Esri World Imagery (Free satellite view)
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri",
    },
  };

  const currentLayer = tileLayers[theme] || tileLayers.light;
  console.log(position);
  return (
    <MapContainer
      center={initialPosition || [51.505, -0.09]} // Fallback center
      zoom={16}
      style={{ height: "100%", width: "100%", borderRadius: "1rem" }}
    >
      <TileLayer
        url={currentLayer.url}
        attribution={currentLayer.attribution}
      />

      {/* Add Search Control */}
      <SearchField provider={provider} />

      <RecenterMap position={position} />

      {/* Add Click Listener */}
      <LocationMarker position={position} setPosition={setPosition} />
    </MapContainer>
  );
};

export default LocationMap;
