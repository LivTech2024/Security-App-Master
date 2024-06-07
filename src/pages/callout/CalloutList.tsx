import { useState } from 'react';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import CreateCalloutModal from '../../component/callout/modal/CreateCalloutModal';

const CalloutList = () => {
  const [createCalloutModal, setCreateCalloutModal] = useState(false);
  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title="Callouts"
        rightSection={
          <Button
            label="Create Callout"
            type="black"
            onClick={() => {
              setCreateCalloutModal(true);
            }}
          />
        }
      />
      <CreateCalloutModal
        opened={createCalloutModal}
        setOpened={setCreateCalloutModal}
      />
    </div>
  );
};

export default CalloutList;
