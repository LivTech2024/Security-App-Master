import {
  DocumentData,
  DocumentReference,
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
import { getNewDocId } from './utils';
import { db } from '../config';
import {
  IEquipmentAllocations,
  IEquipmentsCollection,
  IKeyAllocations,
  IKeysCollection,
} from '../../@types/database';
import {
  EquipmentAllocationFormFields,
  EquipmentFormFields,
  KeyAllocationFormFields,
  KeyFormFields,
} from '../../utilities/zod/schema';
import CustomError from '../../utilities/CustomError';
import { fullTextSearchIndex, removeTimeFromDate } from '../../utilities/misc';

class DbAssets {
  static createEquipment = async (cmpId: string, data: EquipmentFormFields) => {
    const equipId = getNewDocId(CollectionName.equipments);
    const equipRef = doc(db, CollectionName.equipments, equipId);

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
    };

    return setDoc(equipRef, newEquipment);
  };

  static updateEquipment = (equipId: string, data: EquipmentFormFields) => {
    const equipRef = doc(db, CollectionName.equipments, equipId);

    const newEquipment: Partial<IEquipmentsCollection> = {
      EquipmentName: data.EquipmentName,
      EquipmentNameSearchIndex: fullTextSearchIndex(
        data.EquipmentName.trim().toLowerCase()
      ),
      EquipmentCompanyBranchId: data.EquipmentCompanyBranchId || null,
      EquipmentDescription: data.EquipmentDescription,
      EquipmentTotalQuantity: Number(data.EquipmentTotalQuantity),
      EquipmentModifiedAt: serverTimestamp(),
    };

    return updateDoc(equipRef, newEquipment);
  };

  static deleteEquipment = async (equipId: string) => {
    const equipAllocRef = collection(db, CollectionName.equipmentAllocations);

    const equipQuery = query(
      equipAllocRef,
      where('EquipmentAllocationEquipId', '==', equipId),
      where('EquipmentAllocationIsReturned', '==', false),
      limit(1)
    );
    const equipAllocSnapshot = await getDocs(equipQuery);

    if (equipAllocSnapshot.size > 0) {
      throw new CustomError(
        'This equipment is already alloted to some employees and its not returned yet'
      );
    }

    const equipAllocDeleteQuery = query(
      equipAllocRef,
      where('EquipmentAllocationEquipId', '==', equipId)
    );

    const equipAllocDeleteSnapshot = await getDocs(equipAllocDeleteQuery);
    const equipAllocData = equipAllocDeleteSnapshot.docs.map(
      (doc) => doc.data() as IEquipmentAllocations
    );

    await runTransaction(db, async (transaction) => {
      const equipRef = doc(db, CollectionName.equipments, equipId);

      equipAllocData.forEach((alloc) => {
        const equipAllocDocRef = doc(
          db,
          CollectionName.equipmentAllocations,
          alloc.EquipmentAllocationId
        );

        transaction.delete(equipAllocDocRef);
      });

      transaction.delete(equipRef);
    });
  };

  static getEquipments = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    branchId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
    branchId?: string | null;
  }) => {
    const docRef = collection(db, CollectionName.equipments);

    let queryParams: QueryConstraint[] = [
      where('EquipmentCompanyId', '==', cmpId),
      orderBy('EquipmentCreatedAt', 'desc'),
    ];

    if (branchId) {
      queryParams = [
        ...queryParams,
        where('EquipmentCompanyBranchId', '==', branchId),
      ];
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'EquipmentNameSearchIndex',
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

    const docQuery = query(docRef, ...queryParams);

    return getDocs(docQuery);
  };

  static getEquipmentById = (equipId: string) => {
    const equipRef = doc(db, CollectionName.equipments, equipId);
    return getDoc(equipRef);
  };

  static createEquipAllocation = async (
    data: EquipmentAllocationFormFields
  ) => {
    const equipAllocId = getNewDocId(CollectionName.equipmentAllocations);
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    );

    const {
      EquipmentAllocationDate,
      EquipmentAllocationEmpId,
      EquipmentAllocationEndDate,
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationStartDate,
    } = data;

    const newEquipAllocData: IEquipmentAllocations = {
      EquipmentAllocationId: equipAllocId,
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationDate: removeTimeFromDate(
        EquipmentAllocationDate
      ) as unknown as Timestamp,
      EquipmentAllocationEmpId,
      EquipmentAllocationStartDate: removeTimeFromDate(
        EquipmentAllocationStartDate
      ) as unknown as Timestamp,
      EquipmentAllocationEndDate: removeTimeFromDate(
        EquipmentAllocationEndDate
      ) as unknown as Timestamp,
      EquipmentAllocationIsReturned: false,
      EquipmentAllocationCreatedAt: serverTimestamp(),
    };

    await runTransaction(db, async (transaction) => {
      const equipDocRef = doc(
        db,
        CollectionName.equipments,
        data.EquipmentAllocationEquipId
      );

      const equipSnapshot = await transaction.get(equipDocRef);
      const equipData = equipSnapshot.data() as IEquipmentsCollection;
      const { EquipmentAllotedQuantity } = equipData;

      transaction.update(equipDocRef, {
        EquipmentAllotedQuantity:
          EquipmentAllotedQuantity + EquipmentAllocationEquipQty,
      });

      transaction.set(equipAllocRef, newEquipAllocData);
    });
  };

  static updateEquipAllocation = async (
    equipAllocId: string,
    data: EquipmentAllocationFormFields
  ) => {
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    );

    const {
      EquipmentAllocationDate,
      EquipmentAllocationEmpId,
      EquipmentAllocationEndDate,
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationStartDate,
    } = data;

    const updatedEquipAllocData: Partial<IEquipmentAllocations> = {
      EquipmentAllocationEquipId,
      EquipmentAllocationEquipQty,
      EquipmentAllocationDate: removeTimeFromDate(
        EquipmentAllocationDate
      ) as unknown as Timestamp,
      EquipmentAllocationEmpId,
      EquipmentAllocationStartDate: removeTimeFromDate(
        EquipmentAllocationStartDate
      ) as unknown as Timestamp,
      EquipmentAllocationEndDate: removeTimeFromDate(
        EquipmentAllocationEndDate
      ) as unknown as Timestamp,
    };

    await runTransaction(db, async (transaction) => {
      const equipAllocOldSnapshot = await transaction.get(equipAllocRef);
      const equipAllocOldData =
        equipAllocOldSnapshot.data() as IEquipmentAllocations;

      const equipDocRef = doc(
        db,
        CollectionName.equipments,
        data.EquipmentAllocationEquipId
      );

      const equipSnapshot = await transaction.get(equipDocRef);
      const equipData = equipSnapshot.data() as IEquipmentsCollection;
      const { EquipmentAllotedQuantity } = equipData;

      if (
        equipAllocOldData.EquipmentAllocationEquipId !==
        updatedEquipAllocData.EquipmentAllocationId
      ) {
        const oldEquipDocRef = doc(
          db,
          CollectionName.equipments,
          equipAllocOldData.EquipmentAllocationEquipId
        );
        const oldEquipSnapshot = await transaction.get(oldEquipDocRef);
        const oldEquipData = oldEquipSnapshot.data() as IEquipmentsCollection;

        //*Update old key
        transaction.update(oldEquipDocRef, {
          EquipmentAllotedQuantity:
            oldEquipData.EquipmentAllotedQuantity -
            equipAllocOldData.EquipmentAllocationEquipQty,
        });

        //*Update new key
        transaction.update(equipDocRef, {
          EquipmentAllotedQuantity:
            EquipmentAllotedQuantity + EquipmentAllocationEquipQty,
        });
      } else {
        transaction.update(equipDocRef, {
          EquipmentAllotedQuantity:
            EquipmentAllotedQuantity -
            equipAllocOldData.EquipmentAllocationEquipQty +
            EquipmentAllocationEquipQty,
        });
      }

      transaction.update(equipAllocRef, updatedEquipAllocData);
    });
  };

  static returnEquipFromEmp = async (equipAllocId: string) => {
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    );

    await runTransaction(db, async (transaction) => {
      const equipAllocSnapshot = await transaction.get(equipAllocRef);
      const equipAllocData = equipAllocSnapshot.data() as IEquipmentAllocations;

      const equipDocRef = doc(
        db,
        CollectionName.equipments,
        equipAllocData.EquipmentAllocationEquipId
      );

      const equipSnapshot = await transaction.get(equipDocRef);
      const equipData = equipSnapshot.data() as IEquipmentsCollection;

      transaction.update(equipDocRef, {
        EquipmentAllotedQuantity:
          equipData.EquipmentAllotedQuantity -
          equipAllocData.EquipmentAllocationEquipQty,
      });

      transaction.update(equipAllocRef, {
        EquipmentAllocationReturnedAt: serverTimestamp(),
        EquipmentAllocationIsReturned: true,
      });
    });
  };

  static deleteEquipAllocation = async (equipAllocId: string) => {
    const equipAllocRef = doc(
      db,
      CollectionName.equipmentAllocations,
      equipAllocId
    );

    await runTransaction(db, async (transaction) => {
      const equipAllocSnapshot = await transaction.get(equipAllocRef);
      const equipAllocData = equipAllocSnapshot.data() as IEquipmentAllocations;

      if (!equipAllocData.EquipmentAllocationIsReturned) {
        const equipDocRef = doc(
          db,
          CollectionName.equipments,
          equipAllocData.EquipmentAllocationEquipId
        );

        const equipSnapshot = await transaction.get(equipDocRef);
        const equipData = equipSnapshot.data() as IEquipmentsCollection;

        transaction.update(equipDocRef, {
          EquipmentAllotedQuantity:
            equipData.EquipmentAllotedQuantity -
            equipAllocData.EquipmentAllocationEquipQty,
        });
      }

      transaction.delete(equipAllocRef);
    });
  };

  static getEquipAllocations = ({
    lmt,
    lastDoc,
    equipmentId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    equipmentId: string;
  }) => {
    const docRef = collection(db, CollectionName.equipmentAllocations);

    let queryParams: QueryConstraint[] = [
      where('EquipmentAllocationEquipId', '==', equipmentId),
      orderBy('EquipmentAllocationDate', 'desc'),
    ];

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const docQuery = query(docRef, ...queryParams);

    return getDocs(docQuery);
  };

  //*Keys

  static createKey = async (cmpId: string, data: KeyFormFields) => {
    const keyId = getNewDocId(CollectionName.keys);

    const keyRef = doc(db, CollectionName.keys, keyId);

    const newEquipment: IKeysCollection = {
      KeyId: keyId,
      KeyName: data.KeyName,
      KeyNameSearchIndex: fullTextSearchIndex(
        data.KeyName.trim().toLowerCase()
      ),
      KeyCompanyId: cmpId,
      KeyCompanyBranchId: data.KeyCompanyBranchId || null,
      KeyDescription: data.KeyDescription,
      KeyAllotedQuantity: 0,
      KeyTotalQuantity: Number(data.KeyTotalQuantity),
      KeyCreatedAt: serverTimestamp(),
      KeyModifiedAt: serverTimestamp(),
    };

    return setDoc(keyRef, newEquipment);
  };

  static updateKey = (keyId: string, data: KeyFormFields) => {
    const keyRef = doc(db, CollectionName.keys, keyId);

    const newEquipment: Partial<IKeysCollection> = {
      KeyName: data.KeyName,
      KeyNameSearchIndex: fullTextSearchIndex(
        data.KeyName.trim().toLowerCase()
      ),
      KeyCompanyBranchId: data.KeyCompanyBranchId || null,
      KeyDescription: data.KeyDescription,
      KeyTotalQuantity: Number(data.KeyTotalQuantity),
      KeyModifiedAt: serverTimestamp(),
    };

    return updateDoc(keyRef, newEquipment);
  };

  static deleteKey = async (keyId: string) => {
    const keyAllocRef = collection(db, CollectionName.keyAllocations);

    const keyAllocQuery = query(
      keyAllocRef,
      where('KeyAllocationKeyId', '==', keyId),
      where('KeyAllocationIsReturned', '==', false),
      limit(1)
    );
    const keyAllocSnapshot = await getDocs(keyAllocQuery);

    if (keyAllocSnapshot.size > 0) {
      throw new CustomError(
        'This key is already alloted to someone and its not returned yet'
      );
    }

    const keyAllocDeleteQuery = query(
      keyAllocRef,
      where('KeyAllocationKeyId', '==', keyId)
    );

    const keyAllocDeleteSnapshot = await getDocs(keyAllocDeleteQuery);
    const keyAllocData = keyAllocDeleteSnapshot.docs.map(
      (doc) => doc.data() as IKeyAllocations
    );

    await runTransaction(db, async (transaction) => {
      const keyRef = doc(db, CollectionName.keys, keyId);

      keyAllocData.forEach((alloc) => {
        const keyAllocDocRef = doc(
          db,
          CollectionName.keyAllocations,
          alloc.KeyAllocationId
        );

        transaction.delete(keyAllocDocRef);
      });

      transaction.delete(keyRef);
    });
  };

  static getKeys = ({
    lmt,
    lastDoc,
    searchQuery,
    cmpId,
    branchId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    searchQuery?: string;
    cmpId: string;
    branchId?: string | null;
  }) => {
    const docRef = collection(db, CollectionName.keys);

    let queryParams: QueryConstraint[] = [
      where('KeyCompanyId', '==', cmpId),
      orderBy('KeyCreatedAt', 'desc'),
    ];

    if (branchId) {
      queryParams = [
        ...queryParams,
        where('KeyCompanyBranchId', '==', branchId),
      ];
    }

    if (searchQuery && searchQuery.length > 0) {
      queryParams = [
        ...queryParams,
        where(
          'KeyNameSearchIndex',
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

    const docQuery = query(docRef, ...queryParams);

    return getDocs(docQuery);
  };

  static getKeyById = (keyId: string) => {
    const keyRef = doc(db, CollectionName.keys, keyId);
    return getDoc(keyRef);
  };

  static getKeyAllocations = ({
    lmt,
    lastDoc,
    keyId,
  }: {
    lmt?: number;
    lastDoc?: DocumentData | null;
    keyId: string;
  }) => {
    const docRef = collection(db, CollectionName.keyAllocations);

    let queryParams: QueryConstraint[] = [
      where('KeyAllocationKeyId', '==', keyId),
      orderBy('KeyAllocationDate', 'desc'),
    ];

    if (lastDoc) {
      queryParams = [...queryParams, startAfter(lastDoc)];
    }

    if (lmt) {
      queryParams = [...queryParams, limit(lmt)];
    }

    const docQuery = query(docRef, ...queryParams);

    return getDocs(docQuery);
  };

  static getKeyByName = (name: string, companyId: string) => {
    const keyRef = collection(db, CollectionName.keys);
    const keyQuery = query(
      keyRef,
      where('KeyCompanyId', '==', companyId),
      where('KeyName', '==', name),
      limit(1)
    );

    return getDocs(keyQuery);
  };

  static createKeyAllocation = async (
    data: KeyAllocationFormFields,
    companyId: string
  ) => {
    const keyAllocId = getNewDocId(CollectionName.keyAllocations);
    const keyAllocRef = doc(db, CollectionName.keyAllocations, keyAllocId);

    const {
      KeyAllocationDate,
      KeyAllocationEndTime,
      KeyAllocationKeyName,
      KeyAllocationKeyQty,
      KeyAllocationPurpose,
      KeyAllocationRecipientContact,
      KeyAllocationRecipientName,
      KeyAllocationStartTime,
      KeyAllocationRecipientCompany,
    } = data;

    await runTransaction(db, async (transaction) => {
      const keySnapshot = await this.getKeyByName(
        KeyAllocationKeyName,
        companyId
      );

      let KeyAllocationKeyId: string = '';

      //*Check if key already exist else create a new key
      if (keySnapshot.size > 0) {
        const keyData = keySnapshot?.docs[0]?.data() as IKeysCollection;

        const { KeyAllotedQuantity, KeyId } = keyData;

        KeyAllocationKeyId = KeyId;

        const keyDocRef = doc(db, CollectionName.keys, KeyId);

        transaction.update(keyDocRef, {
          KeyAllotedQuantity: KeyAllotedQuantity + KeyAllocationKeyQty,
        });
      } else {
        KeyAllocationKeyId = getNewDocId(CollectionName.keys);

        const keyDocRef = doc(db, CollectionName.keys, KeyAllocationKeyId);

        const newKey: IKeysCollection = {
          KeyId: KeyAllocationKeyId,
          KeyCompanyId: companyId,
          KeyCompanyBranchId: null,
          KeyName: KeyAllocationKeyName,
          KeyNameSearchIndex: fullTextSearchIndex(
            KeyAllocationKeyName.trim().toLowerCase()
          ),
          KeyDescription: null,
          KeyAllotedQuantity: KeyAllocationKeyQty,
          KeyTotalQuantity: KeyAllocationKeyQty,
          KeyCreatedAt: serverTimestamp(),
          KeyModifiedAt: serverTimestamp(),
        };

        transaction.set(keyDocRef, newKey);
      }

      const newKeyAllocData: IKeyAllocations = {
        KeyAllocationId: keyAllocId,
        KeyAllocationKeyId,
        KeyAllocationKeyQty,
        KeyAllocationDate: removeTimeFromDate(
          KeyAllocationDate
        ) as unknown as Timestamp,
        KeyAllocationRecipientName,
        KeyAllocationRecipientContact,
        KeyAllocationPurpose,
        KeyAllocationStartTime: KeyAllocationStartTime as unknown as Timestamp,
        KeyAllocationEndTime: KeyAllocationEndTime as unknown as Timestamp,
        KeyAllocationIsReturned: false,
        KeyAllocationRecipientCompany: KeyAllocationRecipientCompany || null,
        KeyAllocationCreatedAt: serverTimestamp(),
      };

      transaction.set(keyAllocRef, newKeyAllocData);
    });
  };

  static updateKeyAllocation = async (
    keyAllocId: string,
    data: KeyAllocationFormFields,
    companyId: string
  ) => {
    const keyAllocRef = doc(db, CollectionName.keyAllocations, keyAllocId);

    const {
      KeyAllocationDate,
      KeyAllocationEndTime,
      KeyAllocationKeyName,
      KeyAllocationKeyQty,
      KeyAllocationPurpose,
      KeyAllocationRecipientContact,
      KeyAllocationRecipientName,
      KeyAllocationStartTime,
      KeyAllocationRecipientCompany,
    } = data;

    await runTransaction(db, async (transaction) => {
      const keyAllocOldSnapshot = await transaction.get(keyAllocRef);
      const keyAllocOldData = keyAllocOldSnapshot.data() as IKeyAllocations;

      const keySnapshot = await this.getKeyByName(
        KeyAllocationKeyName,
        companyId
      );

      let KeyAllocationKeyId: string = '';
      let keyDocRef: DocumentReference | null = null;
      let KeyAllotedQuantity = 0;
      let newKey: IKeysCollection | null = null;

      //*Check if key already exist else create a new key
      if (keySnapshot.size > 0) {
        const keyData = keySnapshot?.docs[0]?.data() as IKeysCollection;

        const { KeyAllotedQuantity: allotedQty, KeyId } = keyData;

        KeyAllocationKeyId = KeyId;

        KeyAllotedQuantity = allotedQty;

        keyDocRef = doc(db, CollectionName.keys, KeyId);
      } else {
        KeyAllocationKeyId = getNewDocId(CollectionName.keys);

        keyDocRef = doc(db, CollectionName.keys, KeyAllocationKeyId);

        newKey = {
          KeyId: KeyAllocationKeyId,
          KeyCompanyId: companyId,
          KeyCompanyBranchId: null,
          KeyName: KeyAllocationKeyName,
          KeyNameSearchIndex: fullTextSearchIndex(
            KeyAllocationKeyName.trim().toLowerCase()
          ),
          KeyDescription: null,
          KeyAllotedQuantity: KeyAllocationKeyQty,
          KeyTotalQuantity: KeyAllocationKeyQty,
          KeyCreatedAt: serverTimestamp(),
          KeyModifiedAt: serverTimestamp(),
        };

        KeyAllotedQuantity = newKey.KeyAllotedQuantity;
      }

      const updatedKeyAllocData: Partial<IKeyAllocations> = {
        KeyAllocationKeyId,
        KeyAllocationKeyQty,
        KeyAllocationDate: removeTimeFromDate(
          KeyAllocationDate
        ) as unknown as Timestamp,
        KeyAllocationRecipientName,
        KeyAllocationStartTime: removeTimeFromDate(
          KeyAllocationStartTime
        ) as unknown as Timestamp,
        KeyAllocationEndTime: removeTimeFromDate(
          KeyAllocationEndTime
        ) as unknown as Timestamp,
        KeyAllocationPurpose,
        KeyAllocationRecipientContact,
        KeyAllocationRecipientCompany: KeyAllocationRecipientCompany || null,
      };

      if (
        keyAllocOldData.KeyAllocationKeyId !==
        updatedKeyAllocData.KeyAllocationKeyId
      ) {
        const oldKeyDocRef = doc(
          db,
          CollectionName.keys,
          keyAllocOldData.KeyAllocationKeyId
        );
        const oldKeySnapshot = await transaction.get(oldKeyDocRef);
        const oldKeyData = oldKeySnapshot.data() as IKeysCollection;

        //*update old one
        transaction.update(oldKeyDocRef, {
          KeyAllotedQuantity:
            oldKeyData.KeyAllotedQuantity - keyAllocOldData.KeyAllocationKeyQty,
        });

        //*new update
        if (newKey) {
          transaction.set(keyDocRef, newKey);
        } else {
          transaction.update(keyDocRef, {
            KeyAllotedQuantity: KeyAllotedQuantity + KeyAllocationKeyQty,
          });
        }
      } else {
        transaction.update(keyDocRef, {
          KeyAllotedQuantity:
            KeyAllotedQuantity -
            keyAllocOldData.KeyAllocationKeyQty +
            KeyAllocationKeyQty,
        });
      }

      transaction.update(keyAllocRef, updatedKeyAllocData);
    });
  };

  static returnKeyFromRecipient = async (keyAllocId: string) => {
    const keyAllocRef = doc(db, CollectionName.keyAllocations, keyAllocId);

    await runTransaction(db, async (transaction) => {
      const keyAllocSnapshot = await transaction.get(keyAllocRef);
      const keyAllocData = keyAllocSnapshot.data() as IKeyAllocations;

      const keyDocRef = doc(
        db,
        CollectionName.keys,
        keyAllocData.KeyAllocationKeyId
      );

      const keySnapshot = await transaction.get(keyDocRef);
      const keyData = keySnapshot.data() as IKeysCollection;

      transaction.update(keyDocRef, {
        KeyAllotedQuantity:
          keyData.KeyAllotedQuantity - keyAllocData.KeyAllocationKeyQty,
      });

      transaction.update(keyAllocRef, {
        KeyAllocationReturnedAt: serverTimestamp(),
        KeyAllocationIsReturned: true,
      });
    });
  };

  static deleteKeyAllocation = async (keyAllocId: string) => {
    const keyAllocRef = doc(db, CollectionName.keyAllocations, keyAllocId);

    await runTransaction(db, async (transaction) => {
      const keyAllocSnapshot = await transaction.get(keyAllocRef);
      const keyAllocData = keyAllocSnapshot.data() as IKeyAllocations;

      if (!keyAllocData.KeyAllocationIsReturned) {
        const keyDocRef = doc(
          db,
          CollectionName.keys,
          keyAllocData.KeyAllocationKeyId
        );

        const keySnapshot = await transaction.get(keyDocRef);
        const keyData = keySnapshot.data() as IKeysCollection;

        transaction.update(keyDocRef, {
          KeyAllotedQuantity:
            keyData.KeyAllotedQuantity - keyAllocData.KeyAllocationKeyQty,
        });
      }

      transaction.delete(keyAllocRef);
    });
  };
}

export default DbAssets;
