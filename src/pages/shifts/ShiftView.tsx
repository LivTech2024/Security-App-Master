import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IEmployeeRouteCollection,
  IShiftsCollection,
} from '../../@types/database';
import { useEditFormStore } from '../../store';
import { firebaseDataToObject } from '../../utilities/misc';
import { Shift } from '../../store/slice/editForm.slice';
import DbShift from '../../firebase_configs/DB/DbShift';
import NoSearchResult from '../../common/NoSearchResult';
import { PageRoutes } from '../../@types/enum';
import Button from '../../common/button/Button';
import ShiftViewCard from '../../component/shifts/ShiftViewCard';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import PageHeader from '../../common/PageHeader';
import ShiftPatrolCard from '../../component/shifts/ShiftPatrolCard';

const ShiftView = () => {
  const { setShiftEditData } = useEditFormStore();

  const [searchParam] = useSearchParams();

  const shiftId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IShiftsCollection | null>(null);

  const [assignedUsers, setAssignedUsers] = useState<
    { EmpName: string; EmpId: string }[]
  >([]);

  const [acknowledgedUsers, setAcknowledgedUsers] = useState<string[]>([]);

  const [empRoutes, setEmpRoutes] = useState<IEmployeeRouteCollection[]>([]);

  const navigate = useNavigate();

  const [shouldRefetch, setShouldRefetch] = useState(false);

  useEffect(() => {
    if (!shiftId) return;
    DbShift?.getShiftById(shiftId).then(async (snapshot) => {
      const shiftData = snapshot.data() as IShiftsCollection;
      if (shiftData) {
        setData(shiftData);

        const { ShiftAssignedUserId, ShiftAcknowledgedByEmpId, ShiftId } =
          shiftData;

        DbShift.getShiftEmpRoutes(ShiftId)
          .then((snap) => {
            const data = snap.docs.map(
              (doc) => doc.data() as IEmployeeRouteCollection
            );
            setEmpRoutes(data);
          })
          .catch((err) =>
            console.log(`Error while fetching employees route-> ${err}`)
          );

        await Promise.all(
          ShiftAssignedUserId.map(async (id) => {
            const empData = await DbEmployee.getEmpById(id);

            setAssignedUsers((prev) => {
              if (!prev.find((res) => res.EmpId === empData.EmployeeId)) {
                return [
                  ...prev,
                  { EmpName: empData.EmployeeName, EmpId: empData.EmployeeId },
                ];
              }
              return prev;
            });
          })
        );

        await Promise.all(
          ShiftAcknowledgedByEmpId.map(async (id) => {
            const empData = await DbEmployee.getEmpById(id);

            setAcknowledgedUsers((prev) => {
              if (!prev.includes(empData.EmployeeName)) {
                return [...prev, empData.EmployeeName];
              }
              return prev;
            });
          })
        );
      }
      setLoading(false);
    });
  }, [shiftId, shouldRefetch]);

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
        <PageHeader title="Shift data" />

        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Shift data"
          rightSection={
            <Button
              type="black"
              onClick={() => {
                setShiftEditData(
                  firebaseDataToObject(
                    data as unknown as Record<string, unknown>
                  ) as unknown as Shift
                );
                navigate(PageRoutes.SHIFT_CREATE_OR_EDIT);
              }}
              className="bg-primary text-surface px-4 py-2 rounded"
              label="Edit Shift"
            />
          }
        />

        <ShiftViewCard
          data={data}
          assignedUsers={assignedUsers}
          acknowledgedUsers={acknowledgedUsers}
          empRoutes={empRoutes}
          setShouldRefetch={setShouldRefetch}
        />
        <ShiftPatrolCard data={data} assignedUsers={assignedUsers} />
      </div>
    );
};

export default ShiftView;
