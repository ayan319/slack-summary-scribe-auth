'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/providers/AuthProvider';
import { switchOrganization } from '@/lib/auth';

interface OrganizationSwitcherProps {
  onCreateOrganization?: () => void;
  onManageOrganization?: () => void;
}

export default function OrganizationSwitcher({
  onCreateOrganization,
  onManageOrganization,
}: OrganizationSwitcherProps) {
  const { organizations, currentOrganization, setCurrentOrganization } = useAuth();
  const [open, setOpen] = useState(false);

  const handleOrganizationSelect = async (orgId: string) => {
    const selectedOrg = organizations.find(org => org.id === orgId);
    if (selectedOrg && selectedOrg.id !== currentOrganization?.id) {
      setCurrentOrganization(selectedOrg);
      await switchOrganization(orgId);
    }
    setOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!currentOrganization) {
    return (
      <Button
        variant="outline"
        onClick={onCreateOrganization}
        className="w-full justify-start"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Organization
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentOrganization.avatar_url} />
              <AvatarFallback className="text-xs">
                {getInitials(currentOrganization.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{currentOrganization.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            
            <CommandGroup heading="Organizations">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.id}
                  onSelect={() => handleOrganizationSelect(org.id)}
                  className="flex items-center space-x-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={org.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {org.role}
                    </div>
                  </div>
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      currentOrganization?.id === org.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup>
              {onCreateOrganization && (
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    onCreateOrganization();
                  }}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Organization</span>
                </CommandItem>
              )}
              
              {onManageOrganization && currentOrganization && (
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    onManageOrganization();
                  }}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Manage Organization</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Organization stats component
export function OrganizationStats() {
  const { currentOrganization, organizations } = useAuth();

  if (!currentOrganization) return null;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold">{organizations.length}</div>
        <div className="text-sm text-muted-foreground">Organizations</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold capitalize">{currentOrganization.role}</div>
        <div className="text-sm text-muted-foreground">Your Role</div>
      </div>
    </div>
  );
}
