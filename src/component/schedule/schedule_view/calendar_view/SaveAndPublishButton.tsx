import { useState } from 'react';
import PopupMenu from '../../../../common/PopupMenu';
import { FaAngleDown } from 'react-icons/fa';
import { openContextModal } from '@mantine/modals';

interface SaveAndPublishButtonProps {
  isDisabled: boolean;
  saveCallback: () => void;
  saveAndPublishCallback: () => void;
}

const SaveAndPublishButton = ({
  isDisabled,
  saveAndPublishCallback,
  saveCallback,
}: SaveAndPublishButtonProps) => {
  const [opened, setOpened] = useState(false);

  return (
    <PopupMenu
      target={
        <div
          onClick={() => {
            if (isDisabled) return;
            setOpened(!opened);
          }}
          className={` px-6 py-2 rounded flex items-center gap-4 bg-secondary text-surface text-sm font-semibold justify-between ${isDisabled ? 'bg-secondaryBlueBg cursor-default' : 'cursor-pointer'}`}
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
            if (isDisabled) return;
            openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to save this schedule',
                onConfirm: () => {
                  saveCallback();
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
          className="px-4 pt-4 pb-2 hover:bg-onHoverBg cursor-pointer"
        >
          Save
        </span>
        <span
          onClick={() => {
            if (isDisabled) return;
            openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to save and publish this schedule',
                onConfirm: () => {
                  saveAndPublishCallback();
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
          className="px-4 pt-2 pb-4 hover:bg-onHoverBg cursor-pointer"
        >
          Save & Publish
        </span>
      </div>
    </PopupMenu>
  );
};

export default SaveAndPublishButton;
