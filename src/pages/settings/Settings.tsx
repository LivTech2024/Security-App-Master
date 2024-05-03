import { Tabs } from '@mantine/core';
import CompanyInfo from '../../component/settings/CompanyInfo';
import AdminInfo from '../../component/settings/AdminInfo';
import AccountSettings from '../../component/settings/AccountSettings';
import PageHeader from '../../common/PageHeader';

const account_settings = () => {
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Settings" />

      <Tabs defaultValue="company_info">
        <Tabs.List justify="center">
          <Tabs.Tab
            className="text-base mx-1"
            value="company_info"
            bg={'#e5e7eb'}
            color="#363738af"
          >
            Company Info
          </Tabs.Tab>
          <Tabs.Tab
            className="text-base mx-1 "
            value="admin_info"
            bg={'#e5e7eb'}
            color="#363738af"
          >
            Admin Info
          </Tabs.Tab>
          <Tabs.Tab
            className="text-base mx-1"
            value="account_settings"
            bg={'#e5e7eb'}
            color="#363738af"
          >
            Account Settings
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="company_info">
          <CompanyInfo />
        </Tabs.Panel>

        <Tabs.Panel value="admin_info">
          <AdminInfo />
        </Tabs.Panel>

        <Tabs.Panel value="account_settings">
          <AccountSettings />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default account_settings;
