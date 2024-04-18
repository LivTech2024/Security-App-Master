import { useNavigate, useSearchParams } from "react-router-dom";
import NoSearchResult from "../../../common/NoSearchResult";
import PatrolViewCard from "../../../component/patrolling/PatrolViewCard";
import { useEffect, useState } from "react";
import DbPatrol from "../../../firebase_configs/DB/DbPatrol";
import { IPatrolsCollection } from "../../../@types/database";
import { IoArrowBackCircle } from "react-icons/io5";

const ClientPatrolView = () => {
  const navigate = useNavigate();

  const [searchParam] = useSearchParams();

  const patrolId = searchParam.get("id");

  const [isPatrolLoading, setIsPatrolLoading] = useState(true);

  const [data, setData] = useState<IPatrolsCollection | null>(null);

  useEffect(() => {
    const fetchPatrolData = async () => {
      if (!patrolId) return;
      try {
        const patrolSnapshot = await DbPatrol.getPatrolById(patrolId);
        const patrolData = patrolSnapshot.data() as IPatrolsCollection;

        setData(patrolData);

        setIsPatrolLoading(false);
      } catch (error) {
        console.log(error);
        setIsPatrolLoading(false);
      }
    };

    fetchPatrolData();
  }, [patrolId]);

  if (!data && !isPatrolLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (isPatrolLoading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 animate-pulse">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <span className="font-semibold text-xl">Patrolling data</span>
        </div>
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Patrol data</div>
          </div>
        </div>
        <PatrolViewCard patrolData={data} />
      </div>
    );
  }
};

export default ClientPatrolView;
