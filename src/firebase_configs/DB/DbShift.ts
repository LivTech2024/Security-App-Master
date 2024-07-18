import {
  DocumentData,
  GeoPoint,
  QueryConstraint,
  Timestamp,
  collection,
  deleteDoc,
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
import {
  ICalloutsCollection,
  IShiftLinkedPatrolsChildCollection,
  IShiftTasksChild,
  IShiftsCollection,
} from '../../@types/database';
import { getRandomNumbers, removeTimeFromDate } from '../../utilities/misc';
import { AddShiftFormFields } from '../../utilities/zod/schema';
import { ShiftTask } from '../../component/shifts/ShiftTaskForm';
import { generateQrCodesHtml } from '../../utilities/pdf/generateQrCodesHtml';
import { htmlToPdf } from '../../API/HtmlToPdf';
import { downloadPdf } from '../../utilities/pdf/common/downloadPdf';
import { Company } from '../../store/slice/auth.slice';

class DbShift {
  static addShift = async ({
    companyDetails,
    selectedDays,
    shiftData,
    tasks,
    shiftLinkedPatrols,
  }: {
    shiftData: AddShiftFormFields;
    companyDetails: Company;
    tasks: ShiftTask[];
    selectedDays: Date[];
    shiftLinkedPatrols: IShiftLinkedPatrolsChildCollection[];
  }) => {
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
            ShiftReturnTaskStatus: [],
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
        ShiftCompanyId: companyDetails.CompanyId,
        ShiftLocationId: shiftData.ShiftLocationId ?? null,
        ShiftLocationAddress: shiftData.ShiftLocationAddress ?? null,
        ShiftLocationName: shiftData.ShiftLocationName ?? null,
        ShiftEnableRestrictedRadius: shiftData.ShiftEnableRestrictedRadius,
        ShiftLinkedPatrols: shiftLinkedPatrols,
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
      const fileName = `${shiftData.ShiftName}_qrcodes.pdf`;
      const html = await generateQrCodesHtml(
        barcodesToBeGenerated.map((task) => {
          return { code: task.ShiftTaskId, label: task.ShiftTask };
        }),
        companyDetails
      );
      const response = await htmlToPdf({ file_name: fileName, html });
      downloadPdf(response, fileName);
    }
  };

  static updateShift = async ({
    companyDetails,
    shiftData,
    shiftDate,
    shiftId,
    tasks,
    shiftLinkedPatrols,
  }: {
    shiftData: AddShiftFormFields;
    shiftId: string;
    companyDetails: Company;
    tasks: ShiftTask[];
    shiftDate: Date;
    shiftLinkedPatrols: IShiftLinkedPatrolsChildCollection[];
  }) => {
    await runTransaction(db, async (transaction) => {
      const shiftDocRef = doc(db, CollectionName.shifts, shiftId);
      const shiftSnapshot = await transaction.get(shiftDocRef);
      const oldShiftData = shiftSnapshot.data() as IShiftsCollection;

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
            ShiftTaskStatus:
              oldShiftData?.ShiftTask?.find(
                (task) => task.ShiftTaskId === shiftTaskId
              )?.ShiftTaskStatus || [],
            ShiftReturnTaskStatus:
              oldShiftData?.ShiftTask?.find(
                (task) => task.ShiftTaskId === shiftTaskId
              )?.ShiftReturnTaskStatus || [],
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
        ShiftCompanyId: companyDetails.CompanyId,
        ShiftCompanyBranchId: shiftData.ShiftCompanyBranchId,
        ShiftLocationId: shiftData.ShiftLocationId ?? null,
        ShiftLocationAddress: shiftData.ShiftLocationAddress ?? null,
        ShiftRequiredEmp: Number(shiftData.ShiftRequiredEmp),
        ShiftLinkedPatrols: shiftLinkedPatrols,
        ShiftAssignedUserId: shiftData.ShiftAssignedUserId,
        ShiftIsSpecialShift: shiftData.ShiftIsSpecialShift,
        ShiftModifiedAt: serverTimestamp(),
      };

      transaction.update(shiftDocRef, newShift);

      const barcodesToBeGenerated = shiftTasks.filter(
        (t) => t.ShiftTaskQrCodeReq
      );

      if (barcodesToBeGenerated.length > 0) {
        const fileName = `${shiftData.ShiftName}_qrcodes.pdf`;
        const html = await generateQrCodesHtml(
          barcodesToBeGenerated.map((task) => {
            return { code: task.ShiftTaskId, label: task.ShiftTask };
          }),
          companyDetails
        );
        const response = await htmlToPdf({ file_name: fileName, html });
        downloadPdf(response, fileName);
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
    endDate,
    isLifeTime,
    locationId,
    startDate,
    branchId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    cmpId: string;
    branchId?: string;
    locationId?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const shiftRef = collection(db, CollectionName.shifts);

    let queryParams: QueryConstraint[] = [
      where('ShiftCompanyId', '==', cmpId),
      orderBy('ShiftDate', 'desc'),
    ];

    if (locationId && locationId.length > 3) {
      queryParams = [
        ...queryParams,
        where('ShiftLocationId', '==', locationId),
      ];
    }

    if (branchId && branchId.length > 3) {
      queryParams = [
        ...queryParams,
        where('ShiftCompanyBranchId', '==', branchId),
      ];
    }

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('ShiftDate', '>=', startDate),
        where('ShiftDate', '<=', endDate),
      ];
    }

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

  static getShiftEmpRoutes = (shiftId: string) => {
    const empRouteRef = collection(db, CollectionName.employeeRoutes);

    const empRouteQuery = query(
      empRouteRef,
      where('EmpRouteShiftId', '==', shiftId)
    );

    return getDocs(empRouteQuery);
  };

  //*Callouts
  static createCallout = ({
    cmpId,
    data,
  }: {
    cmpId: string;
    data: {
      CalloutLocation: GeoPoint;
      CalloutLocationId: string;
      CalloutLocationName: string;
      CalloutLocationAddress: string;
      CalloutAssignedEmpsId: string[];
      CalloutDateTime: Date;
    };
  }) => {
    const calloutId = getNewDocId(CollectionName.callouts);
    const calloutRef = doc(db, CollectionName.callouts, calloutId);

    const {
      CalloutAssignedEmpsId,
      CalloutDateTime,
      CalloutLocation,
      CalloutLocationAddress,
      CalloutLocationId,
      CalloutLocationName,
    } = data;

    const newCallout: ICalloutsCollection = {
      CalloutId: calloutId,
      CalloutCompanyId: cmpId,
      CalloutLocation: new GeoPoint(
        CalloutLocation.latitude,
        CalloutLocation.longitude
      ),
      CalloutLocationId,
      CalloutLocationName,
      CalloutLocationAddress,
      CalloutDateTime: CalloutDateTime as unknown as Timestamp,
      CalloutAssignedEmpsId,
      CalloutStatus: [],
      CalloutCreatedAt: serverTimestamp(),
      CalloutModifiedAt: serverTimestamp(),
    };

    return setDoc(calloutRef, newCallout);
  };

  static getCallouts = ({
    lmt,
    lastDoc,
    cmpId,
    endDate,
    isLifeTime,
    locationId,
    startDate,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
    cmpId: string;
    locationId?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const calloutRef = collection(db, CollectionName.callouts);

    let queryParams: QueryConstraint[] = [
      where('CalloutCompanyId', '==', cmpId),
      orderBy('CalloutDateTime', 'desc'),
    ];

    if (locationId && locationId.length > 3) {
      queryParams = [
        ...queryParams,
        where('CalloutLocationId', '==', locationId),
      ];
    }

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('CalloutDateTime', '>=', startDate),
        where('CalloutDateTime', '<=', endDate),
      ];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    const calloutQuery = query(calloutRef, ...queryParams);

    return getDocs(calloutQuery);
  };

  static getCalloutById = (calloutId: string) => {
    const calloutRef = doc(db, CollectionName.callouts, calloutId);

    return getDoc(calloutRef);
  };

  static deleteCallout = (calloutId: string) => {
    const calloutRef = doc(db, CollectionName.callouts, calloutId);

    return deleteDoc(calloutRef);
  };

  static getCalloutReport = (calloutId: string) => {
    const reportRef = collection(db, CollectionName.reports);

    const reportQuery = query(
      reportRef,
      where('ReportCalloutId', '==', calloutId),
      limit(1)
    );

    return getDocs(reportQuery);
  };

  static getCalloutDar = (calloutId: string) => {
    const darRef = collection(db, CollectionName.employeesDAR);

    const darQuery = query(
      darRef,
      where('EmpDarCalloutId', '==', calloutId),
      limit(1)
    );

    return getDocs(darQuery);
  };

  static markShiftEnded = async (shiftId: string, empId: string) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);

    const shiftSnapshot = await getDoc(shiftRef);
    const shiftData = shiftSnapshot.data() as IShiftsCollection;

    // Find the status object to be updated
    const statusIndex = shiftData.ShiftCurrentStatus.findIndex(
      (s) => s.StatusReportedById === empId
    );

    if (statusIndex === -1) {
      throw new Error('Status not found for the given employee ID');
    }

    // Create a copy of the ShiftCurrentStatus array and update the specific status object
    const updatedShiftCurrentStatus = [...shiftData.ShiftCurrentStatus];
    updatedShiftCurrentStatus[statusIndex] = {
      ...updatedShiftCurrentStatus[statusIndex],
      Status: 'completed',
      StatusReportedTime: new Date() as unknown as Timestamp,
    };

    return updateDoc(shiftRef, {
      ShiftCurrentStatus: updatedShiftCurrentStatus,
    });
  };

  static updateShiftTime = async ({
    empId,
    field,
    shiftId,
    updatedTime,
  }: {
    shiftId: string;
    empId: string;
    field: 'start_time' | 'end_time';
    updatedTime: Date;
  }) => {
    const shiftRef = doc(db, CollectionName.shifts, shiftId);

    const shiftSnapshot = await getDoc(shiftRef);
    const shiftData = shiftSnapshot.data() as IShiftsCollection;

    // Find the status object to be updated
    const statusIndex = shiftData.ShiftCurrentStatus.findIndex(
      (s) => s.StatusReportedById === empId
    );

    if (statusIndex === -1) {
      throw new Error('Status not found for the given employee ID');
    }

    // Create a copy of the ShiftCurrentStatus array and update the specific status object
    const updatedShiftCurrentStatus = [...shiftData.ShiftCurrentStatus];

    if (field === 'start_time') {
      updatedShiftCurrentStatus[statusIndex] = {
        ...updatedShiftCurrentStatus[statusIndex],
        StatusStartedTime: updatedTime as unknown as Timestamp,
      };
    }

    if (field === 'end_time') {
      updatedShiftCurrentStatus[statusIndex] = {
        ...updatedShiftCurrentStatus[statusIndex],
        StatusReportedTime: updatedTime as unknown as Timestamp,
      };
    }

    return updateDoc(shiftRef, {
      ShiftCurrentStatus: updatedShiftCurrentStatus,
    });
  };
}

export default DbShift;
