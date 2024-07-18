import { ReactNode } from 'react';
import AnimatedNumberTicker from '../../../common/NumberTicker';
import { FaMoneyBill1Wave } from 'react-icons/fa6';
import { GiExpense } from 'react-icons/gi';
import { FaPeopleCarry, FaTools } from 'react-icons/fa';
import { MdPeopleAlt } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../@types/enum';

interface TotalAmtCardsProps {
  TotalIncome: number;
  TotalExpense: number;
  TotalEquipments: number;
  TotalEmployees: number;
  TotalClients: number;
}

interface CardProps {
  currency?: string;
  amountValue: number;
  title: string;
  icon: ReactNode;
  callback: () => void;
}

const Cards = ({ amountValue, currency, icon, title, callback }: CardProps) => {
  return (
    <div
      onClick={callback}
      className="bg-surface rounded shadow p-4 overflow-hidden w-full cursor-pointer"
    >
      <div className=" mr-0">
        {currency ? (
          <span className=" font-bold text-xl leading-5">{currency}</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
      <div className={`flex w-full items-center gap-2 ${currency && 'pl-2'}`}>
        <div className=" flex flex-col w-full  overflow-hidden whitespace-nowrap">
          <div className=" text-2xl font-bold overflow-hidden text-ellipsis block">
            <AnimatedNumberTicker
              value={Number(String(amountValue).split('.')[0])}
            />
          </div>
          <span className="font-thin text-textTertiary text-sm overflow-hidden text-ellipsis block">
            {title}
          </span>
        </div>
        {icon}
      </div>
    </div>
  );
};

const TotalAmtCards = ({
  TotalClients,
  TotalEmployees,
  TotalEquipments,
  TotalExpense,
  TotalIncome,
}: TotalAmtCardsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-4 w-full ">
      <Cards
        currency="$"
        amountValue={TotalIncome}
        title="Total Income"
        icon={
          <FaMoneyBill1Wave className="text-textPrimaryGreen ml-auto size-9" />
        }
        callback={() => navigate(PageRoutes.INVOICE_LIST)}
      />
      <Cards
        currency="$"
        amountValue={TotalExpense}
        title="Total Expense"
        icon={<GiExpense className="text-textPrimaryRed ml-auto size-9" />}
        callback={() => navigate(PageRoutes.PAY_STUB_LIST)}
      />
      <Cards
        amountValue={TotalEquipments}
        title="Total Equipments"
        icon={<FaTools className="text-textPrimaryBlue ml-auto size-8" />}
        callback={() => navigate(PageRoutes.EQUIPMENT_LIST)}
      />
      <Cards
        amountValue={TotalEmployees}
        title="Total Employees"
        icon={
          <MdPeopleAlt className="text-textSecondaryBlue ml-auto size-10" />
        }
        callback={() => navigate(PageRoutes.EMPLOYEE_LIST)}
      />
      <Cards
        amountValue={TotalClients}
        title="Total Clients"
        icon={
          <FaPeopleCarry className="text-textPrimaryGreen ml-auto size-9" />
        }
        callback={() => navigate(PageRoutes.CLIENTS)}
      />
    </div>
  );
};

export default TotalAmtCards;
