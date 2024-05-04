import {
  DocumentData,
  GeoPoint,
  QueryConstraint,
  Timestamp,
  collection,
  doc,
  getDoc,
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
} from 'firebase/firestore';
import { CollectionName } from '../../@types/enum';
import { db } from '../config';
import CloudStorageImageHandler, { getNewDocId } from './utils';
import { IShiftTasksChild, IShiftsCollection } from '../../@types/database';
import { getRandomNumbers, removeTimeFromDate } from '../../utilities/misc';
import { AddShiftFormFields } from '../../utilities/zod/schema';
import { ShiftTask } from '../../component/shifts/ShiftTaskForm';
import { generateBarcodesAndDownloadPDF } from '../../utilities/pdf/generateBarcodesAndDownloadPdf';

class DbShift {
  static addShift = async (
    shiftData: AddShiftFormFields,
    cmpId: string,
    tasks: ShiftTask[],
    selectedDays: Date[]
  ) => {
    let shiftTasks: IShiftTasksChild[] = [];

    const shiftCreatePromise = selectedDays.map(async (day) => {
      const shiftId = getNewDocId(CollectionName.shifts);
      const shiftDocRef = doc(db, CollectionName.shifts, shiftId);
      shiftTasks = [];
      tasks.map((task, idx) => {
        if (task.TaskName && task.TaskName.length > 0) {
          const random = getRandomNumbers();
          const shiftTaskId = `${shiftId}${random}${idx}`;

          shiftTasks.push({
            ShiftTaskId: shiftTaskId,
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
        ShiftAssignedUserId: shiftData.ShiftAssignedUserId || [],
        ShiftRequiredEmp: Number(shiftData.ShiftRequiredEmp),
        ShiftLocation: shiftData.ShiftLocation
          ? new GeoPoint(
              Number(shiftData.ShiftLocation.latitude),
              Number(shiftData.ShiftLocation.longitude)
            )
          : null,
        ShiftGuardWellnessReport: [],
        ShiftPhotoUploadIntervalInMinutes:
          shiftData.ShiftPhotoUploadIntervalInMinutes,
        ShiftClientId: shiftData.ShiftClientId ?? null,
        ShiftRestrictedRadius: shiftData.ShiftRestrictedRadius || null,
        ShiftCurrentStatus: [],
        ShiftTask: shiftTasks,
        ShiftCompanyBranchId: shiftData.ShiftCompanyBranchId,
        ShiftAcknowledgedByEmpId: [],
        ShiftCompanyId: cmpId,
        ShiftLocationId: shiftData.ShiftLocationId ?? null,
        ShiftLocationAddress: shiftData.ShiftLocationAddress ?? null,
        ShiftLocationName: shiftData.ShiftLocationName ?? null,
        ShiftEnableRestrictedRadius: shiftData.ShiftEnableRestrictedRadius,
        ShiftLinkedPatrolIds: shiftData.ShiftLinkedPatrolIds ?? [],
        ShiftIsSpecialShift: shiftData.ShiftIsSpecialShift,
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
      /*const shiftSnapshot = await transaction.get(shiftDocRef);
      const oldShiftData = shiftSnapshot.data() as IShiftsCollection;

       if (oldShiftData.ShiftAssignedUserId?.length > 0) {
        throw new CustomError(
          "Cannot edit this shift as it already have assigned employees"
        );
      } */

      const shiftTasks: IShiftTasksChild[] = [];

      tasks.map((task, idx) => {
        if (task.TaskName && task.TaskName.length > 0) {
          let shiftTaskId = task.TaskId;

          if (!shiftTaskId) {
            const random = getRandomNumbers();
            shiftTaskId = `${shiftId}${random}${idx}`;
          }

          shiftTasks.push({
            ShiftTaskId: shiftTaskId,
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
        ShiftLocation: shiftData.ShiftLocation
          ? new GeoPoint(
              Number(shiftData.ShiftLocation.latitude),
              Number(shiftData.ShiftLocation.longitude)
            )
          : null,
        ShiftPhotoUploadIntervalInMinutes:
          shiftData.ShiftPhotoUploadIntervalInMinutes,
        ShiftEnableRestrictedRadius: shiftData.ShiftEnableRestrictedRadius,
        ShiftLocationName: shiftData.ShiftLocationName ?? null,
        ShiftClientId: shiftData.ShiftClientId ?? null,
        ShiftRestrictedRadius: shiftData.ShiftRestrictedRadius || null,
        ShiftCompanyId: cmpId,
        ShiftLocationId: shiftData.ShiftLocationId ?? null,
        ShiftLocationAddress: shiftData.ShiftLocationAddress ?? null,
        ShiftRequiredEmp: Number(shiftData.ShiftRequiredEmp),
        ShiftLinkedPatrolIds: shiftData.ShiftLinkedPatrolIds ?? [],
        ShiftAssignedUserId: shiftData.ShiftAssignedUserId,
        ShiftIsSpecialShift: shiftData.ShiftIsSpecialShift,
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

  static deleteShift = async (shiftId: string) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(shiftRef);
      const shiftData = snapshot.data() as IShiftsCollection;

      const { ShiftGuardWellnessReport, ShiftTask } = shiftData;

      const imagesToBeDeleted: string[] = [];

      if (ShiftGuardWellnessReport && ShiftGuardWellnessReport.length > 0) {
        ShiftGuardWellnessReport.forEach((res) => {
          if (res.WellnessImg && res?.WellnessImg?.length > 0) {
            imagesToBeDeleted.push(res.WellnessImg);
          }
        });
      }

      if (ShiftTask && ShiftTask.length > 0) {
        ShiftTask.forEach((res) => {
          if (res.ShiftTaskStatus && res.ShiftTaskStatus?.length > 0) {
            res.ShiftTaskStatus.forEach((status) => {
              if (status.TaskPhotos && status.TaskPhotos.length > 0) {
                status.TaskPhotos.forEach((img) => {
                  imagesToBeDeleted.push(img);
                });
              }
            });
          }
        });
      }

      transaction.delete(shiftRef);

      const imageDeletePromise = imagesToBeDeleted.map((img) => {
        return CloudStorageImageHandler.deleteImageByUrl(img);
      });

      await Promise.all(imageDeletePromise);
    });
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
      where('ShiftCompanyId', '==', cmpId),
      orderBy('ShiftDate', 'desc'),
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

  static getShiftById = (shiftId: string) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);
    return getDoc(shiftRef);
  };

  static changeShiftDate = (shiftId: string, newDate: Date) => {
    const docRef = doc(db, CollectionName.shifts, shiftId);

    return updateDoc(docRef, { ShiftDate: newDate as unknown as Timestamp });
  };
}

export default DbShift;
