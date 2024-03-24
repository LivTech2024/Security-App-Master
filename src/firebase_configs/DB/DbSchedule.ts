import {
  QueryConstraint,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { db } from "../config";
import { IEmployeesCollection, IShiftsCollection } from "../../@types/database";
import dayjs from "dayjs";
import { toDate } from "../../utilities/misc";

export interface ISchedule {
  shift: IShiftsCollection;
  employee: IEmployeesCollection | null;
}

export interface IEmpScheduleForWeek {
  EmpId: string;
  EmpName: string;
  EmpPhone: string;
  EmpEmail: string;
  EmpWeekShifts: number;
  EmpWeekHours: number;
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
      where("ShiftCompanyId", "==", cmpId),
      where("ShiftDate", ">=", startDate),
      where("ShiftDate", "<=", endDate),
    ];

    if (cmpBranchId && cmpBranchId.length > 0) {
      console.log(cmpBranchId, "inside story");
      queryParams = [
        ...queryParams,
        where("ShiftCompanyBranchId", "==", cmpBranchId),
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

      schedule = { shift, employee: null };

      if (ShiftAssignedUserId) {
        const empDocRef = doc(
          db,
          CollectionName.employees,
          ShiftAssignedUserId
        );
        const empSnapshot = await getDoc(empDocRef);
        const empData = empSnapshot.data() as IEmployeesCollection;
        schedule = { ...schedule, employee: empData };
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
    empRole: string;
    cmpId: string;
    cmpBranchId?: string | null;
  }) => {
    try {
      const employeesScheduleForWeek: IEmpScheduleForWeek[] = [];

      const empRef = collection(db, CollectionName.employees);
      let queryParams: QueryConstraint[] = [
        where("EmployeeCompanyId", "==", cmpId),
        where("EmployeeRole", "==", empRole),
      ];
      if (cmpBranchId && cmpBranchId.length > 0) {
        queryParams = [
          ...queryParams,
          where("EmployeeCompanyBranchId", "==", cmpBranchId),
        ];
      }
      const empQuery = query(empRef, ...queryParams);
      const empSnapshot = await getDocs(empQuery);
      const employees = empSnapshot.docs.map(
        (doc) => doc.data() as IEmployeesCollection
      );

      const promise = employees.map(async (emp) => {
        const shiftRef = collection(db, CollectionName.shifts);
        const shiftQuery = query(
          shiftRef,
          where("ShiftDate", ">=", startDate),
          where("ShiftDate", "<=", endDate),
          where("ShiftAssignedUserId", "==", emp.EmployeeId)
        );
        const shiftSnapshot = await getDocs(shiftQuery);
        const shifts = shiftSnapshot.docs.map(
          (doc) => doc.data() as IShiftsCollection
        );

        // Calculate total work hours for the week
        const totalWorkHours = shifts.reduce((totalHours, shift) => {
          const [startHourStr, startMinuteStr] =
            shift.ShiftStartTime.split(":");
          const [endHourStr, endMinuteStr] = shift.ShiftEndTime.split(":");

          // Parse start and end times to integers
          let startHour = parseInt(startHourStr, 10);
          const startMinute = parseInt(startMinuteStr, 10);
          let endHour = parseInt(endHourStr, 10);
          const endMinute = parseInt(endMinuteStr, 10);

          // Adjust hours for PM times
          if (shift.ShiftStartTime.includes("PM") && startHour !== 12) {
            startHour += 12;
          }
          if (shift.ShiftEndTime.includes("PM") && endHour !== 12) {
            endHour += 12;
          }

          // Calculate shift duration in hours
          const startDateTime = dayjs(toDate(shift.ShiftDate))
            .hour(startHour)
            .minute(startMinute);
          const endDateTime = dayjs(toDate(shift.ShiftDate))
            .hour(endHour)
            .minute(endMinute);
          const shiftHours = endDateTime.diff(startDateTime, "hour", true);

          return totalHours + shiftHours;
        }, 0);

        employeesScheduleForWeek.push({
          EmpId: emp.EmployeeId,
          EmpName: emp.EmployeeName,
          EmpPhone: emp.EmployeePhone,
          EmpEmail: emp.EmployeeEmail,
          EmpWeekShifts: shifts.length,
          EmpIsAvailable: shifts.some((s) =>
            dayjs(toDate(s.ShiftDate)).isSame(currentDate, "date")
          )
            ? false
            : true,
          EmpWeekHours: totalWorkHours,
        });
      });

      await Promise.all(promise);

      return employeesScheduleForWeek;
    } catch (error) {
      console.log(error);
    }
  };

  static assignShiftToEmp = async (shiftId: string, empId: string) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);

    return updateDoc(shiftRef, { ShiftAssignedUserId: empId });
  };
}

export default DbSchedule;
