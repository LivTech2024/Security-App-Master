import { useEffect } from 'react';
import { useAuthState, usePaymentState } from '../store';
import DbPayment from '../firebase_configs/DB/DbPayment';

const useUpdateRecentTransactionNumbers = () => {
  const { company } = useAuthState();
  const { setRecentInvoiceNumber, setRecentExpenseNumber } = usePaymentState();

  useEffect(() => {
    if (!company) return;

    DbPayment.getRecentInvNumber(company.CompanyId).then((data) => {
      if (data) {
        const { InvoiceNumber } = data;
        setRecentInvoiceNumber(Number(InvoiceNumber));
      }
    });

    DbPayment.getRecentExpenseNumber(company.CompanyId)
      .then((data) => {
        if (data) {
          const { ExpenseNumber } = data;
          setRecentExpenseNumber(Number(ExpenseNumber));
          console.log('updating', ExpenseNumber);
        }
      })
      .catch((err) => console.log('Error in expense recent number', err));
  }, [company]);
};

export default useUpdateRecentTransactionNumbers;
