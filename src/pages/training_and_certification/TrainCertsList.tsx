import { useNavigate } from 'react-router-dom';
import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';
import { PageRoutes } from '../../@types/enum';

const TrainCertsList = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Training & Certifications"
        rightSection={
          <Button
            label="Create New Training & Certifications"
            type="black"
            onClick={() => {
              navigate(PageRoutes.TRAINING_AND_CERTIFICATION_CREATE_OR_EDIT);
            }}
          />
        }
      />
    </div>
  );
};

export default TrainCertsList;
