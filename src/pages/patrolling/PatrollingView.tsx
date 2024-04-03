import { useNavigate, useSearchParams } from "react-router-dom";
import PatrolViewCard from "../../component/patrolling/PatrolViewCard";
import { useEffect, useState } from "react";
import DbPatrol from "../../firebase_configs/DB/DbPatrol";
import { IPatrolsCollection, IShiftsCollection } from "../../@types/database";
import NoSearchResult from "../../common/NoSearchResult";
import { errorHandler } from "../../utilities/CustomError";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import { openContextModal } from "@mantine/modals";
import { PageRoutes } from "../../@types/enum";
import DbEmployee from "../../firebase_configs/DB/DbEmployee";

const PatrollingView = () => {
  const [searchParam] = useSearchParams();

  const patrolId = searchParam.get("id");

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IPatrolsCollection | null>(null);

  const [assignedGuards, setAssignedGuards] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatrolData = async () => {
      if (!patrolId) return;
      try {
        const patrolSnapshot = await DbPatrol.getPatrolById(patrolId);
        const patrolData = patrolSnapshot.data() as IPatrolsCollection;

        if (patrolData) {
          setData(patrolData);
          const { PatrolLocationId } = patrolData;

          const shiftSnapshot = await DbPatrol.getAssignedGuardOfPatrol(
            PatrolLocationId
          );
          const shiftData = shiftSnapshot?.docs[0]?.data() as IShiftsCollection;

          if (shiftData) {
            const { ShiftAssignedUserId } = shiftData;
            const promise = ShiftAssignedUserId.map(async (empId) => {
              const emp = await DbEmployee.getEmpById(empId);
              setAssignedGuards((prev) => {
                if (prev.find((p) => p === emp.EmployeeName)) {
                  return prev;
                }
                return [...prev, emp.EmployeeName];
              });
            });

            await Promise.all(promise);
          }
        }

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchPatrolData();
  }, [patrolId]);

  const deletePatrol = async () => {
    if (!patrolId) return;
    try {
      showModalLoader({});

      await DbPatrol.deletePatrol(patrolId);
      showSnackbar({ message: "Patrol deleted successfully", type: "success" });
      closeModalLoader();
      navigate(PageRoutes.PATROLLING_LIST);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

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
          <span className="font-semibold text-xl">Patrolling data</span>

          <button
            onClick={() => {
              openContextModal({
                modal: "confirmModal",
                withCloseButton: false,
                centered: true,
                closeOnClickOutside: true,
                innerProps: {
                  title: "Confirm",
                  body: "Are you sure to delete this patrol",
                  onConfirm: () => {
                    deletePatrol();
                  },
                },
                size: "30%",
                styles: {
                  body: { padding: "0px" },
                },
              });
            }}
            className="bg-primary text-surface px-4 py-2 rounded"
          >
            Delete
          </button>
        </div>
        <PatrolViewCard patrolData={data} assignedGuards={assignedGuards} />
      </div>
    );
  }
};

export default PatrollingView;
