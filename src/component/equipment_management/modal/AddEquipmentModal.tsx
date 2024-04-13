import React from "react";
import Dialog from "../../../common/Dialog";

const AddEquipmentModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Dialog opened={opened} setOpened={setOpened} title="Add Equipment">
      <div>Hello</div>
    </Dialog>
  );
};

export default AddEquipmentModal;
