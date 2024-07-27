import {
  QueryConstraint,
  Timestamp,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CollectionName } from '../../@types/enum';
import { db } from '../config';
import { IEmployeesCollection, IShiftsCollection } from '../../@types/database';
import dayjs from 'dayjs';
import { getHoursDiffInTwoTimeString, toDate } from '../../utilities/misc';

export interface ISchedule {
  shift: IShiftsCollection;
  employee: IEmployeesCollection[];
}

export interface IEmpScheduleForWeek {
  EmpId: string;
  EmpName: string;
  EmpImg: string | null;
  EmpRole: string;
  EmpPhone: string;
  EmpEmail: string;
  EmpWeekShifts: number;
  EmpWeekHours: number;
  EmpMaxWeekHours: number;
  EmpIsAvailable: boolean;
}

class DbSchedule {
  static getSchedules = async (
    startDate: Date,
    endDate: Date,
    cmpId: string,
    cmpBranchId?: string | null
  ) => {
    const schedules: ISchedule[] = [];

    const shiftDocRef = collection(db, CollectionName.shifts);
    let queryParams: QueryConstraint[] = [
      where('ShiftCompanyId', '==', cmpId),
      where('ShiftDate', '>=', startDate),
      where('ShiftDate', '<=', dayjs(endDate).endOf('day').toDate()),
    ];

    if (cmpBranchId && cmpBranchId.length > 0) {
      queryParams = [
        ...queryParams,
        where('ShiftCompanyBranchId', '==', cmpBranchId),
      ];
    }
    const shiftQuery = query(shiftDocRef, ...queryParams);

    const shiftSnapshot = await getDocs(shiftQuery);
    const shifts = shiftSnapshot.docs.map(
      (doc) => doc.data() as IShiftsCollection
    );

    const promise = shifts.map(async (shift) => {
      let schedule: ISchedule | null = null;
      const { ShiftAssignedUserId } = shift;

      schedule = { shift, employee: [] };

      const assignedEmps: IEmployeesCollection[] = [];

      if (ShiftAssignedUserId && ShiftAssignedUserId?.length > 0) {
        const empPromise = ShiftAssignedUserId.map(async (id) => {
          const empDocRef = doc(db, CollectionName.employees, id);
          const empSnapshot = await getDoc(empDocRef);
          const empData = empSnapshot.data() as IEmployeesCollection;
          if (empData) {
            assignedEmps.push(empData);
          }
        });

        await Promise.all(empPromise);

        schedule = { ...schedule, employee: assignedEmps };
      }

      schedules.push({ shift: schedule.shift, employee: schedule.employee });
    });

    await Promise.all(promise);

    return schedules;
  };

  static getEmployeesSchedule = async ({
    currentDate,
    empRole,
    endDate,
    startDate,
    cmpId,
    cmpBranchId,
  }: {
    startDate: Date;
    endDate: Date;
    currentDate: Date;
    empRole?: string;
    cmpId: string;
    cmpBranchId?: string | null;
  }) => {
    try {
      const employeesScheduleForWeek: IEmpScheduleForWeek[] = [];

      const empRef = collection(db, CollectionName.employees);
      let queryParams: QueryConstraint[] = [
        where('EmployeeCompanyId', '==', cmpId),
        where('EmployeeIsBanned', '==', false),
      ];
      if (empRole) {
        queryParams = [...queryParams, where('EmployeeRole', '==', empRole)];
      }
      if (cmpBranchId && cmpBranchId.length > 0) {
        queryParams = [
          ...queryParams,
          where('EmployeeCompanyBranchId', '==', cmpBranchId),
        ];
      }
      const empQuery = query(empRef, ...queryParams);
      const empSnapshot = await getDocs(empQuery);
      const employees = empSnapshot.docs.map(
        (doc) => doc.data() as IEmployeesCollection
      );

      const promise = employees
        .filter((emp) => emp.EmployeeStatus === 'on_board')
        .map(async (emp) => {
          const shiftRef = collection(db, CollectionName.shifts);
          const shiftQuery = query(
            shiftRef,
            where('ShiftDate', '>=', startDate),
            where('ShiftDate', '<=', endDate),
            where('ShiftAssignedUserId', 'array-contains', emp.EmployeeId)
          );
          const shiftSnapshot = await getDocs(shiftQuery);
          const shifts = shiftSnapshot.docs.map(
            (doc) => doc.data() as IShiftsCollection
          );

          // Calculate total work hours for the week
          const totalWorkHours = shifts.reduce((totalHours, shift) => {
            const shiftHours = getHoursDiffInTwoTimeString(
              shift.ShiftStartTime,
              shift.ShiftEndTime
            );
            return totalHours + shiftHours;
          }, 0);

          employeesScheduleForWeek.push({
            EmpId: emp.EmployeeId,
            EmpName: emp.EmployeeName,
            EmpImg: emp.EmployeeImg,
            EmpPhone: emp.EmployeePhone,
            EmpEmail: emp.EmployeeEmail,
            EmpWeekShifts: shifts.length,
            EmpIsAvailable:
              shifts.some((s) =>
                dayjs(toDate(s.ShiftDate)).isSame(currentDate, 'date')
              ) || emp.EmployeeIsAvailable !== 'available'
                ? false
                : true,
            EmpWeekHours: totalWorkHours,
            EmpMaxWeekHours: emp.EmployeeMaxHrsPerWeek,
            EmpRole: emp.EmployeeRole,
          });
        });

      await Promise.all(promise);

      return employeesScheduleForWeek;
    } catch (error) {
      console.log(error);
    }
  };

  static assignShiftToEmp = async (shiftId: string, empId: string[]) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);

    return updateDoc(shiftRef, { ShiftAssignedUserId: arrayUnion(...empId) });
  };

  static removeEmpFromShift = async (
    shiftId: string,
    empIdToBeRemoved: string
  ) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(shiftRef);
      const shiftData = snapshot.data() as IShiftsCollection;

      const { ShiftAssignedUserId, ShiftCurrentStatus } = shiftData;

      const updatedShiftAssignedUserId = ShiftAssignedUserId.filter(
        (id) => id !== empIdToBeRemoved
      );

      const updatedShiftCurrentStatus = [...ShiftCurrentStatus];

      const index = updatedShiftCurrentStatus.findIndex(
        (s) => s?.StatusReportedById === empIdToBeRemoved
      );

      if (index !== -1) {
        const statusToBeUpdated = updatedShiftCurrentStatus[index];

        if (statusToBeUpdated?.Status === 'started') {
          updatedShiftCurrentStatus[index] = {
            ...statusToBeUpdated,
            Status: 'completed',
            StatusEndReason: 'Removed from shift by admin',
            StatusReportedTime: Timestamp.now(),
          };
        }
      }

      transaction.update(shiftRef, {
        ShiftAssignedUserId: updatedShiftAssignedUserId,
        ShiftCurrentStatus: updatedShiftCurrentStatus,
      });
    });
  };
}

export default DbSchedule;
