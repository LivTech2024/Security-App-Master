import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IShiftsCollection } from '../../@types/database';
import { useEditFormStore } from '../../store';
import { firebaseDataToObject } from '../../utilities/misc';
import { Shift } from '../../store/slice/editForm.slice';
import DbShift from '../../firebase_configs/DB/DbShift';
import NoSearchResult from '../../common/NoSearchResult';
import { PageRoutes } from '../../@types/enum';
import { IoArrowBackCircle } from 'react-icons/io5';
import Button from '../../common/button/Button';
import ShiftViewCard from '../../component/shifts/ShiftViewCard';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';

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
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Shift data</div>
          </div>
        </div>
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold  items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Shift data</div>
          </div>
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
        </div>

        <ShiftViewCard
          data={data}
          assignedUsers={assignedUsers}
          acknowledgedUsers={acknowledgedUsers}
        />
      </div>
    );
};

export default ShiftView;
