import {
  DocumentData,
  GeoPoint,
  QueryConstraint,
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
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import { PatrollingFormFields } from '../../utilities/zod/schema';
import { generateBarcodesAndDownloadPDF } from '../../utilities/pdf/generateBarcodesAndDownloadPdf';
import {
  fullTextSearchIndex,
  getRandomNumbers,
  removeTimeFromDate,
} from '../../utilities/misc';
import CustomError from '../../utilities/CustomError';

class DbPatrol {
  static createPatrol = async ({
    cmpId,
    data,
  }: {
    cmpId: string;
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
      PatrolCompanyId: cmpId,
      PatrolName: data.PatrolName,
      PatrolNameSearchIndex,
      PatrolLocation: new GeoPoint(
        Number(data.PatrolLocation.latitude),
        Number(data.PatrolLocation.longitude)
      ),
      PatrolReminderInMinutes: data.PatrolReminderInMinutes,
      PatrolLocationId: data.PatrolLocationId,
      PatrolLocationName: data.PatrolLocationName,
      PatrolRequiredCount: Number(data.PatrolRequiredCount),
      PatrolCheckPoints,
      PatrolCurrentStatus: [],
      PatrolRestrictedRadius: data.PatrolRestrictedRadius || null,
      PatrolKeepGuardInRadiusOfLocation: data.PatrolKeepGuardInRadiusOfLocation,
      PatrolClientId: data.PatrolClientId,
      PatrolCreatedAt: serverTimestamp(),
      PatrolModifiedAt: serverTimestamp(),
    };

    await setDoc(patrolRef, newPatrol);

    await generateBarcodesAndDownloadPDF(
      data.PatrolLocationName,
      PatrolCheckPoints.map((ch) => {
        return { code: ch.CheckPointId, label: ch.CheckPointName };
      })
    );
  };

  static updatePatrol = async ({
    patrolId,
    data,
  }: {
    patrolId: string;
    data: PatrollingFormFields;
  }) => {
    const patrolRef = doc(db, CollectionName.patrols, patrolId);

    await runTransaction(db, async (transaction) => {
      const patrolSnapshot = await transaction.get(patrolRef);
      const oldPatrolData = patrolSnapshot.data() as IPatrolsCollection;

      if (
        oldPatrolData.PatrolCurrentStatus.some(
          (s) => s.Status === 'pending' || s.Status === 'started'
        ) ||
        oldPatrolData.PatrolCheckPoints.some((ch) =>
          ch.CheckPointStatus.some((s) => s.Status === 'not_checked')
        )
      ) {
        throw new CustomError(
          "Can't edit this patrol as its being assigned to some employees"
        );
      }

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
        PatrolCurrentStatus: [],
        PatrolReminderInMinutes: data.PatrolReminderInMinutes,
        PatrolLocationId: data.PatrolLocationId,
        PatrolLocationName: data.PatrolLocationName,
        PatrolRequiredCount: Number(data.PatrolRequiredCount),
        PatrolCheckPoints,
        PatrolRestrictedRadius: data.PatrolRestrictedRadius || null,
        PatrolKeepGuardInRadiusOfLocation:
          data.PatrolKeepGuardInRadiusOfLocation,
        PatrolClientId: data.PatrolClientId,
        PatrolModifiedAt: serverTimestamp(),
      };

      transaction.update(patrolRef, newPatrol);

      await generateBarcodesAndDownloadPDF(
        data.PatrolLocationName,
        PatrolCheckPoints.map((ch) => {
          return { code: ch.CheckPointId, label: ch.CheckPointName };
        })
      );
    });
  };

  static getPatrols = async ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    locationId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
    locationId?: string | null;
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
      orderBy('PatrolLogCreatedAt', 'desc'),
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
          CheckPointImage.forEach((img) => {
            imageToBeDeleted.push(img);
          });
        }
      });

      transaction.delete(patrolRef);

      const imageDeletePromise = imageToBeDeleted.map((img) => {
        return CloudStorageImageHandler.deleteImageByUrl(img);
      });

      await Promise.all(imageDeletePromise);
    });
  };
}

export default DbPatrol;
