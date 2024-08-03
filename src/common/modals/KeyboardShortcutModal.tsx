import { HotkeyItem, useHotkeys } from '@mantine/hooks';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../@types/enum';
import Dialog from '../Dialog';

interface KeyboardShortcutModalProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GetKeyboardShortcuts = () => {
  const navigate = useNavigate();

  return [
    {
      group: 'Navigation',
      functionality: 'Home',
      keyCombination: {
        mainKey: 'Escape',
      },
      callback: () => {
        navigate(PageRoutes.HOME);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Employee Management',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'E',
      },
      callback: () => {
        navigate(PageRoutes.EMPLOYEE_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Shift Scheduling',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'S',
      },
      callback: () => {
        navigate(PageRoutes.SCHEDULES);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Callouts',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'C',
      },
      callback: () => {
        navigate(PageRoutes.CALL_OUT_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Patrolling',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'P',
      },
      callback: () => {
        navigate(PageRoutes.PATROLLING_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Equipment Management',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'Q',
      },
      callback: () => {
        navigate(PageRoutes.KEY_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Key Management',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'K',
      },
      callback: () => {
        navigate(PageRoutes.KEY_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Billing & Invoicing',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'B',
      },
      callback: () => {
        navigate(PageRoutes.PAYMENTS_AND_BILLING);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Training & Certifications',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'T',
      },
      callback: () => {
        navigate(PageRoutes.TRAINING_AND_CERTIFICATION_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Visitor Management',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'V',
      },
      callback: () => {
        navigate(PageRoutes.VISITOR_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Reports',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'R',
      },
      callback: () => {
        navigate(PageRoutes.REPORTS);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Communication Center',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'M',
      },
      callback: () => {
        navigate(PageRoutes.MESSAGING);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Document Repository',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'D',
      },
      callback: () => {
        navigate(PageRoutes.DOCUMENT_REPOSITORY);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Emergency Response',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'X',
      },
      callback: () => {
        navigate(PageRoutes.EMERGENCY_RESPONSE_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Time & Attendance',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'Z',
      },
      callback: () => {
        navigate(PageRoutes.TIME_AND_ATTENDANCE_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Audit',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'A',
      },
      callback: () => {
        navigate(PageRoutes.AUDIT_DASHBOARD);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Performance Assurance',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'F',
      },
      callback: () => {
        navigate(PageRoutes.PERFORMANCE_ASSURANCE);
      },
    },
    {
      group: 'Navigation',
      functionality: 'Task Assignment & Tracking',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'W',
      },
      callback: () => {
        navigate(PageRoutes.TASK_AND_TRACKING_LIST);
      },
    },
    {
      group: 'Navigation',
      functionality: 'HR System',
      keyCombination: {
        mainKey: 'Shift',
        childKey: 'H',
      },
      callback: () => {
        navigate(PageRoutes.HRM_HOME);
      },
    },

    //*Actions

    {
      group: 'Actions',
      functionality: 'Employee Create',
      keyCombination: {
        mainKey: 'Alt',
        childKey: 'E',
      },
      callback: () => {
        navigate(PageRoutes.EMPLOYEE_CREATE_OR_EDIT);
      },
    },
    {
      group: 'Actions',
      functionality: 'Shift Create',
      keyCombination: {
        mainKey: 'Alt',
        childKey: 'S',
      },
      callback: () => {
        navigate(PageRoutes.SHIFT_CREATE_OR_EDIT);
      },
    },
    {
      group: 'Actions',
      functionality: 'Callout Create',
      keyCombination: {
        mainKey: 'Alt',
        childKey: 'C',
      },
      callback: () => {
        navigate(PageRoutes.CALL_OUT_LIST + '?action=create');
      },
    },
    {
      group: 'Actions',
      functionality: 'Patrol Create',
      keyCombination: {
        mainKey: 'Alt',
        childKey: 'P',
      },
      callback: () => {
        navigate(PageRoutes.PATROLLING_CREATE_OR_EDIT);
      },
    },
    {
      group: 'Actions',
      functionality: 'Invoice Create',
      keyCombination: {
        mainKey: 'Alt',
        childKey: 'I',
      },
      callback: () => {
        navigate(PageRoutes.INVOICE_GENERATE);
      },
    },
    {
      group: 'Actions',
      functionality: 'Equipment Create',
      keyCombination: {
        mainKey: 'Alt',
        childKey: 'Q',
      },
      callback: () => {
        navigate(PageRoutes.EQUIPMENT_LIST + `?action=create`);
      },
    },
    {
      group: 'Actions',
      functionality: 'Key Create',
      keyCombination: {
        mainKey: 'Alt',
        childKey: 'K',
      },
      callback: () => {
        navigate(PageRoutes.KEY_LIST + `?action=create`);
      },
    },

    //* Activities
    {
      group: 'Activities',
      functionality: 'Back',
      keyCombination: {
        mainKey: 'Ctrl',
        childKey: 'B',
      },
      callback: () => {
        navigate(-1);
      },
    },
    {
      group: 'Activities',
      functionality: 'Forward',
      keyCombination: {
        mainKey: 'Ctrl',
        childKey: 'F',
      },
      callback: () => {
        navigate(1);
      },
    },
    {
      group: 'Activities',
      functionality: 'Save',
      keyCombination: {
        mainKey: 'Ctrl',
        childKey: 'S',
      },
      alternateKeyCombination: { mainKey: 'Enter' },
      callback: () => {},
    },
  ];
};

const KeyboardShortcutModal = ({
  opened,
  setOpened,
}: KeyboardShortcutModalProps) => {
  const shortcuts = GetKeyboardShortcuts();

  const hotkeysArray = shortcuts.map((shortcut) => {
    const { mainKey, childKey } = shortcut.keyCombination;

    // Construct the key combination string
    const keyCombination = `${mainKey}+${childKey}`;

    // Create a HotkeyItem array element with the key combination and callback function
    return [
      keyCombination,
      () => {
        // Invoke the callback function passing the event
        shortcut.callback();
      },
    ];
  });

  useHotkeys(hotkeysArray as HotkeyItem[]);

  const getColumnShortcuts = (group: string) => {
    return shortcuts
      .filter((shortcut) => shortcut.group === group)
      .map((shortcut, index) => (
        <div
          key={index}
          className="flex items-center justify-between w-full border-b border-inputBorder p-2 text-sm"
        >
          <div className="text-textSecondary">{shortcut.functionality}</div>
          <div className="bg-dialogCardBg  p-2 w-1/4 min-w-fit flex justify-center rounded border border-inputBorder font-semibold text-textSecondary ">
            {shortcut.keyCombination.mainKey}
            {shortcut.keyCombination.childKey &&
              ' + ' + shortcut.keyCombination.childKey}{' '}
            {shortcut.alternateKeyCombination &&
              `/ ${shortcut.alternateKeyCombination.mainKey}`}
          </div>
        </div>
      ));
  };

  window.addEventListener('keydown', () => setOpened(false));

  return (
    <Dialog
      title="Shortcuts"
      opened={opened}
      setOpened={setOpened}
      size="90%"
      positiveLabel="ok"
      negativeLabel=""
      className="px-4 py-2"
    >
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col">
          <div className="font-semibold p-2 border-b border-inputBorder sticky top-0">
            Navigation
          </div>
          {getColumnShortcuts('Navigation')}
        </div>
        <div className="flex flex-col">
          <div className="font-semibold p-2 border-b border-inputBorder sticky top-0">
            Actions
          </div>
          {getColumnShortcuts('Actions')}
        </div>
        <div className="flex flex-col">
          <div className="font-semibold p-2 border-b border-inputBorder sticky top-0">
            Activities
          </div>
          {getColumnShortcuts('Activities')}
        </div>
      </div>
    </Dialog>
  );
};

export default KeyboardShortcutModal;
