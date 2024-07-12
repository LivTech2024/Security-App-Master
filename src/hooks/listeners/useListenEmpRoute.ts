import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase_configs/config';
import { CollectionName } from '../../@types/enum';
import { IEmployeeRouteCollection } from '../../@types/database';

const useListenEmpRoute = (empRouteId: string) => {
  const [empRoutes, setEmpRoutes] = useState<IEmployeeRouteCollection | null>(
    null
  );

  useEffect(() => {
    if (!empRouteId) return;
    const empRouteRef = doc(db, CollectionName.employeeRoutes, empRouteId);

    const unsubscribe = onSnapshot(empRouteRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot?.data() as IEmployeeRouteCollection;
        setEmpRoutes(data);
      }
    });

    return () => unsubscribe();
  }, [empRouteId]);

  return { empRoutes };
};

export default useListenEmpRoute;
