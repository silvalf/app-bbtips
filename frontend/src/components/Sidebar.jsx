import React, { useState, createContext, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Home,
  LayoutDashboard,
  Wallet,
  FileText,
  Calculator,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Sidebar Context
const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Menu items configuration
const menuItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/bancas', label: 'Bancas', icon: Wallet },
  { path: '/banca/1', label: 'Banca Detalhe', icon: TrendingUp },
  { path: '/padroes', label: 'Padrões', icon: FileText },
  { path: '/simulador', label: 'Simulador', icon: Calculator },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

// Sidebar Item Component
const SidebarItem = ({ item, isCollapsed, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  const linkContent = (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
        "hover:bg-slate-700/50",
        isActive 
          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-l-2 border-cyan-400" 
          : "text-slate-400 hover:text-slate-200",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-colors",
        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
      )} />
      {!isCollapsed && (
        <span className="font-medium truncate">{item.label}</span>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
};

// Main Sidebar Component
export const Sidebar = () => {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();

  return (
    <TooltipProvider>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out",
          "flex flex-col",
          // Desktop
          "lg:relative lg:translate-x-0",
          isCollapsed ? "lg:w-[70px]" : "lg:w-[260px]",
          // Mobile
          "w-[260px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-slate-800",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">BB Tips</span>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={closeMobile}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.path} 
                item={item} 
                isCollapsed={isCollapsed}
                onClick={closeMobile}
              />
            ))}
          </div>
        </nav>

        {/* Footer / Collapse Toggle */}
        <div className="p-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn(
              "w-full text-slate-400 hover:text-white hover:bg-slate-800 hidden lg:flex",
              isCollapsed ? "justify-center" : "justify-start gap-2"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Recolher</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

// Mobile Header Component
export const MobileHeader = () => {
  const { toggleMobile } = useSidebar();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobile}
        className="text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <Menu className="w-5 h-5" />
      </Button>
      <div className="flex items-center gap-2 ml-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white">BB Tips</span>
      </div>
    </header>
  );
};

export default Sidebar;
