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
  runTransaction,
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
import CustomError from "../../utilities/CustomError";

class DbShift {
  static addShift = async (
    shiftData: AddShiftFormFields,
    cmpId: string,
    tasks: ShiftTask[],
    selectedDays: Date[]
  ) => {
    const shiftTasks: IShiftTasksChild[] = [];

    const shiftCreatePromise = selectedDays.map(async (day) => {
      const shiftId = getNewDocId(CollectionName.shifts);
      const shiftDocRef = doc(db, CollectionName.shifts, shiftId);

      tasks.map((task, idx) => {
        if (task.TaskName && task.TaskName.length > 0) {
          shiftTasks.push({
            ShiftTaskId: `${shiftId}${idx}`,
            ShiftTask: task.TaskName,
            ShiftTaskQrCodeReq: task.TaskQrCodeRequired,
            ShiftTaskReturnReq: task.TaskReturnReq,
            ShiftTaskStatus: [],
          });
        }
      });

      const newShift: IShiftsCollection = {
        ShiftId: shiftId,
        ShiftName: shiftData.ShiftName,
        ShiftPosition: shiftData.ShiftPosition,
        ShiftDate: removeTimeFromDate(day) as unknown as Timestamp,
        ShiftStartTime: shiftData.ShiftStartTime,
        ShiftEndTime: shiftData.ShiftEndTime,
        ShiftDescription: shiftData.ShiftDescription || null,
        ShiftAssignedUserId: shiftData.ShiftAssignedUserId,
        ShiftRequiredEmp: Number(shiftData.ShiftRequiredEmp),
        ShiftLocation: new GeoPoint(
          Number(shiftData.ShiftLocation.latitude),
          Number(shiftData.ShiftLocation.longitude)
        ),
        ShiftGuardWellnessReport: [],
        ShiftPhotoUploadIntervalInMinutes:
          shiftData.ShiftPhotoUploadIntervalInMinutes,
        ShiftClientId: shiftData.ShiftClientId,
        ShiftRestrictedRadius: Number(shiftData.ShiftRestrictedRadius),
        ShiftCurrentStatus: [],
        ShiftTask: shiftTasks,
        ShiftCompanyBranchId: shiftData.ShiftCompanyBranchId,
        ShiftAcknowledgedByEmpId: [],
        ShiftCompanyId: cmpId,
        ShiftLocationId: shiftData.ShiftLocationId,
        ShiftLocationAddress: shiftData.ShiftLocationAddress,
        ShiftLocationName: shiftData.ShiftLocationName,
        ShiftEnableRestrictedRadius: shiftData.ShiftEnableRestrictedRadius,
        ShiftCreatedAt: serverTimestamp(),
        ShiftModifiedAt: serverTimestamp(),
      };

      return setDoc(shiftDocRef, newShift);
    });

    await Promise.all(shiftCreatePromise);

    const barcodesToBeGenerated = shiftTasks.filter(
      (t) => t.ShiftTaskQrCodeReq
    );

    if (barcodesToBeGenerated.length > 0) {
      await generateBarcodesAndDownloadPDF(
        shiftData.ShiftName,
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
    tasks: ShiftTask[],
    shiftDate: Date
  ) => {
    await runTransaction(db, async (transaction) => {
      const shiftDocRef = doc(db, CollectionName.shifts, shiftId);
      const shiftSnapshot = await transaction.get(shiftDocRef);
      const oldShiftData = shiftSnapshot.data() as IShiftsCollection;

      if (oldShiftData.ShiftAssignedUserId?.length > 0) {
        throw new CustomError(
          "Cannot edit this shift as it already have assigned employees"
        );
      }

      const shiftTasks: IShiftTasksChild[] = [];

      tasks.map((task, idx) => {
        if (task.TaskName && task.TaskName.length > 0) {
          shiftTasks.push({
            ShiftTaskId: `${shiftId}${idx}`,
            ShiftTask: task.TaskName,
            ShiftTaskQrCodeReq: task.TaskQrCodeRequired,
            ShiftTaskReturnReq: task.TaskReturnReq,
            ShiftTaskStatus: [],
          });
        }
      });

      const newShift: Partial<IShiftsCollection> = {
        ShiftName: shiftData.ShiftName,
        ShiftPosition: shiftData.ShiftPosition,
        ShiftDate: removeTimeFromDate(shiftDate) as unknown as Timestamp,
        ShiftStartTime: shiftData.ShiftStartTime,
        ShiftEndTime: shiftData.ShiftEndTime,
        ShiftDescription: shiftData.ShiftDescription || null,
        ShiftTask: shiftTasks,
        ShiftLocation: new GeoPoint(
          Number(shiftData.ShiftLocation.latitude),
          Number(shiftData.ShiftLocation.longitude)
        ),
        ShiftPhotoUploadIntervalInMinutes:
          shiftData.ShiftPhotoUploadIntervalInMinutes,
        ShiftEnableRestrictedRadius: shiftData.ShiftEnableRestrictedRadius,
        ShiftLocationName: shiftData.ShiftLocationName,
        ShiftClientId: shiftData.ShiftClientId,
        ShiftRestrictedRadius: Number(shiftData.ShiftRestrictedRadius),
        ShiftCompanyId: cmpId,
        ShiftLocationId: shiftData.ShiftLocationId,
        ShiftLocationAddress: shiftData.ShiftLocationAddress,
        ShiftRequiredEmp: Number(shiftData.ShiftRequiredEmp),
        ShiftModifiedAt: serverTimestamp(),
      };

      transaction.update(shiftDocRef, newShift);

      const barcodesToBeGenerated = shiftTasks.filter(
        (t) => t.ShiftTaskQrCodeReq
      );

      if (barcodesToBeGenerated.length > 0) {
        await generateBarcodesAndDownloadPDF(
          shiftData.ShiftName,
          barcodesToBeGenerated.map((task) => {
            return { code: task.ShiftTaskId, label: task.ShiftTask };
          })
        );
      }
    });
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
