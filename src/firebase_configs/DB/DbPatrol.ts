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
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from "firebase/firestore";
import { CollectionName } from "../../@types/enum";
import { getNewDocId } from "./utils";
import { db } from "../config";
import {
  IPatrolCheckPointsChild,
  IPatrolsCollection,
} from "../../@types/database";
import { PatrollingFormFields } from "../../utilities/zod/schema";
import { generateBarcodesAndDownloadPDF } from "../../utilities/generateBarcodesAndDownloadPdf";
import { fullTextSearchIndex, removeTimeFromDate } from "../../utilities/misc";

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
      const checkPointId = `${patrolId}${idx}`;
      PatrolCheckPoints.push({
        CheckPointId: checkPointId,
        CheckPointName: ch.name,
        CheckPointStatus: "not_checked",
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
      PatrolTime: data.PatrolTime,
      PatrolRequiredCount: Number(data.PatrolRequiredCount),
      PatrolCompletedCount: 0,
      PatrolCheckPoints,
      PatrolCurrentStatus: "pending",
      PatrolRestrictedRadius: Number(data.PatrolRestrictedRadius),
      PatrolKeepGuardInRadiusOfLocation: data.PatrolKeepGuardInRadiusOfLocation,
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

  static getPatrols = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
  }: {
    lmt: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
  }) => {
    const patrolRef = collection(db, CollectionName.patrols);

    let queryParams: QueryConstraint[] = [
      where("PatrolCompanyId", "==", cmpId),
      orderBy("PatrolTime", "desc"),
    ];

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          "PatrolNameSearchIndex",
          "array-contains",
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

    return getDocs(patrolQuery);
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
    console.log(currDate, "current date");
    const shiftQuery = query(
      shiftRef,
      where("ShiftLocationId", "==", locationId),
      where("ShiftDate", "==", currDate),
      limit(1)
    );

    return getDocs(shiftQuery);
  };
}

export default DbPatrol;
