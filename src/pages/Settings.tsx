
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings';
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-4 py-6">
        <Tab.Group>
          <Tab.List className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
            <Tab className={({ selected }) =>
              `w-full py-2 px-4 rounded-lg text-sm font-medium focus:outline-none transition
              ${selected ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`
            }>Profile</Tab>
            <Tab className={({ selected }) =>
              `w-full py-2 px-4 rounded-lg text-sm font-medium focus:outline-none transition
              ${selected ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`
            }>Billing</Tab>
            <Tab className={({ selected }) =>
              `w-full py-2 px-4 rounded-lg text-sm font-medium focus:outline-none transition
              ${selected ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`
            }>Security</Tab>
          </Tab.List>
          <Tab.Panels className="mt-4 w-full max-w-xl mx-auto">
            <Tab.Panel>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-4">
                <PreferencesSettings />
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-4">
                <BillingSettings />
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-4">
                <SecuritySettings />
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      <div className="sticky bottom-0 z-50 bg-white dark:bg-black p-4 w-full max-w-xl mx-auto">
        <Link to="/">
          <button className="w-full bg-gray-700 text-white rounded-lg py-2 shadow">
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Settings;
