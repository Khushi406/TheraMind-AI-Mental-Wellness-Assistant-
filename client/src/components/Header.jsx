import { useState } from 'react';
import { useLocation, Link } from 'wouter';

export default function Header() {
  const [location, setLocation] = useLocation();
  
  const tabs = [
    { name: 'Journal', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Insights', path: '/insights' },
    { name: '🧠 AI Insights', path: '/ai-insights' }
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <i className="fas fa-brain text-white"></i>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">TheraMind</h1>
          </div>
        </Link>
        <div className="flex space-x-2">
          <button className="text-neutral-600 hover:text-primary transition-colors duration-300">
            <i className="fas fa-user-circle text-xl"></i>
          </button>
          <button className="text-neutral-600 hover:text-primary transition-colors duration-300">
            <i className="fas fa-cog text-xl"></i>
          </button>
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
