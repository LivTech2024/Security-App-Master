import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { db } from "../config";
import { IEmployeesCollection, IShiftsCollection } from "../../@types/database";

export interface ISchedule {
  shift: IShiftsCollection;
  employee: IEmployeesCollection | null;
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
}

export default DbSchedule;
