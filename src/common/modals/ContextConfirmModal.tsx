import { closeAllModals, ContextModalProps } from '@mantine/modals';
import { MdOutlineClose } from 'react-icons/md';

export const ContextConfirmModal = ({
  innerProps,
}: ContextModalProps<{
  title: string;
  body: string;
  negativeLabel?: string;
  positiveLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}>) => {
  return (
    <div className="flex flex-col remove-horizontal-scrollbar">
      <div className="flex flex-col sticky top-0 bg-surface dark:bg-background z-[2]">
        <div className="flex items-center py-1 pl-4 pr-1">
          <div className="font-semibold text-lg">{innerProps.title}</div>
          <div
            onClick={() => {
              innerProps.onCancel && innerProps.onCancel();
              closeAllModals();
            }}
            className="ml-auto hover:bg-onHoverBg  duration-200 rounded-full p-2 cursor-pointer"
          >
            <MdOutlineClose className="w-6 h-6" />
          </div>
        </div>
        <hr className=" w-full" />
      </div>
      <div className="p-4 flex flex-col">
        <div className="text-sm font-medium ">{innerProps.body}</div>
      </div>
      <div className="flex ml-auto gap-x-4 mt-4 sticky bottom-0 px-4 py-2 z-[2] bg-surface w-full">
        <div className="flex ml-auto gap-x-4 mb-2 ">
          <button
            onClick={() => {
              innerProps.onCancel && innerProps.onCancel();
              closeAllModals();
            }}
            className="bg-surface font-medium px-5 py-1 rounded hover:bg-onHoverBg duration-200"
          >
            {'Cancel'}
          </button>

          <button
            onClick={() => {
              innerProps.onConfirm && innerProps.onConfirm();
              closeAllModals();
            }}
            type="button"
            className="font-medium bg-secondary hover:bg-blueButtonHoverBg active:bg-blueButtonActiveBg duration-200 px-5 py-1 text-surface rounded"
          >
            {innerProps.positiveLabel ? innerProps.positiveLabel : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
