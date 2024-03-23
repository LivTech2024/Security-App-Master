import {
  DocumentData,
  GeoPoint,
  QueryConstraint,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { AddShiftFormFields } from "../../component/shifts/modal/AddShiftModal";
import { db } from "../config";
import { getNewDocId } from "./utils";
import { IShiftsCollection } from "../../@types/database";
import { removeTimeFromDate } from "../../utilities/misc";

class DbShift {
  static addShift = async (shiftData: AddShiftFormFields, cmpId: string) => {
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
      ShiftLocation: new GeoPoint(
        Number(shiftData.location.lat),
        Number(shiftData.location.lng)
      ),
      ShiftCurrentStatus: "pending",
      ShiftTask: [],
      ShiftAcknowledged: false,
      ShiftCompanyId: cmpId,
      ShiftAddress: shiftData.address,
      ShiftLocationName: shiftData.location_name,
      ShiftCreatedAt: serverTimestamp(),
      ShiftModifiedAt: serverTimestamp(),
    };

    return setDoc(shiftDocRef, newShift);
  };

  static updateShift = async (
    shiftData: AddShiftFormFields,
    shiftId: string,
    cmpId: string
  ) => {
    const shiftDocRef = doc(db, CollectionName.shifts, shiftId);

    const newShift: Partial<IShiftsCollection> = {
      ShiftName: shiftData.name,
      ShiftPosition: shiftData.position,
      ShiftDate: removeTimeFromDate(shiftData.date) as unknown as Timestamp,
      ShiftStartTime: shiftData.start_time,
      ShiftEndTime: shiftData.end_time,
      ShiftDescription: shiftData.description || null,
      ShiftTask: [],
      ShiftLocation: new GeoPoint(
        Number(shiftData.location.lat),
        Number(shiftData.location.lng)
      ),
      ShiftLocationName: shiftData.location_name,
      ShiftCompanyId: cmpId,
      ShiftAddress: shiftData.address,
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
    cmpId,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
    cmpId: string;
  }) => {
    const shiftRef = collection(db, CollectionName.shifts);

    let queryParams: QueryConstraint[] = [
      where("ShiftCompanyId", "==", cmpId),
      orderBy("ShiftDate", "desc"),
    ];
    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    const shiftQuery = query(shiftRef, ...queryParams);

    return getDocs(shiftQuery);
  };

  static changeShiftDate = (shiftId: string, newDate: Date) => {
    const docRef = doc(db, CollectionName.shifts, shiftId);

    return updateDoc(docRef, { ShiftDate: newDate as unknown as Timestamp });
  };
}

export default DbShift;
