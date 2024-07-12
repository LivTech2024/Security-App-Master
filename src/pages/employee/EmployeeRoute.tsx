import { useEffect, useState } from 'react';
import useListenEmpRoute from '../../hooks/listeners/useListenEmpRoute';
import { useSearchParams } from 'react-router-dom';
import {
  DirectionsRenderer,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { toDate } from '../../utilities/misc';
import PageHeader from '../../common/PageHeader';

const EmployeeRoute = () => {
  const [searchParam] = useSearchParams();

  const empRouteId = searchParam.get('id');

  const isMobileGuard = searchParam.get('is_mobile_guard');

  const { empRoutes } = useListenEmpRoute(empRouteId || '');

  const [coordinates, setCoordinates] = useState<
    { lat: number; lng: number }[]
  >([]);

  const [directionsResponse, setDirectionsResponse] =
    useState<google.maps.DirectionsResult | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_JAVASCRIPT_API,
  });

  useEffect(() => {
    const tempCoords =
      empRoutes?.EmpRouteLocations.sort(
        (a, b) =>
          toDate(a.LocationReportedAt).getTime() -
          toDate(b.LocationReportedAt).getTime()
      ).map((res) => ({
        lat: res.LocationCoordinates.latitude,
        lng: res.LocationCoordinates.longitude,
      })) || [];
    setCoordinates(tempCoords);
  }, [empRoutes]);

  useEffect(() => {
    async function calculateRoute() {
      if (coordinates.length === 0) return;
      const directionsService = new window.google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: coordinates[0],
        destination: coordinates[coordinates.length - 1],
        travelMode: window.google.maps.TravelMode.WALKING,
      });
      setDirectionsResponse(results);
    }
    calculateRoute();
  }, [coordinates]);

  if (isLoaded && coordinates)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader title="Employee route & live location" />
        <GoogleMap
          center={{
            lat: coordinates[coordinates.length - 1]?.lat,
            lng: coordinates[coordinates.length - 1]?.lng,
          }}
          zoom={5}
          mapContainerStyle={{ width: '100%', height: '100vh' }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{
                suppressMarkers: true,
              }}
            />
          )}

          {coordinates?.length > 0 && (
            <>
              <Marker
                position={coordinates[0]}
                icon={{
                  url: '../../../public/assets/start_point.png', // Replace with the URL for your home icon
                  scaledSize: new window.google.maps.Size(40, 40), // Adjust the size as needed
                }}
              />
              <Marker
                position={coordinates[coordinates.length - 1]}
                icon={{
                  url: isMobileGuard
                    ? '../../../public/assets/car.png'
                    : '../../../public/assets/guard.png',
                  scaledSize: new window.google.maps.Size(40, 40), // Adjust the size as needed
                }}
              />
            </>
          )}
        </GoogleMap>
      </div>
    );
};

export default EmployeeRoute;
