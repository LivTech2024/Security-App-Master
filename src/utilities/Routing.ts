import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

export const Routing = ({
  geoPoints,
}: {
  geoPoints: { lat: number; lng: number }[];
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const waypoints = geoPoints.map((point) => L.latLng(point.lat, point.lng));

    const routingControl = L.Routing.control({
      waypoints: waypoints,
      createMarker: (i: number, waypoint: { latLng: L.LatLngExpression }) => {
        const label =
          i === 0
            ? 'Start Point'
            : i === waypoints.length - 1
              ? 'End Point'
              : null;
        if (label) {
          return L.marker(waypoint.latLng, {
            draggable: true,
          })
            .bindPopup(label)
            .openPopup();
        }
        return null;
      },
      lineOptions: {
        styles: [{ color: 'blue', weight: 4 }],
      },
      show: true,
      addWaypoints: false,
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, geoPoints]);

  return null;
};
