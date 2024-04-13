import React from "react";
import Dialog from "../../../common/Dialog";

const EquipAllocationModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Dialog opened={opened} setOpened={setOpened} title="Allocate equipment">
      <div>Hello</div>
    </Dialog>
  );
};

export default EquipAllocationModal;
