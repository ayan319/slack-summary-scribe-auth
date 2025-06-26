import { Tab } from '@headlessui/react';
import Link from 'next/link';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { BillingSettings } from '@/components/settings/BillingSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';

const Settings: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
    <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-4 py-6">
      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
          {['Profile', 'Billing', 'Security'].map((label) => (
            <Tab key={label} className={({ selected }) =>
              `w-full py-2 px-4 rounded-lg text-sm font-medium focus:outline-none transition
              ${selected ? 'bg-white dark:bg-gray-900 shadow text-blue-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`
            }>
              {label}
            </Tab>
          ))}
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
      <Link href="/" legacyBehavior>
        <a className="w-full block bg-gray-700 text-white rounded-lg py-2 shadow text-center">
          Back to Dashboard
        </a>
      </Link>
    </div>
  </div>
);

export default Settings;
// Remove or comment these if not used yet:
// import { ProfileSettings } from '@/components/settings/ProfileSettings';
// import { ApiKeysSettings } from '@/components/settings/ApiKeysSettings';
// import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
