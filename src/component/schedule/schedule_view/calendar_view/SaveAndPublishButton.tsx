import { useState } from 'react';
import PopupMenu from '../../../../common/PopupMenu';
import { FaAngleDown } from 'react-icons/fa';
import { openContextModal } from '@mantine/modals';

interface SaveAndPublishButtonProps {
  isSaveDisabled: boolean;
  isSaveAndPublishDisabled: boolean;
  isPublishDisabled: boolean;
  callback: (action: 'save' | 'save_publish' | 'publish') => void;
}

const SaveAndPublishButton = ({
  isSaveDisabled,
  isSaveAndPublishDisabled,
  isPublishDisabled,
  callback,
}: SaveAndPublishButtonProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <PopupMenu
      target={
        <div
          onClick={() => {
            setOpened(!opened);
          }}
          className={` px-6 py-2 rounded flex items-center gap-4 bg-secondary text-surface text-sm font-semibold justify-between cursor-pointer`}
        >
          <span> Save & Publish</span>
          <FaAngleDown />
        </div>
      }
      opened={opened}
      setOpened={setOpened}
      position="bottom"
      width="target"
    >
      <div className="flex flex-col bg-surface w-full shadow-lg">
        <span
          onClick={() => {
            if (isSaveDisabled) return;
            openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to save this schedule',
                onConfirm: () => {
                  callback('save');
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: '30%',
              styles: {
                body: { padding: '0px' },
              },
            });
          }}
          className={`px-4 pt-4 pb-2  ${isSaveDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-onHoverBg'}`}
        >
          Save
        </span>
        <span
          onClick={() => {
            if (isSaveAndPublishDisabled) return;
            openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to save and publish this schedule',
                onConfirm: () => {
                  callback('save_publish');
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: '30%',
              styles: {
                body: { padding: '0px' },
              },
            });
          }}
          className={`px-4 pt-2 pb-2 ${isSaveAndPublishDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-onHoverBg'}`}
        >
          Save & Publish
        </span>
        <span
          onClick={() => {
            if (isPublishDisabled) return;
            openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to publish this schedule',
                onConfirm: () => {
                  callback('publish');
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: '30%',
              styles: {
                body: { padding: '0px' },
              },
            });
          }}
          className={`px-4 pt-2 pb-4 ${isPublishDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-onHoverBg'}`}
        >
          Publish
        </span>
      </div>
    </PopupMenu>
  );
};

export default SaveAndPublishButton;
