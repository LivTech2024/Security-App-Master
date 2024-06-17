import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/button/Button';
import { PageRoutes } from '../../../@types/enum';

const PayStubList = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Payment Stubs"
        rightSection={
          <Button
            label="Generate paystub"
            type="black"
            onClick={() => navigate(PageRoutes.PAY_STUB_GENERATE)}
          />
        }
      />
    </div>
  );
};

export default PayStubList;
