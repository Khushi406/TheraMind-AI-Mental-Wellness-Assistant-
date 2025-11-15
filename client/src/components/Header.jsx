import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { logout, getUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Header() {
  const [location, setLocation] = useLocation();
  const user = getUser();
  
  const tabs = [
    { name: 'Journal', path: '/journal' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Insights', path: '/insights' },
    { name: '🧠 AI Insights', path: '/ai-insights' }
  ];

  const handleLogout = () => {
    logout();
    setLocation('/auth');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/journal">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <i className="fas fa-brain text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">TheraMind</h1>
          </div>
        </Link>
        <div className="flex items-center space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/journal')}>
                <i className="fas fa-book mr-2"></i>
                Journal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
                <i className="fas fa-chart-line mr-2"></i>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 flex border-b">
        {tabs.map(tab => (
          <Link key={tab.path} href={tab.path}>
            <div className={`tab px-6 py-3 font-medium border-b-2 transition-all duration-300 cursor-pointer ${
              location === tab.path 
                ? 'border-primary text-neutral-800' 
                : 'border-transparent text-neutral-600 hover:text-neutral-800 hover:border-neutral-300'
            }`}>
              {tab.name}
            </div>
          </Link>
        ))}
      </div>
    </header>
  );
}
