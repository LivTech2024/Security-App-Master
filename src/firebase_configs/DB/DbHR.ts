import {
  collection,
  doc,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CollectionName } from '../../@types/enum';
import { db } from '../config';
import { ILeaveRequestsCollection } from '../../@types/database';

class DbHR {
  static getLeaveRequests = ({
    lmt,
    lastDoc,
    empId,
    cmpId,
    branchId,
    endDate,
    isLifeTime,
    startDate,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    empId?: string;
    cmpId: string;
    branchId?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    isLifeTime?: boolean;
  }) => {
    const docRef = collection(db, CollectionName.leaveRequests);

    let queryParams: QueryConstraint[] = [
      where('LeaveReqCompanyId', '==', cmpId),
      orderBy('LeaveReqCreatedAt', 'desc'),
    ];

    if (branchId) {
      queryParams = [
        ...queryParams,
        where('LeaveReqCompanyBranchId', '==', branchId),
      ];
    }

    if (empId) {
      queryParams = [...queryParams, where('LeaveReqEmpId', '==', empId)];
    }

    if (!isLifeTime) {
      queryParams = [
        ...queryParams,
        where('LeaveReqCreatedAt', '>=', startDate),
        where('LeaveReqCreatedAt', '<=', endDate),
      ];
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const docQuery = query(docRef, ...queryParams);

    return getDocs(docQuery);
  };

  static updateLeaveRequest = ({
    isPaidLeave,
    leaveStatus,
    paidLeaveAmt,
    reqId,
  }: {
    reqId: string;
    isPaidLeave: boolean;
    paidLeaveAmt: number;
    leaveStatus: 'pending' | 'rejected' | 'accepted';
  }) => {
    const leaveReqRef = doc(db, CollectionName.leaveRequests, reqId);

    const updatedLeaveReq: Partial<ILeaveRequestsCollection> = {
      LeaveReqIsPaidLeave: isPaidLeave,
      LeaveReqPaidLeaveAmt: isPaidLeave ? paidLeaveAmt : 0,
      LeaveReqStatus: leaveStatus,
    };

    return updateDoc(leaveReqRef, updatedLeaveReq);
  };
}

export default DbHR;