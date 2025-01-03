import {
  IClientsCollection,
  IEmployeesCollection,
  IEquipmentsCollection,
  IExpensesCollection,
  IInvoicesCollection,
  ILocationsCollection,
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
      expenses: IExpensesCollection[] = [],
      invoices: IInvoicesCollection[] = [],
      shifts: IShiftsCollection[] = [];
    const patrolLogs: IPatrolLogsCollection[] = [],
      locations: ILocationsCollection[] = [];

    endDate = dayjs(endDate).endOf('day').toDate();

    try {
      const invoiceTask = DbPayment.getInvoices({
        cmpId,
        branchId,
        endDate,
        startDate,
      });

      const expenseTask = DbPayment.getExpenses({
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
        expenseSnapshot,
        payStubSnapshot,
        employeesSnapshot,
        equipmentSnapshot,
        clientSnapshot,
        shiftSnapshot,
        patrolSnapshot,
      ] = await Promise.all([
        invoiceTask,
        expenseTask,
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

      expenses = expenseSnapshot.docs.map(
        (doc) => doc.data() as IExpensesCollection
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

      await Promise.all(
        clients.map(async (data) => {
          const locationSnapshot = await DbClient.getClientLocations(
            data.ClientId
          );

          locationSnapshot.docs.forEach((doc) =>
            locations.push(doc.data() as ILocationsCollection)
          );
        })
      );

      return {
        clients,
        locations,
        employees,
        equipments,
        payStubs,
        expenses,
        invoices,
        shifts,
        patrolLogs,
      };
    } catch (error) {
      console.log(error, 'here');
      return {
        clients,
        locations,
        employees,
        equipments,
        payStubs,
        expenses,
        invoices,
        shifts,
        patrolLogs,
      };
    }
  };
}

export default DbAudit;
