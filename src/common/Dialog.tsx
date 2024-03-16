import { Modal, ScrollArea } from "@mantine/core";
import React from "react";
import { MdOutlineClose } from "react-icons/md";
import { twMerge } from "tailwind-merge";

interface DialogProps {
  className?: string;
  size?: string;
  title: string;
  children: React.ReactNode;
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  positiveLabel?: string;
  negativeLabel?: string;
  disableSubmit?: boolean;
  positiveCallback?: () => void;
  negativeCallback?: () => void;
  onClose?: () => void;
  isFormModal?: boolean;
  showBottomTool?: boolean;
  bottomToolbarChild?: React.ReactNode;
}

const Dialog = ({
  className,
  size,
  opened,
  setOpened,
  title,
  children,
  positiveLabel = "save",
  negativeLabel = "cancel",
  disableSubmit = false,
  isFormModal = false,
  positiveCallback,
  negativeCallback,
  onClose,
  showBottomTool = true,
  bottomToolbarChild,
}: DialogProps) => {
  return (
    <Modal
      padding={0}
      size={size ? size : "50%"}
      centered
      withCloseButton={false}
      opened={opened}
      onClose={() => {
        onClose && onClose();
        setOpened(false);
      }}
      scrollAreaComponent={ScrollArea.Autosize}
      transitionProps={{
        transition: "fade",
        duration: 600,
        timingFunction: "ease",
      }}
      zIndex={600}
    >
      <div className="flex flex-col remove-horizontal-scrollbar">
        <div className="flex flex-col sticky top-0 bg-surface dark:bg-backgroundDark  z-[2]">
          <div className="flex items-center py-1 pl-4 pr-1">
            <div className=" font-medium">{title}</div>
            <div
              onClick={() => {
                onClose && onClose();
                setOpened(false);
              }}
              className="ml-auto hover:bg-onHoverBg duration-200 rounded-full p-2 cursor-pointer"
            >
              <MdOutlineClose className="w-6 h-6" />
            </div>
          </div>
          <hr className=" w-full" />
        </div>

        <div className={twMerge("p-4 flex flex-col", className)}>
          <div className="">{children}</div>
        </div>
        <div
          className={`${
            !showBottomTool && "hidden"
          } flex ml-auto gap-x-4 mt-4 sticky bottom-0 px-4 py-2 z-[2] bg-surfaceLight dark:bg-backgroundDark dark:text-textPrimaryDark w-full items-center`}
        >
          {bottomToolbarChild}
          <div className="flex ml-auto gap-x-4 mb-2 ">
            {negativeLabel.length > 0 && (
              <button
                onClick={() => {
                  negativeCallback && negativeCallback();
                  setOpened(false);
                }}
                className="bg-surface font-sfProTextMedium px-5 py-1 rounded hover:bg-onHoverBg active:bg-onSecondary duration-200 capitalize"
              >
                {negativeLabel}
              </button>
            )}

            {positiveLabel.length > 0 && (
              <button
                disabled={disableSubmit}
                onClick={() => {
                  positiveCallback && positiveCallback();
                  if (!isFormModal) {
                    setOpened(false);
                  }
                }}
                type="button"
                className="font-medium bg- bg-secondary hover:bg-blueButtonHoverBg active:bg-blueButtonActiveBg duration-200 px-5 py-1 text-surface rounded capitalize"
              >
                {positiveLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Dialog;
