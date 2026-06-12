// src/components/sidebar.tsx
import { useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  LogOut,
  Menu,
} from 'lucide-react';
// import { useO } from '@/context/o-context';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const {logout , user} = {
    logout: ()=>{
        window.location.href = "/";
    },
    user:{name :"John Doe" , email : "user@gmail.com"}
  }
  const navItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
    {
      name: 'Social Accounts',
      icon: Users,
      path: '/accounts',
    },
    {
      name: 'Post Scheduler',
      icon: Calendar,
      path: '/scheduler',
    },
    {
      name: 'AI Composer',
      icon: Sparkles,
      path: '/ai-composer',
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed insert-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
      flex flex-col h-full transform transition-transform duration-200 ease-in-out md:relative
      md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full" }`} >
        {/* Logo/Header */}
        <div className="p-6 pb-4">
          <div className="text-xl tracking-tight text-slate-800 fles items-center gap-1.5">
              <img src='/logo.svg' alt='logo' className='size-6' />
              Schedular
            </div>
            
          </div>
        <div className='px-6 py-2'>
            <span className='text-xs text-slate-500 uppercase tracking-wider ' >Menu </span>

        </div>

        {/* Navigation Links */}
        <nav className="flex-1  px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/dashboard"}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'text-slate-500 hover:bg-slate-50 border-transparent hover:text-slate-700 '
                  }`}
                >
                  {isActive && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red rounded-l-full"></div>
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? '' : 'group-hover:scale-110'}`} />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-3  rounded-lg">
            <div className="w-10 h-10   rounded-full flex items-center bg-slate-200 justify-center font-bold text-black text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black truncate">{user?.name}</p>
              <p className="text-xs text-black truncate">{user?.email}</p>
            </div>
          </div>    

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5   rounded-lg transition-all font-medium group text-black"
          >
            <LogOut className="w-5 h-4 group-hover:scale-110 transition-transform  text-black" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-xl">
            {/* Logo/Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-lg">
                  SS
                </div>
                <span className="font-bold text-lg">Social Scheduler</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-3">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>
                      )}
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>

            {/* User Footer */}
            <div className="border-t border-gray-700 p-4 space-y-3">
              <div className="flex items-center gap-3 px-3 py-3 bg-gray-700/50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-200 rounded-lg hover:bg-red-600/30 transition-all font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}