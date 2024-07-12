import Dialog from '../../../common/Dialog';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Routing } from '../../../utilities/Routing';
import { LatLngExpression } from 'leaflet';
import useListenEmpRoute from '../../../hooks/listeners/useListenEmpRoute';

interface EmpRouteModalProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  empRouteId: string;
}

const EmpRouteModal = ({
  opened,
  setOpened,
  empRouteId,
}: EmpRouteModalProps) => {
  const { empRoutes } = useListenEmpRoute(empRouteId);

  const coordinates =
    empRoutes?.EmpRouteLocations.map((res) => {
      return {
        lat: res.LocationCoordinates.latitude,
        lng: res.LocationCoordinates.longitude,
      };
    }) || [];

  const center: LatLngExpression = [coordinates[0]?.lat, coordinates[0]?.lng];

  if (empRoutes)
    return (
      <Dialog
        opened={opened}
        setOpened={setOpened}
        title="Employee Route"
        size="100%"
        showBottomTool={false}
      >
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '70vh', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Routing geoPoints={coordinates} />
        </MapContainer>
      </Dialog>
    );
};

export default EmpRouteModal;
