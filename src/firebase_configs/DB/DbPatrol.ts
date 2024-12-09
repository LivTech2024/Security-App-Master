import {
  DocumentData,
  GeoPoint,
  QueryConstraint,
  Timestamp,
  arrayUnion,
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
import { getNewDocId } from './utils';
import { db } from '../config';
import {
  IEmployeeDARCollection,
  IPatrolCheckPointsChild,
  IPatrolLogsCheckPointsChildCollection,
  IPatrolLogsCollection,
  IPatrolsCollection,
} from '../../@types/database';
import { PatrollingFormFields } from '../../utilities/zod/schema';
import {
  fullTextSearchIndex,
  getMatchingRange,
  getRandomNumbers,
  removeTimeFromDate,
  toDate,
} from '../../utilities/misc';
import { Company } from '../../store/slice/auth.slice';
import dayjs from 'dayjs';
import CustomError from '../../utilities/CustomError';

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
  };

  static updatePatrol = async ({
    patrolId,
    data,
  }: {
    patrolId: string;
    data: PatrollingFormFields;
  }) => {
    await runTransaction(db, async (transaction) => {
      const patrolRef = doc(db, CollectionName.patrols, patrolId);
      const patrolSnapshot = await transaction.get(patrolRef);
      const oldPatrolData = patrolSnapshot.data() as IPatrolsCollection;
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
          CheckPointStatus:
            oldPatrolData?.PatrolCheckPoints?.find(
              (ch) => ch.CheckPointId === checkPointId
            )?.CheckPointStatus || [],
          CheckPointCategory: ch.category || null,
          CheckPointHint: ch.hint || null,
        });
      });

      const PatrolNameSearchIndex = fullTextSearchIndex(
        data.PatrolName.trim().toLowerCase()
      );

      const updatedPatrol: Partial<IPatrolsCollection> = {
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

      transaction.update(patrolRef, updatedPatrol);
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
    return deleteDoc(patrolRef);
  };

  static createPatrolLogCopy = async (
    patrolLogId: string,
    addDayCount: number
  ) => {
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
            .add(addDayCount, 'day')
            .toDate() as unknown as Timestamp,
        };
      });

    const newDocData: IPatrolLogsCollection = {
      ...docData,
      PatrolLogId: newPatrolLogId,
      PatrolLogCheckPoints: newCheckPoints,
      PatrolDate: dayjs(toDate(docData.PatrolDate))
        .add(addDayCount, 'day')
        .toDate() as unknown as Timestamp,
      PatrolLogStartedAt: dayjs(toDate(docData.PatrolLogStartedAt))
        .add(addDayCount, 'day')
        .toDate() as unknown as Timestamp,
      PatrolLogEndedAt: dayjs(toDate(docData.PatrolLogEndedAt))
        .add(addDayCount, 'day')
        .toDate() as unknown as Timestamp,
      PatrolLogCreatedAt: dayjs(toDate(docData.PatrolLogCreatedAt))
        .add(addDayCount, 'day')
        .toDate() as unknown as Timestamp,
    };

    await setDoc(newDocRef, newDocData);
  };

  static createEmpDarCopy = async (empDarId: string) => {
    const docRef = doc(db, CollectionName.employeesDAR, empDarId);
    const docSnapshot = await getDoc(docRef);
    const docData = docSnapshot.data() as IEmployeeDARCollection;

    const newEmpDarId = getNewDocId(CollectionName.employeesDAR);
    const newDocRef = doc(db, CollectionName.employeesDAR, newEmpDarId);

    const newDocData: IEmployeeDARCollection = {
      ...docData,
      EmpDarId: newEmpDarId,
      EmpDarDate: serverTimestamp(),
      EmpDarCreatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, newDocData);
  };

  static getRecentPatrolLog = (patrolId: string) => {
    const patrolLogRef = collection(db, CollectionName.patrolLogs);
    const patrolLogQuery = query(
      patrolLogRef,
      where('PatrolId', '==', patrolId),
      orderBy('PatrolLogCreatedAt', 'desc'),
      limit(1)
    );

    return getDocs(patrolLogQuery);
  };

  static getCheckPointReportedAtTime = ({
    endedAt,
    startedAt,
    totalCheckpoints,
  }: {
    totalCheckpoints: number;
    startedAt: Date;
    endedAt: Date;
  }): Date[] => {
    if (totalCheckpoints <= 0) {
      throw new Error('Total checkpoints must be greater than zero.');
    }

    const startTime = startedAt.getTime();
    const endTime = endedAt.getTime();

    if (endTime <= startTime) {
      throw new Error('EndedAt must be greater than StartedAt.');
    }

    const interval = (endTime - startTime) / (totalCheckpoints - 1); // Interval between checkpoints
    const checkpoints: Date[] = [];

    for (let i = 0; i < totalCheckpoints; i++) {
      const checkpointTime = new Date(startTime + i * interval);
      checkpoints.push(checkpointTime);
    }

    return checkpoints;
  };

  static getEmpShiftDar = ({
    empId,
    shiftId,
  }: {
    shiftId: string;
    empId: string;
  }) => {
    const empDarRef = collection(db, CollectionName.employeesDAR);
    const empDarQuery = query(
      empDarRef,
      where('EmpDarShiftId', '==', shiftId),
      where('EmpDarEmpId', '==', empId),
      limit(2)
    );

    return getDocs(empDarQuery);
  };

  static createPatrolLog = async ({
    empDetails,
    patrolId,
    shiftId,
    endedAt,
    shiftDate,
    startedAt,
    hitCount,
    reqHitCount,
  }: {
    shiftId: string;
    shiftDate: Date;
    empDetails: { EmpName: string; EmpId: string };
    patrolId: string;
    startedAt: Date;
    endedAt: Date;
    hitCount: number;
    reqHitCount: number;
  }) => {
    const docSnapshot = await this.getRecentPatrolLog(patrolId);

    if (docSnapshot.empty) {
      throw new CustomError('No previous patrol log found to copy');
    }

    const docData = docSnapshot?.docs[0]?.data() as IPatrolLogsCollection;

    const newPatrolLogId = getNewDocId(CollectionName.patrolLogs);
    const newDocRef = doc(db, CollectionName.patrolLogs, newPatrolLogId);

    const checkpointsTime = this.getCheckPointReportedAtTime({
      startedAt,
      endedAt,
      totalCheckpoints: docData.PatrolLogCheckPoints.length,
    });

    const newCheckPoints: IPatrolLogsCheckPointsChildCollection[] =
      docData.PatrolLogCheckPoints.map((res, idx) => {
        return {
          ...res,
          CheckPointReportedAt: checkpointsTime[idx] as unknown as Timestamp,
          CheckPointComment: `${empDetails.EmpName} commenced patrol, everything ok`,
          CheckPointFailureReason: '',
          CheckPointStatus: 'checked',
        };
      });

    const newDocData: IPatrolLogsCollection = {
      ...docData,
      PatrolLogId: newPatrolLogId,
      PatrolLogCheckPoints: newCheckPoints,
      PatrolDate: shiftDate as unknown as Timestamp,
      PatrolLogStartedAt: startedAt as unknown as Timestamp,
      PatrolLogEndedAt: endedAt as unknown as Timestamp,
      PatrolLogCreatedAt: endedAt as unknown as Timestamp,
      PatrolShiftId: shiftId,
      PatrolLogGuardId: empDetails.EmpId,
      PatrolLogGuardName: empDetails.EmpName,
      PatrolLogPatrolCount: hitCount,
      PatrolLogFeedbackComment: `${empDetails.EmpName} commenced patrol, everything ok`,
    };

    const patrolRef = doc(db, CollectionName.patrols, patrolId);

    await runTransaction(db, async (transaction) => {
      //fetch patrol to update current status
      const patrolSnap = await transaction.get(patrolRef);
      const patrolData = patrolSnap.data() as IPatrolsCollection;

      //fetch empDar for updation
      const empDarSnap = await this.getEmpShiftDar({
        empId: empDetails.EmpId,
        shiftId,
      });

      if (empDarSnap.empty) {
        throw new CustomError('Please create DAR first');
      }

      const empDar = empDarSnap?.docs.map(
        (doc) => doc.data() as IEmployeeDARCollection
      );

      const { PatrolCurrentStatus } = patrolData;

      const patrolCurrStatus = PatrolCurrentStatus.find(
        (status) =>
          status.StatusShiftId === shiftId &&
          status.StatusReportedById === empDetails.EmpId
      );

      if (patrolCurrStatus) {
        const updatedPatrolCurrentStatus = PatrolCurrentStatus.map((status) => {
          if (
            status.StatusShiftId === shiftId &&
            status.StatusReportedById === empDetails.EmpId
          ) {
            return {
              ...status,
              StatusCompletedCount: (status.StatusCompletedCount || 0) + 1,
              Status: hitCount === reqHitCount ? 'completed' : 'started',
              StatusReportedTime: endedAt as unknown as Timestamp,
            };
          }
          return status;
        });
        transaction.update(patrolRef, {
          PatrolCurrentStatus: updatedPatrolCurrentStatus,
        });
      } else {
        const newStatus = {
          Status: 'started',
          StatusCompletedCount: 1,
          StatusReportedById: empDetails.EmpId,
          StatusReportedByName: empDetails.EmpName,
          StatusReportedTime: endedAt as unknown as Timestamp,
          StatusShiftId: shiftId,
        };

        transaction.update(patrolRef, {
          PatrolCurrentStatus: arrayUnion(newStatus),
        });
      }

      if (empDar && empDar.length > 0) {
        //Update the emp dar
        const firstDar = empDar[0];
        const secondDar = empDar[1];

        console.log(startedAt, firstDar, secondDar);

        let timeRanges: string[] = [];

        if (firstDar) {
          timeRanges = [...firstDar.EmpDarTile.map((tile) => tile.TileTime)];
        }
        if (secondDar) {
          timeRanges = [
            ...timeRanges,
            ...secondDar.EmpDarTile.map((tile) => tile.TileTime),
          ];
        }

        const hourRangeStart = getMatchingRange(startedAt, timeRanges);
        const hourRangeEnd = getMatchingRange(endedAt, timeRanges);

        console.log(hourRangeStart, hourRangeEnd, 'here start and end range');

        if (
          firstDar.EmpDarTile.find(
            (tile) =>
              tile.TileTime == hourRangeStart || tile.TileTime == hourRangeEnd
          )
        ) {
          const updatedTile = firstDar.EmpDarTile.map((tile) => {
            if (
              tile.TileTime == hourRangeStart ||
              tile.TileTime == hourRangeEnd
            ) {
              return {
                ...tile,
                TilePatrol: tile?.TilePatrol?.length
                  ? [
                      ...tile.TilePatrol,
                      {
                        TilePatrolData: `Patrol Started At ${dayjs(startedAt).format('HH:mm')} Patrol Ended At ${dayjs(endedAt).format('HH:mm')}`,
                        TilePatrolId: patrolId,
                        TilePatrolName: patrolData.PatrolName,
                        TilePatrolImage: [],
                      },
                    ]
                  : [
                      {
                        TilePatrolData: `Patrol Started At ${dayjs(startedAt).format('HH:mm')} Patrol Ended At ${dayjs(endedAt).format('HH:mm')}`,
                        TilePatrolId: patrolId,
                        TilePatrolName: patrolData.PatrolName,
                        TilePatrolImage: [],
                      },
                    ],
              };
            }
            return tile;
          });

          const empDarRef = doc(
            db,
            CollectionName.employeesDAR,
            firstDar.EmpDarId
          );

          transaction.update(empDarRef, { EmpDarTile: updatedTile });
        } else if (
          secondDar.EmpDarTile.find(
            (tile) =>
              tile.TileTime == hourRangeStart || tile.TileTime == hourRangeEnd
          )
        ) {
          const updatedTile = secondDar.EmpDarTile.map((tile) => {
            if (
              tile.TileTime == hourRangeStart ||
              tile.TileTime == hourRangeEnd
            ) {
              return {
                ...tile,
                TilePatrol: tile?.TilePatrol?.length
                  ? [
                      ...tile.TilePatrol,
                      {
                        TilePatrolData: `Patrol Started At ${dayjs(startedAt).format('HH:mm')} Patrol Ended At ${dayjs(endedAt).format('HH:mm')}`,
                        TilePatrolId: patrolId,
                        TilePatrolName: patrolData.PatrolName,
                        TilePatrolImage: [],
                      },
                    ]
                  : [
                      {
                        TilePatrolData: `Patrol Started At ${dayjs(startedAt).format('HH:mm')} Patrol Ended At ${dayjs(endedAt).format('HH:mm')}`,
                        TilePatrolId: patrolId,
                        TilePatrolName: patrolData.PatrolName,
                        TilePatrolImage: [],
                      },
                    ],
              };
            }
            return tile;
          });

          const empDarRef = doc(
            db,
            CollectionName.employeesDAR,
            secondDar.EmpDarId
          );

          transaction.update(empDarRef, { EmpDarTile: updatedTile });
        }
      }

      transaction.set(newDocRef, newDocData);
    });
  };
}

export default DbPatrol;
