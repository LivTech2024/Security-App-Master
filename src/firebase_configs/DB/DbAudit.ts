import {
  IInvoicesCollection,
  IPayStubsCollection,
} from '../../@types/database';
import DbPayment from './DbPayment';
import DbEmployee from './DbEmployee';
import DbAssets from './DbAssets';
import DbClient from './DbClient';
import dayjs from 'dayjs';

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
    let TotalClients = 0,
      TotalEmployees = 0,
      TotalEquipments = 0,
      TotalExpense = 0,
      TotalIncome = 0;

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

      //*Resolve all the task promise

      const [
        invoiceSnapshot,
        payStubSnapshot,
        employeesSnapshot,
        equipmentSnapshot,
        clientSnapshot,
      ] = await Promise.all([
        invoiceTask,
        payStubTask,
        employeesTask,
        equipmentTask,
        clientTask,
      ]);

      const invoiceData = invoiceSnapshot.docs.map(
        (doc) => doc.data() as IInvoicesCollection
      );
      TotalIncome = invoiceData.reduce(
        (acc, obj) => acc + obj.InvoiceReceivedAmount,
        0
      );

      const payStubData = payStubSnapshot.docs.map(
        (doc) => doc.data() as IPayStubsCollection
      );
      TotalExpense = payStubData.reduce(
        (acc, obj) => acc + Number(obj.PayStubNetPay.Amount),
        0
      );

      TotalEmployees = employeesSnapshot.size;

      TotalEquipments = equipmentSnapshot.size;

      TotalClients = clientSnapshot.size;

      return {
        TotalClients,
        TotalEmployees,
        TotalEquipments,
        TotalExpense,
        TotalIncome,
      };
    } catch (error) {
      console.log(error, 'here');
      return {
        TotalClients,
        TotalEmployees,
        TotalEquipments,
        TotalExpense,
        TotalIncome,
      };
    }
  };
}

export default DbAudit;
