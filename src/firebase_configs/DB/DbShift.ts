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
import { db } from "../config";
import { getNewDocId } from "./utils";
import { IShiftsCollection } from "../../@types/database";
import { removeTimeFromDate } from "../../utilities/misc";
import { AddShiftFormFields } from "../../utilities/zod/schema";

class DbShift {
  static addShift = async (shiftData: AddShiftFormFields, cmpId: string) => {
    const shiftId = getNewDocId(CollectionName.shifts);
    const shiftDocRef = doc(db, CollectionName.shifts, shiftId);

    const newShift: IShiftsCollection = {
      ShiftId: shiftId,
      ShiftName: shiftData.ShiftName,
      ShiftPosition: shiftData.ShiftPosition,
      ShiftDate: removeTimeFromDate(
        shiftData.ShiftDate
      ) as unknown as Timestamp,
      ShiftStartTime: shiftData.ShiftStartTime,
      ShiftEndTime: shiftData.ShiftEndTime,
      ShiftDescription: shiftData.ShiftDescription || null,
      ShiftAssignedUserId: null,
      ShiftLocation: new GeoPoint(
        Number(shiftData.ShiftLocation.lat),
        Number(shiftData.ShiftLocation.lng)
      ),
      ShiftCurrentStatus: "pending",
      ShiftTask: [],
      ShiftCompanyBranchId: shiftData.ShiftCompanyBranchId,
      ShiftAcknowledged: false,
      ShiftCompanyId: cmpId,
      ShiftAddress: shiftData.ShiftAddress,
      ShiftLocationName: shiftData.ShiftLocationName,
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
      ShiftName: shiftData.ShiftName,
      ShiftPosition: shiftData.ShiftPosition,
      ShiftDate: removeTimeFromDate(
        shiftData.ShiftDate
      ) as unknown as Timestamp,
      ShiftStartTime: shiftData.ShiftStartTime,
      ShiftEndTime: shiftData.ShiftEndTime,
      ShiftDescription: shiftData.ShiftDescription || null,
      ShiftTask: [],
      ShiftLocation: new GeoPoint(
        Number(shiftData.ShiftLocation.lat),
        Number(shiftData.ShiftLocation.lng)
      ),
      ShiftLocationName: shiftData.ShiftLocationName,
      ShiftCompanyId: cmpId,
      ShiftAddress: shiftData.ShiftAddress,
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
