import { useEffect, useState } from "react";
import { useAuthState } from "../../store";
import { IIncidentsCollection } from "../../@types/database";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase_configs/config";
import { CollectionName } from "../../@types/enum";
import dayjs from "dayjs";

const useListenIncidents = () => {
  const { company } = useAuthState();

  const [incident, setIncident] = useState<IIncidentsCollection | null>(null);

  useEffect(() => {
    if (!company) return;
    const incidentRef = collection(db, CollectionName.incident);
    const incidentQuery = query(
      incidentRef,
      where("IncidentCompanyId", "==", company.CompanyId),
      where(
        "IncidentUpdatedAt",
        ">=",
        dayjs(new Date()).subtract(1, "hour").toDate()
      ),
      limit(1)
    );

    const unsubscribe = onSnapshot(incidentQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot?.docs[0]?.data() as IIncidentsCollection;
        setIncident(data);
      }
    });

    return () => unsubscribe();
  }, [company]);

  return { incident };
};

export default useListenIncidents;
