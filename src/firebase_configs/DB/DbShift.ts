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
import { IShiftTasksChild, IShiftsCollection } from "../../@types/database";
import { removeTimeFromDate } from "../../utilities/misc";
import { AddShiftFormFields } from "../../utilities/zod/schema";
import { ShiftTask } from "../../component/shifts/ShiftTaskForm";
import { generateBarcodesAndDownloadPDF } from "../../utilities/generateBarcodesAndDownloadPdf";

class DbShift {
  static addShift = async (
    shiftData: AddShiftFormFields,
    cmpId: string,
    tasks: ShiftTask[]
  ) => {
    const shiftId = getNewDocId(CollectionName.shifts);
    const shiftDocRef = doc(db, CollectionName.shifts, shiftId);

    const shiftTasks: IShiftTasksChild[] = [];

    tasks.map((task, idx) => {
      if (task.TaskName && task.TaskName.length > 0) {
        shiftTasks.push({
          ShiftTaskId: `${shiftId}${idx}`,
          ShiftTask: task.TaskName,
          ShiftTaskQrCodeReq: task.TaskQrCodeRequired,
        });
      }
    });

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
      ShiftAssignedUserId: [],
      ShiftRequiredEmp: Number(shiftData.ShiftRequiredEmp),
      ShiftLocation: new GeoPoint(
        Number(shiftData.ShiftLocation.lat),
        Number(shiftData.ShiftLocation.lng)
      ),
      ShiftClientId: shiftData.ShiftClientId,
      ShiftRestrictedRadius: Number(shiftData.ShiftRestrictedRadius),
      ShiftCurrentStatus: "pending",
      ShiftTask: shiftTasks,
      ShiftCompanyBranchId: shiftData.ShiftCompanyBranchId,
      ShiftAcknowledged: false,
      ShiftCompanyId: cmpId,
      ShiftAddress: shiftData.ShiftAddress,
      ShiftLocationName: shiftData.ShiftLocationName,
      ShiftCreatedAt: serverTimestamp(),
      ShiftModifiedAt: serverTimestamp(),
    };

    await setDoc(shiftDocRef, newShift);

    const barcodesToBeGenerated = shiftTasks.filter(
      (t) => t.ShiftTaskQrCodeReq
    );

    if (barcodesToBeGenerated.length > 0) {
      await generateBarcodesAndDownloadPDF(
        barcodesToBeGenerated.map((task) => {
          return { code: task.ShiftTaskId, label: task.ShiftTask };
        })
      );
    }
  };

  static updateShift = async (
    shiftData: AddShiftFormFields,
    shiftId: string,
    cmpId: string,
    tasks: ShiftTask[]
  ) => {
    const shiftDocRef = doc(db, CollectionName.shifts, shiftId);

    const shiftTasks: IShiftTasksChild[] = [];

    tasks.map((task, idx) => {
      if (task.TaskName && task.TaskName.length > 0) {
        shiftTasks.push({
          ShiftTaskId: `${shiftId}${idx}`,
          ShiftTask: task.TaskName,
          ShiftTaskQrCodeReq: task.TaskQrCodeRequired,
        });
      }
    });

    const newShift: Partial<IShiftsCollection> = {
      ShiftName: shiftData.ShiftName,
      ShiftPosition: shiftData.ShiftPosition,
      ShiftDate: removeTimeFromDate(
        shiftData.ShiftDate
      ) as unknown as Timestamp,
      ShiftStartTime: shiftData.ShiftStartTime,
      ShiftEndTime: shiftData.ShiftEndTime,
      ShiftDescription: shiftData.ShiftDescription || null,
      ShiftTask: shiftTasks,
      ShiftLocation: new GeoPoint(
        Number(shiftData.ShiftLocation.lat),
        Number(shiftData.ShiftLocation.lng)
      ),
      ShiftLocationName: shiftData.ShiftLocationName,
      ShiftClientId: shiftData.ShiftClientId,
      ShiftRestrictedRadius: Number(shiftData.ShiftRestrictedRadius),
      ShiftCompanyId: cmpId,
      ShiftAddress: shiftData.ShiftAddress,
      ShiftRequiredEmp: Number(shiftData.ShiftRequiredEmp),
      ShiftModifiedAt: serverTimestamp(),
    };

    await updateDoc(shiftDocRef, newShift);

    const barcodesToBeGenerated = shiftTasks.filter(
      (t) => t.ShiftTaskQrCodeReq
    );

    if (barcodesToBeGenerated.length > 0) {
      await generateBarcodesAndDownloadPDF(
        barcodesToBeGenerated.map((task) => {
          return { code: task.ShiftTaskId, label: task.ShiftTask };
        })
      );
    }
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
