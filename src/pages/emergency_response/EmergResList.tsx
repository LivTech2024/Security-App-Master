import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';

const EmergResList = () => {
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Emergency Response"
        rightSection={
          <Button
            label="Create new emergency protocol"
            type="black"
            onClick={() => {}}
          />
        }
      />
    </div>
  );
};

export default EmergResList;
