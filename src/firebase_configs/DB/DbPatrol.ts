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
  where,
} from 'firebase/firestore';
import { CollectionName } from '../../@types/enum';
import CloudStorageImageHandler, { getNewDocId } from './utils';
import { db } from '../config';
import {
  IPatrolCheckPointsChild,
  IPatrolLogsCheckPointsChildCollection,
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import { PatrollingFormFields } from '../../utilities/zod/schema';
import { generateQrCodesHtml } from '../../utilities/pdf/generateQrCodesHtml';
import {
  fullTextSearchIndex,
  getRandomNumbers,
  removeTimeFromDate,
  toDate,
} from '../../utilities/misc';
import { htmlToPdf } from '../../API/HtmlToPdf';
import { downloadPdf } from '../../utilities/pdf/common/downloadPdf';
import { Company } from '../../store/slice/auth.slice';
import dayjs from 'dayjs';

class DbPatrol {
  static createPatrol = async ({
    companyDetails,
    data,
  }: {
    companyDetails: Company;
    data: PatrollingFormFields;
  }) => {
    const patrolId = getNewDocId(CollectionName.patrols);
    const patrolRef = doc(db, CollectionName.patrols, patrolId);

    const PatrolCheckPoints: IPatrolCheckPointsChild[] = [];

    data.PatrolCheckPoints.map((ch, idx) => {
      const random = getRandomNumbers();
      const checkPointId = `${patrolId}${random}${idx}`;

      PatrolCheckPoints.push({
        CheckPointId: checkPointId,
        CheckPointName: ch.name,
        CheckPointStatus: [],
        CheckPointCategory: ch.category || null,
        CheckPointHint: ch.hint || null,
      });
    });

    const PatrolNameSearchIndex = fullTextSearchIndex(
      data.PatrolName.trim().toLowerCase()
    );

    const newPatrol: IPatrolsCollection = {
      PatrolId: patrolId,
      PatrolCompanyId: companyDetails.CompanyId,
      PatrolCompanyBranchId: data.PatrolCompanyBranchId || null,
      PatrolName: data.PatrolName,
      PatrolNameSearchIndex,
      PatrolLocation: new GeoPoint(
        Number(data.PatrolLocation.latitude),
        Number(data.PatrolLocation.longitude)
      ),
      PatrolReminderInMinutes: data.PatrolReminderInMinutes,
      PatrolLocationId: data.PatrolLocationId,
      PatrolLocationName: data.PatrolLocationName,
      PatrolCheckPoints,
      PatrolCurrentStatus: [],
      PatrolRestrictedRadius: data.PatrolRestrictedRadius || null,
      PatrolKeepGuardInRadiusOfLocation: data.PatrolKeepGuardInRadiusOfLocation,
      PatrolClientId: data.PatrolClientId,
      PatrolCreatedAt: serverTimestamp(),
      PatrolModifiedAt: serverTimestamp(),
    };

    await setDoc(patrolRef, newPatrol);

    const fileName = `${data.PatrolName}_qrcodes.pdf`;
    const html = await generateQrCodesHtml(
      PatrolCheckPoints.map((ch) => {
        return { code: ch.CheckPointId, label: ch.CheckPointName };
      }),
      companyDetails
    );
    const response = await htmlToPdf({ file_name: fileName, html });
    downloadPdf(response, fileName);
  };

  static updatePatrol = async ({
    patrolId,
    data,
    companyDetails,
  }: {
    patrolId: string;
    data: PatrollingFormFields;
    companyDetails: Company;
  }) => {
    const patrolRef = doc(db, CollectionName.patrols, patrolId);

    await runTransaction(db, async (transaction) => {
      const PatrolCheckPoints: IPatrolCheckPointsChild[] = [];

      data.PatrolCheckPoints.map((ch, idx) => {
        let checkPointId = ch.id;

        if (!checkPointId) {
          const random = getRandomNumbers();
          checkPointId = `${patrolId}${random}${idx}`;
        }

        PatrolCheckPoints.push({
          CheckPointId: checkPointId,
          CheckPointName: ch.name,
          CheckPointStatus: [],
          CheckPointCategory: ch.category || null,
          CheckPointHint: ch.hint || null,
        });
      });

      const PatrolNameSearchIndex = fullTextSearchIndex(
        data.PatrolName.trim().toLowerCase()
      );

      const newPatrol: Partial<IPatrolsCollection> = {
        PatrolName: data.PatrolName,
        PatrolNameSearchIndex,
        PatrolLocation: new GeoPoint(
          Number(data.PatrolLocation.latitude),
          Number(data.PatrolLocation.longitude)
        ),
        PatrolReminderInMinutes: data.PatrolReminderInMinutes,
        PatrolLocationId: data.PatrolLocationId,
        PatrolLocationName: data.PatrolLocationName,
        PatrolCheckPoints,
        PatrolRestrictedRadius: data.PatrolRestrictedRadius || null,
        PatrolKeepGuardInRadiusOfLocation:
          data.PatrolKeepGuardInRadiusOfLocation,
        PatrolClientId: data.PatrolClientId,
        PatrolCompanyBranchId: data.PatrolCompanyBranchId || null,
        PatrolModifiedAt: serverTimestamp(),
      };

      transaction.update(patrolRef, newPatrol);

      const fileName = `${data.PatrolName}_qrcodes.pdf`;
      const html = await generateQrCodesHtml(
        PatrolCheckPoints.map((ch) => {
          return { code: ch.CheckPointId, label: ch.CheckPointName };
        }),
        companyDetails
      );
      const response = await htmlToPdf({ file_name: fileName, html });
      downloadPdf(response, fileName);
    });
  };

  static getPatrols = async ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    locationId,
    branchId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
    locationId?: string | null;
    branchId?: string;
  }) => {
    const patrolRef = collection(db, CollectionName.patrols);

    let queryParams: QueryConstraint[] = [
      where('PatrolCompanyId', '==', cmpId),
      orderBy('PatrolCreatedAt', 'desc'),
    ];

    if (locationId && locationId.length > 3) {
      queryParams = [
        ...queryParams,
        where('PatrolLocationId', '==', locationId),
      ];
    }

    if (branchId && branchId.length > 3) {
      queryParams = [
        ...queryParams,
        where('PatrolCompanyBranchId', '==', branchId),
      ];
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'PatrolNameSearchIndex',
          'array-contains',
          searchQuery.toLocaleLowerCase()
        ),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const patrolQuery = query(patrolRef, ...queryParams);

    const snap = await getDocs(patrolQuery);

    return snap;
  };

  static getPatrolById = (patrolId: string) => {
    const patrolRef = doc(db, CollectionName.patrols, patrolId);

    return getDoc(patrolRef);
  };

  static deletePatrol = (patrolId: string) => {
    const patrolRef = doc(db, CollectionName.patrols, patrolId);
    return deleteDoc(patrolRef);
  };

  static getAssignedGuardOfPatrol = (locationId: string) => {
    const shiftRef = collection(db, CollectionName.shifts);
    const currDate = removeTimeFromDate(new Date());
    console.log(currDate, 'current date');
    const shiftQuery = query(
      shiftRef,
      where('ShiftLocationId', '==', locationId),
      where('ShiftDate', '==', currDate),
      limit(1)
    );

    return getDocs(shiftQuery);
  };

  static getPatrolLogs = async ({
    lmt,
    lastDoc,
    patrolId,
    endDate,
    isLifeTime,
    startDate,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    patrolId: string;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const patrolLogRef = collection(db, CollectionName.patrolLogs);

    let queryParams: QueryConstraint[] = [
      where('PatrolId', '==', patrolId),
      orderBy('PatrolDate', 'desc'),
    ];

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('PatrolDate', '>=', startDate),
        where('PatrolDate', '<=', endDate),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const patrolLogQuery = query(patrolLogRef, ...queryParams);

    return getDocs(patrolLogQuery);
  };

  static getPatrolLogById = (patrolLogId: string) => {
    const patrolRef = doc(db, CollectionName.patrolLogs, patrolLogId);
    return getDoc(patrolRef);
  };

  static deletePatrolLog = async (patrolLogId: string) => {
    const patrolRef = doc(db, CollectionName.patrolLogs, patrolLogId);
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(patrolRef);
      const patrolLogData = snapshot.data() as IPatrolLogsCollection;
      const { PatrolLogCheckPoints } = patrolLogData;
      const imageToBeDeleted: string[] = [];

      PatrolLogCheckPoints.forEach((ch) => {
        const { CheckPointImage } = ch;
        if (CheckPointImage) {
          Array.isArray(CheckPointImage)
            ? CheckPointImage.forEach((img) => {
                imageToBeDeleted.push(img);
              })
            : imageToBeDeleted.push(CheckPointImage);
        }
      });

      transaction.delete(patrolRef);

      const imageDeletePromise = imageToBeDeleted.map((img) => {
        return CloudStorageImageHandler.deleteImageByUrl(img);
      });

      await Promise.all(imageDeletePromise);
    });
  };

  static createPatrolLogCopy = async (patrolLogId: string) => {
    const docRef = doc(db, CollectionName.patrolLogs, patrolLogId);
    const docSnapshot = await getDoc(docRef);
    const docData = docSnapshot.data() as IPatrolLogsCollection;

    const newPatrolLogId = getNewDocId(CollectionName.patrolLogs);
    const newDocRef = doc(db, CollectionName.patrolLogs, newPatrolLogId);

    const newCheckPoints: IPatrolLogsCheckPointsChildCollection[] =
      docData.PatrolLogCheckPoints.map((res) => {
        return {
          ...res,
          CheckPointReportedAt: dayjs(toDate(res.CheckPointReportedAt))
            .add(1, 'day')
            .toDate() as unknown as Timestamp,
        };
      });

    const newDocData: IPatrolLogsCollection = {
      ...docData,
      PatrolLogId: newPatrolLogId,
      PatrolLogCheckPoints: newCheckPoints,
      PatrolDate: dayjs(toDate(docData.PatrolDate))
        .add(1, 'day')
        .toDate() as unknown as Timestamp,
      PatrolLogStartedAt: dayjs(toDate(docData.PatrolLogStartedAt))
        .add(1, 'day')
        .toDate() as unknown as Timestamp,
      PatrolLogEndedAt: dayjs(toDate(docData.PatrolLogEndedAt))
        .add(1, 'day')
        .toDate() as unknown as Timestamp,
      PatrolLogCreatedAt: dayjs(toDate(docData.PatrolLogCreatedAt))
        .add(1, 'day')
        .toDate() as unknown as Timestamp,
    };

    await setDoc(newDocRef, newDocData);
  };
}

export default DbPatrol;
