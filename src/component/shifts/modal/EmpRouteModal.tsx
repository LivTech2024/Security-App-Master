import Dialog from '../../../common/Dialog';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Routing } from '../../../utilities/Routing';
import { LatLngExpression } from 'leaflet';

interface EmpRouteModalProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  coordinates: { lat: number; lng: number }[];
}

const EmpRouteModal = ({
  opened,
  setOpened,
  coordinates,
}: EmpRouteModalProps) => {
  const center: LatLngExpression = [coordinates[0]?.lat, coordinates[0]?.lng];
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
