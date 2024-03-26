import { Popover } from "@mantine/core";
import { FloatingPosition } from "@mantine/core";
import React, { CSSProperties } from "react";

interface PopupProps {
  opened: boolean;
  setOpened?: React.Dispatch<React.SetStateAction<boolean>>;
  target: React.ReactNode;
  children: React.ReactNode;
  position?: FloatingPosition | undefined;
  width?: string;
  withArrow?: boolean;
  dropdownStyles?: CSSProperties;
}

const PopupMenu = ({
  opened,
  setOpened,
  children,
  target,
  position = "bottom",
  width = "auto",
  withArrow = false,
  dropdownStyles = {
    zIndex: 700,
    padding: 0,
    borderRadius: "12px",
    position: "absolute",
    overflow: "hidden",
  },
}: PopupProps) => {
  return (
    <Popover
      width={width ? width : "auto"}
      position={position}
      withArrow={withArrow}
      opened={opened}
      onChange={setOpened}
      zIndex={600}
      styles={{
        dropdown: dropdownStyles,
      }}
    >
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
};

export default PopupMenu;
