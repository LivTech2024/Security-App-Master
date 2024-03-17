import {
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
import {
  IEmployeesCollection,
  IShiftsCollection,
  ShiftPositions,
} from "../../@types/database";
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
  EmpWeekShifts: number;
  EmpWeekHours: number;
  EmpIsAvailable: boolean;
}

class DbSchedule {
  static getScheduleForCalendarView = async (
    startDate: Date,
    endDate: Date
  ) => {
    const schedules: ISchedule[] = [];

    const shiftDocRef = collection(db, CollectionName.shifts);
    const shiftQuery = query(
      shiftDocRef,
      where("ShiftDate", ">=", startDate),
      where("ShiftDate", "<=", endDate)
    );

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

  static getEmployeesSchedule = async (
    startDate: Date,
    endDate: Date,
    currentDate: Date,
    empRole: ShiftPositions
  ) => {
    try {
      const employeesScheduleForWeek: IEmpScheduleForWeek[] = [];

      const empRef = collection(db, CollectionName.employees);
      const empQuery = query(empRef, where("EmployeeRole", "==", empRole));
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
          const [startHour, startMinute] =
            shift.ShiftStartTime.split(":").map(Number);
          const [endHour, endMinute] =
            shift.ShiftEndTime.split(":").map(Number);

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
          EmpWeekShifts: shifts.length,
          EmpIsAvailable: shifts.some((s) =>
            dayjs(toDate(s.ShiftDate)).isSame(currentDate, "date")
          )
            ? false
            : true,
          EmpWeekHours: 7,
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
