import { useSearchParams } from "react-router-dom";
import PatrolViewCard from "../../component/patrolling/PatrolViewCard";
import { useEffect, useState } from "react";
import DbPatrol from "../../firebase_configs/DB/DbPatrol";
import { IPatrolsCollection } from "../../@types/database";
import NoSearchResult from "../../common/NoSearchResult";

const PatrollingView = () => {
  const [searchParam] = useSearchParams();

  const patrolId = searchParam.get("id");

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IPatrolsCollection | null>(null);

  useEffect(() => {
    if (!patrolId) return;
    DbPatrol.getPatrolById(patrolId)
      .then((snapshot) => {
        const patrolData = snapshot.data() as IPatrolsCollection;
        setData(patrolData);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, [patrolId]);

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 animate-pulse">
        <div className="text-2xl font-bold mb-4">Patrolling Data</div>
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="text-2xl font-bold mb-4">Patrolling Data</div>
        <PatrolViewCard patrolData={data} />
      </div>
    );
  }
};

export default PatrollingView;
