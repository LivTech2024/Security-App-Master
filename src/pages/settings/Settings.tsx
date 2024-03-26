import { Tabs } from "@mantine/core";

const Settings = () => {
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Settings</span>
      </div>
      <Tabs defaultValue="gallery">
        <Tabs.List justify="center">
          <Tabs.Tab
            className="text-base mx-1"
            value="gallery"
            bg={"#e5e7eb"}
            color="#363738af"
          >
            Company info
          </Tabs.Tab>
          <Tabs.Tab
            className="text-base mx-1 "
            value="messages"
            bg={"#e5e7eb"}
            color="#363738af"
          >
            Admin Info
          </Tabs.Tab>
          <Tabs.Tab
            className="text-base mx-1"
            value="settings"
            bg={"#e5e7eb"}
            color="#363738af"
          >
            Account settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="gallery">Gallery tab content</Tabs.Panel>

        <Tabs.Panel value="messages">Messages tab content</Tabs.Panel>

        <Tabs.Panel value="settings">Settings tab content</Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default Settings;
