import {
  DocumentData,
  GeoPoint,
  QueryConstraint,
  Timestamp,
  collection,
  doc,
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
import { fullTextSearchIndex } from "../../utilities/misc";

class DbPatrol {
  static createPatrol = async (cmpId: string, data: PatrollingFormFields) => {
    const patrolId = getNewDocId(CollectionName.patrols);
    const patrolRef = doc(db, CollectionName.patrols, patrolId);

    const PatrolCheckPoints: IPatrolCheckPointsChild[] = [];

    data.PatrolCheckPoints.map((name, idx) => {
      const checkPointId = `${patrolId}${idx}`;
      PatrolCheckPoints.push({
        CheckPointId: checkPointId,
        CheckPointName: name,
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
      PatrolArea: data.PatrolArea,
      PatrolLocation: new GeoPoint(
        Number(data.PatrolLocation.latitude),
        Number(data.PatrolLocation.longitude)
      ),
      PatrolTime: data.PatrolTime as unknown as Timestamp,
      PatrolAssignedGuardId: data.PatrolAssignedGuardId,
      PatrolAssignedGuardName: data.PatrolAssignedGuardName,
      PatrolCheckPoints,
      PatrolCurrentStatus: "pending",
      PatrolRestrictedRadius: Number(data.PatrolRestrictedRadius),
      PatrolKeepGuardInRadiusOfLocation: data.PatrolKeepGuardInRadiusOfLocation,
      PatrolCreatedAt: serverTimestamp(),
    };

    await setDoc(patrolRef, newPatrol);

    await generateBarcodesAndDownloadPDF(
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
}

export default DbPatrol;
