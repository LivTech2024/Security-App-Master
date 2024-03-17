import {
  DocumentData,
  QueryConstraint,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { AddShiftFormFields } from "../../component/shifts/modal/AddShiftModal";
import { db } from "../config";
import { getNewDocId } from "./utils";
import { IShiftsCollection } from "../../@types/database";
import { removeTimeFromDate } from "../../utilities/misc";

class DbShift {
  static addShift = async (shiftData: AddShiftFormFields) => {
    const shiftId = getNewDocId(CollectionName.shifts);
    const shiftDocRef = doc(db, CollectionName.shifts, shiftId);

    const newShift: IShiftsCollection = {
      ShiftId: shiftId,
      ShiftName: shiftData.name,
      ShiftPosition: shiftData.position,
      ShiftDate: removeTimeFromDate(shiftData.date) as unknown as Timestamp,
      ShiftStartTime: shiftData.start_time,
      ShiftEndTime: shiftData.end_time,
      ShiftDescription: shiftData.description || null,
      ShiftAssignedUserId: null,
      ShiftLocation: shiftData.location,
      ShiftCreatedAt: serverTimestamp(),
      ShiftModifiedAt: serverTimestamp(),
    };

    return setDoc(shiftDocRef, newShift);
  };

  static updateShift = async (
    shiftData: AddShiftFormFields,
    shiftId: string
  ) => {
    const shiftDocRef = doc(db, CollectionName.shifts, shiftId);

    const newShift: Partial<IShiftsCollection> = {
      ShiftName: shiftData.name,
      ShiftPosition: shiftData.position,
      ShiftDate: removeTimeFromDate(shiftData.date) as unknown as Timestamp,
      ShiftStartTime: shiftData.start_time,
      ShiftEndTime: shiftData.end_time,
      ShiftDescription: shiftData.description || null,
      ShiftLocation: shiftData.location,
      ShiftModifiedAt: serverTimestamp(),
    };

    return updateDoc(shiftDocRef, newShift);
  };

  static deleteShift = (shiftId: string) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);
    return deleteDoc(shiftRef);
  };

  static getShifts = ({
    lmt,
    lastDoc,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
  }) => {
    const shiftRef = collection(db, CollectionName.shifts);

    let queryParams: QueryConstraint[] = [];
    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    const shiftQuery = query(shiftRef, ...queryParams);

    return getDocs(shiftQuery);
  };
}

export default DbShift;
