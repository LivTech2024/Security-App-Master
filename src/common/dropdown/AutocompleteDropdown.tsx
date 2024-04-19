import { Popover } from '@mantine/core';
import { FloatingPosition } from '@mantine/core';
import React from 'react';

interface AutocompleteDropdownProps {
  opened: boolean;
  setOpened?: React.Dispatch<React.SetStateAction<boolean>>;
  target: React.ReactNode;
  children: React.ReactNode;
  position?: FloatingPosition | undefined;
  width?: string;
  withArrow?: boolean;
}

const AutocompleteDropdown = ({
  opened,
  setOpened,
  children,
  target,
  position = 'bottom',
  width = 'auto',
  withArrow = false,
}: AutocompleteDropdownProps) => {
  return (
    <Popover
      width={width ? width : 'auto'}
      position={position}
      withArrow={withArrow}
      opened={opened}
      onChange={setOpened}
      styles={{
        arrow: {
          backgroundColor: `#FFFFFF`,
          border: `#FFFFFF`,
        },
        dropdown: {
          padding: 0,
          backgroundColor: `#FFFFFF`,
          border: `#FFFFFF`,
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          position: 'absolute',
          overflow: 'hidden',
        },
      }}
    >
      <Popover.Target>{target}</Popover.Target>
      <Popover.Dropdown>{children}</Popover.Dropdown>
    </Popover>
  );
};

export default AutocompleteDropdown;
