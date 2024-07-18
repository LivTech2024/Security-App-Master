import {
  IClientsCollection,
  IEmployeesCollection,
  IEquipmentsCollection,
  IInvoicesCollection,
  IPatrolLogsCollection,
  IPatrolsCollection,
  IPayStubsCollection,
  IShiftsCollection,
} from '../../@types/database';
import DbPayment from './DbPayment';
import DbEmployee from './DbEmployee';
import DbAssets from './DbAssets';
import DbClient from './DbClient';
import dayjs from 'dayjs';
import DbShift from './DbShift';
import DbPatrol from './DbPatrol';

class DbAudit {
  static getTotalAmounts = async ({
    cmpId,
    endDate,
    startDate,
    branchId,
  }: {
    startDate: Date;
    endDate: Date;
    cmpId: string;
    branchId?: string;
  }) => {
    let clients: IClientsCollection[] = [],
      employees: IEmployeesCollection[] = [],
      equipments: IEquipmentsCollection[] = [],
      payStubs: IPayStubsCollection[] = [],
      invoices: IInvoicesCollection[] = [],
      shifts: IShiftsCollection[] = [];
    const patrolLogs: IPatrolLogsCollection[] = [];

    endDate = dayjs(endDate).endOf('day').toDate();

    try {
      const invoiceTask = DbPayment.getInvoices({
        cmpId,
        branchId,
        endDate,
        startDate,
      });

      const payStubTask = DbPayment.getPayStubs({
        cmpId,
        branchId,
        endDate,
        startDate,
      });

      const employeesTask = DbEmployee.getEmployees({
        cmpId,
        branch: branchId,
      });

      const equipmentTask = DbAssets.getEquipments({
        cmpId,
        branchId,
      });

      const clientTask = DbClient.getClients({ cmpId, branchId });

      const shiftTask = DbShift.getShifts({
        cmpId,
        endDate,
        startDate,
        branchId,
      });

      const patrolTask = DbPatrol.getPatrols({ cmpId, branchId });

      //*Resolve all the task promise

      const [
        invoiceSnapshot,
        payStubSnapshot,
        employeesSnapshot,
        equipmentSnapshot,
        clientSnapshot,
        shiftSnapshot,
        patrolSnapshot,
      ] = await Promise.all([
        invoiceTask,
        payStubTask,
        employeesTask,
        equipmentTask,
        clientTask,
        shiftTask,
        patrolTask,
      ]);

      invoices = invoiceSnapshot.docs.map(
        (doc) => doc.data() as IInvoicesCollection
      );

      payStubs = payStubSnapshot.docs.map(
        (doc) => doc.data() as IPayStubsCollection
      );

      employees = employeesSnapshot.docs.map(
        (doc) => doc.data() as IEmployeesCollection
      );

      equipments = equipmentSnapshot.docs.map(
        (doc) => doc.data() as IEquipmentsCollection
      );

      clients = clientSnapshot.docs.map(
        (doc) => doc.data() as IClientsCollection
      );

      shifts = shiftSnapshot.docs.map((doc) => doc.data() as IShiftsCollection);

      const patrols = patrolSnapshot.docs.map(
        (doc) => doc.data() as IPatrolsCollection
      );

      await Promise.all(
        patrols.map(async (data) => {
          const patrolLogsSnapshot = await DbPatrol.getPatrolLogs({
            patrolId: data.PatrolId,
            endDate,
            startDate,
          });
          patrolLogsSnapshot.docs.forEach((doc) =>
            patrolLogs.push(doc.data() as IPatrolLogsCollection)
          );
        })
      );

      return {
        clients,
        employees,
        equipments,
        payStubs,
        invoices,
        shifts,
        patrolLogs,
      };
    } catch (error) {
      console.log(error, 'here');
      return {
        clients,
        employees,
        equipments,
        payStubs,
        invoices,
        shifts,
        patrolLogs,
      };
    }
  };
}

export default DbAudit;
