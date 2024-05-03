import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IShiftsCollection } from '../../@types/database';
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

const ShiftView = () => {
  const { setShiftEditData } = useEditFormStore();

  const [searchParam] = useSearchParams();

  const shiftId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IShiftsCollection | null>(null);

  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);

  const [acknowledgedUsers, setAcknowledgedUsers] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!shiftId) return;
    DbShift?.getShiftById(shiftId).then(async (snapshot) => {
      const shiftData = snapshot.data() as IShiftsCollection;
      if (shiftData) {
        setData(shiftData);

        const { ShiftAssignedUserId, ShiftAcknowledgedByEmpId } = shiftData;

        await Promise.all(
          ShiftAssignedUserId.map(async (id) => {
            const empData = await DbEmployee.getEmpById(id);

            setAssignedUsers((prev) => {
              if (!prev.includes(empData.EmployeeName)) {
                return [...prev, empData.EmployeeName];
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
  }, [shiftId]);

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
        />
      </div>
    );
};

export default ShiftView;
