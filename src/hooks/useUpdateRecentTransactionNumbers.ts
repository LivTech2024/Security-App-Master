import { useEffect } from 'react';
import { useAuthState, usePaymentState } from '../store';
import DbPayment from '../firebase_configs/DB/DbPayment';

const useUpdateRecentTransactionNumbers = () => {
  const { company } = useAuthState();
  const { setRecentInvoiceNumber } = usePaymentState();

  useEffect(() => {
    if (!company) return;

    DbPayment.getRecentInvNumber(company.CompanyId).then((data) => {
      if (data) {
        const { InvoiceNumber } = data;
        setRecentInvoiceNumber(Number(InvoiceNumber));
      }
    });
  }, [company]);
};

export default useUpdateRecentTransactionNumbers;
