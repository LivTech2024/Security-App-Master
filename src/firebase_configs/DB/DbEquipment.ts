import {
  DocumentData,
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
} from 'firebase/firestore'
import { CollectionName } from '../../@types/enum'
import { getNewDocId } from './utils'
import { db } from '../config'
import {
  IEquipmentAllocations,
  IEquipmentsCollection,
} from '../../@types/database'
import {
  EquipmentAllocationFormFields,
  EquipmentFormFields,
} from '../../utilities/zod/schema'
import CustomError from '../../utilities/CustomError'
import { fullTextSearchIndex, removeTimeFromDate } from '../../utilities/misc'

class DbEquipment {
  static createEquipment = async (cmpId: string, data: EquipmentFormFields) => {
    const equipId = getNewDocId(CollectionName.equipments)
    const equipRef = doc(db, CollectionName.equipments, equipId)

    const newEquipment: IEquipmentsCollection = {
      EquipmentId: equipId,
      EquipmentName: data.EquipmentName,
      EquipmentNameSearchIndex: fullTextSearchIndex(
        data.EquipmentName.trim().toLowerCase()
      ),
      EquipmentCompanyId: cmpId,
      EquipmentCompanyBranchId: data.EquipmentCompanyBranchId || null,
      EquipmentDescription: data.EquipmentDescription,
      EquipmentAllotedQuantity: 0,
      EquipmentTotalQuantity: Number(data.EquipmentTotalQuantity),
      EquipmentCreatedAt: serverTimestamp(),
      EquipmentModifiedAt: serverTimestamp(),
    }

    return setDoc(equipRef, newEquipment)
  }

  static updateEquipment = (equipId: string, data: EquipmentFormFields) => {
    const equipRef = doc(db, CollectionName.equipments, equipId)

    const newEquipment: Partial<IEquipmentsCollection> = {
      EquipmentName: data.EquipmentName,
      EquipmentNameSearchIndex: fullTextSearchIndex(
        data.EquipmentName.trim().toLowerCase()
      ),
      EquipmentCompanyBranchId: data.EquipmentCompanyBranchId || null,
      EquipmentDescription: data.EquipmentDescription,
      EquipmentTotalQuantity: Number(data.EquipmentTotalQuantity),
      EquipmentModifiedAt: serverTimestamp(),
    }

    return updateDoc(equipRef, newEquipment)
  }

  static deleteEquipment = async (equipId: string) => {
    const equipAllocRef = collection(db, CollectionName.equipmentAllocations)

    const equipQuery = query(
      equipAllocRef,
      where('EquipmentAllocationEquipId', '==', equipId),
      where('EquipmentAllocationIsReturned', '==', false),
      limit(1)
    )
    const equipAllocSnapshot = await getDocs(equipQuery)

    if (equipAllocSnapshot.size > 0) {
      throw new CustomError(
        'This equipment is already alloted to some employees and its not returned yet'
      )
    }

    const equipAllocDeleteQuery = query(
      equipAllocRef,
      where('EquipmentAllocationEquipId', '==', equipId)
    )

    const equipAllocDeleteSnapshot = await getDocs(equipAllocDeleteQuery)
    const equipAllocData = equipAllocDeleteSnapshot.docs.map(
      (doc) => doc.data() as IEquipmentAllocations
    )

    await runTransaction(db, async (transaction) => {
      const equipRef = doc(db, CollectionName.equipments, equipId)

      equipAllocData.forEach((alloc) => {
        const equipAllocDocRef = doc(
          db,
          CollectionName.equipments,
          alloc.EquipmentAllocationId
        )

        transaction.delete(equipAllocDocRef)
      })

      transaction.delete(equipRef)
    })
  }

  static getEquipments = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    branchId,
  }: {
    lmt?: number
    lastDoc?: DocumentData | null
    searchQuery?: string
    cmpId: string
    branchId?: string | null
  }) => {
    const docRef = collection(db, CollectionName.equipments)

    let queryParams: QueryConstraint[] = [
      where('EquipmentCompanyId', '==', cmpId),
      orderBy('EquipmentCreatedAt', 'desc'),
    ]

    if (branchId) {
      queryParams = [
        ...queryParams,
        where('EquipmentCompanyBranchId', '==', branchId),
      ]
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'EquipmentNameSearchIndex',
          'array-contains',
          searchQuery.toLocaleLowerCase()
        ),
      ]
    }

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)]
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)]
    }

    const docQuery = query(docRef, ...queryParams)

    return getDocs(docQuery)
  }

  static getEquipmentById = (equipId: string) => {
    const equipRef = doc(db, CollectionName.equipments, equipId)
    return getDoc(equipRef)
  }

  static createEquipAllocation = async (
    data: EquipmentAllocationFormFields
  ) => {
    const equipAllocId = getNewDocId(CollectionName.equipmentAllocations)
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    )

    const {
      EquipmentAllocationDate,
      EquipmentAllocationEmpId,
      EquipmentAllocationEmpName,
      EquipmentAllocationEndDate,
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationStartDate,
    } = data

    const newEquipAllocData: IEquipmentAllocations = {
      EquipmentAllocationId: equipAllocId,
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationDate: removeTimeFromDate(
        EquipmentAllocationDate
      ) as unknown as Timestamp,
      EquipmentAllocationEmpId,
      EquipmentAllocationEmpName,
      EquipmentAllocationStartDate: removeTimeFromDate(
        EquipmentAllocationStartDate
      ) as unknown as Timestamp,
      EquipmentAllocationEndDate: removeTimeFromDate(
        EquipmentAllocationEndDate
      ) as unknown as Timestamp,
      EquipmentAllocationIsReturned: false,
      EquipmentAllocationCreatedAt: serverTimestamp(),
    }

    await runTransaction(db, async (transaction) => {
      const equipDocRef = doc(
        db,
        CollectionName.equipments,
        data.EquipmentAllocationEquipId
      )

      const equipSnapshot = await transaction.get(equipDocRef)
      const equipData = equipSnapshot.data() as IEquipmentsCollection
      const { EquipmentAllotedQuantity } = equipData

      transaction.update(equipDocRef, {
        EquipmentAllotedQuantity:
          EquipmentAllotedQuantity + EquipmentAllocationEquipQty,
      })

      transaction.set(equipAllocRef, newEquipAllocData)
    })
  }

  static updateEquipAllocation = async (
    equipAllocId: string,
    data: EquipmentAllocationFormFields
  ) => {
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    )

    const {
      EquipmentAllocationDate,
      EquipmentAllocationEmpId,
      EquipmentAllocationEmpName,
      EquipmentAllocationEndDate,
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationStartDate,
    } = data

    const newEquipAllocData: Partial<IEquipmentAllocations> = {
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationDate: removeTimeFromDate(
        EquipmentAllocationDate
      ) as unknown as Timestamp,
      EquipmentAllocationEmpId,
      EquipmentAllocationEmpName,
      EquipmentAllocationStartDate: removeTimeFromDate(
        EquipmentAllocationStartDate
      ) as unknown as Timestamp,
      EquipmentAllocationEndDate: removeTimeFromDate(
        EquipmentAllocationEndDate
      ) as unknown as Timestamp,
    }

    await runTransaction(db, async (transaction) => {
      const equipAllocOldSnapshot = await transaction.get(equipAllocRef)
      const equipAllocOldData =
        equipAllocOldSnapshot.data() as IEquipmentAllocations

      //*Reverse changed made to old equipment

      const oldEquipDocRef = doc(
        db,
        CollectionName.equipments,
        equipAllocOldData.EquipmentAllocationEquipId
      )
      const oldEquipSnapshot = await transaction.get(oldEquipDocRef)
      const oldEquipData = oldEquipSnapshot.data() as IEquipmentsCollection

      //* Make changes to new equipment
      const equipDocRef = doc(
        db,
        CollectionName.equipments,
        data.EquipmentAllocationEquipId
      )

      const equipSnapshot = await transaction.get(equipDocRef)
      const equipData = equipSnapshot.data() as IEquipmentsCollection
      const { EquipmentAllotedQuantity } = equipData

      //*old update
      transaction.update(oldEquipDocRef, {
        EquipmentAllotedQuantity:
          oldEquipData.EquipmentAllotedQuantity -
          equipAllocOldData.EquipmentAllocationEquipQty,
      })

      //*new update
      transaction.update(equipDocRef, {
        EquipmentAllotedQuantity:
          EquipmentAllotedQuantity + EquipmentAllocationEquipQty,
      })

      transaction.set(equipAllocRef, newEquipAllocData)
    })
  }

  static returnEquipFromEmp = async (equipAllocId: string) => {
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    )

    await runTransaction(db, async (transaction) => {
      const equipAllocSnapshot = await transaction.get(equipAllocRef)
      const equipAllocData = equipAllocSnapshot.data() as IEquipmentAllocations

      const equipDocRef = doc(
        db,
        CollectionName.equipments,
        equipAllocData.EquipmentAllocationEquipId
      )

      const equipSnapshot = await transaction.get(equipDocRef)
      const equipData = equipSnapshot.data() as IEquipmentsCollection

      transaction.update(equipDocRef, {
        EquipmentAllotedQuantity:
          equipData.EquipmentAllotedQuantity +
          equipAllocData.EquipmentAllocationEquipQty,
      })

      transaction.update(equipAllocRef, {
        EquipmentAllocationIsReturned: true,
      })
    })
  }

  static deleteEquipAllocation = async (equipAllocId: string) => {
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    )

    await runTransaction(db, async (transaction) => {
      const equipAllocSnapshot = await transaction.get(equipAllocRef)
      const equipAllocData = equipAllocSnapshot.data() as IEquipmentAllocations

      if (!equipAllocData.EquipmentAllocationIsReturned) {
        const equipDocRef = doc(
          db,
          CollectionName.equipments,
          equipAllocData.EquipmentAllocationEquipId
        )

        const equipSnapshot = await transaction.get(equipDocRef)
        const equipData = equipSnapshot.data() as IEquipmentsCollection

        transaction.update(equipDocRef, {
          EquipmentAllotedQuantity:
            equipData.EquipmentAllotedQuantity +
            equipAllocData.EquipmentAllocationEquipQty,
        })
      }

      transaction.delete(equipAllocRef)
    })
  }

  static getEquipAllocations = ({
    lmt,
    lastDoc,
    equipmentId,
  }: {
    lmt?: number
    lastDoc?: DocumentData | null
    equipmentId: string
  }) => {
    const docRef = collection(db, CollectionName.equipmentAllocations)

    let queryParams: QueryConstraint[] = [
      where('EquipmentAllocationEquipId', '==', equipmentId),
      orderBy('EquipmentAllocationDate', 'desc'),
    ]

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)]
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)]
    }

    const docQuery = query(docRef, ...queryParams)

    return getDocs(docQuery)
  }
}

export default DbEquipment
