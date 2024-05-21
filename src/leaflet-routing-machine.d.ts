/* eslint-disable @typescript-eslint/no-explicit-any */
import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Routing {
    function control(options: any): any;
    class Control extends L.Control {
      constructor(options?: any);
      getWaypoints(): L.LatLng[];
      setWaypoints(waypoints: L.LatLng[]): this;
    }
  }
}
