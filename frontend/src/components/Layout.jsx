import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, FileImage, Square, Brain, Sparkles, ScanSearch, Maximize, Sofa, Wrench,
  Zap, ClipboardCheck, Lightbulb, DollarSign, BarChart3, Palette, Wand2,
  Heart, Box, Eye, ShoppingCart, Image, Package, Users, Layers,
  CreditCard, User, Settings, Shield, Menu, X, LogOut, ChevronDown, ChevronRight,
  Building2
} from 'lucide-react';

const sidebarSections = [
  {
    label: null,
    items: [
      { path: '/', icon: Home, label: 'Dashboard' },
    ],
  },
  {
    label: 'Floor Plan Analysis',
    items: [
      { path: '/floor-plans', icon: FileImage, label: 'Floor Plans' },
      { path: '/rooms', icon: Square, label: 'Rooms' },
      { path: '/ai-analysis', icon: Brain, label: 'AI Analysis' },
      { path: '/full-analysis', icon: Sparkles, label: 'Full Analysis Results' },
      { path: '/room-detector', icon: ScanSearch, label: 'Room Detection' },
      { path: '/optimize-layout', icon: Maximize, label: 'Layout Optimization' },
      { path: '/home-staging', icon: Home, label: 'Home Staging' },
      { path: '/furniture-placer', icon: Sofa, label: 'Furniture Placement' },
      { path: '/maintenance-predictor', icon: Wrench, label: 'Maintenance Prediction' },
      { path: '/energy-auditor', icon: Zap, label: 'Energy Audit' },
      { path: '/home-inspector', icon: ClipboardCheck, label: 'Home Inspection' },
      { path: '/ai-suggestions', icon: Lightbulb, label: 'Renovation Suggestions' },
      { path: '/cost-estimate', icon: DollarSign, label: 'Cost Estimates' },
      { path: '/dimensions', icon: BarChart3, label: 'Room Dimensions' },
      { path: '/ai-material-contractor', icon: Wrench, label: 'Materials & Contractors AI' },
    ],
  },
  {
    label: 'Interior Design',
    items: [
      { path: '/designs', icon: Image, label: 'My Designs' },
      { path: '/ai-design-tools', icon: Wand2, label: 'AI Design Tools' },
      { path: '/style-presets', icon: Palette, label: 'Style Presets' },
      { path: '/furniture-catalog', icon: Box, label: 'Furniture Catalog' },
      { path: '/color-palettes', icon: Palette, label: 'Color Palettes' },
      { path: '/ar-viewer', icon: Eye, label: 'AR Viewer' },
      { path: '/shopping-lists', icon: ShoppingCart, label: 'Shopping Lists' },
      { path: '/inspirations', icon: Heart, label: 'Inspirations' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { path: '/materials', icon: Package, label: 'Materials' },
      { path: '/contractors', icon: Users, label: 'Contractors' },
      { path: '/templates', icon: Layers, label: 'Templates' },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/subscription', icon: CreditCard, label: 'Subscription' },
      { path: '/profile', icon: User, label: 'Profile' },
    ],
  },
];

export default function Layout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState(() => {
    const initial = {};
    sidebarSections.forEach((section) => {
      if (section.label) {
        initial[section.label] = true;
      }
    });
    return initial;
  });
  const location = useLocation();

  const toggleSection = (label) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const sidebarWidth = collapsed ? 'w-20' : 'w-72';

  const isAdmin = user?.role === 'admin' || user?.is_admin;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full ${sidebarWidth} bg-gray-900 text-gray-300 flex flex-col transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 shrink-0">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <Building2 className="h-8 w-8 text-indigo-400 shrink-0" />
            {!collapsed && (
              <span className="text-lg font-bold text-white whitespace-nowrap">
                AI Warehouse
              </span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center h-8 border-b border-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
          {sidebarSections.map((section, sectionIdx) => {
            const isExpanded = section.label ? expandedSections[section.label] : true;

            return (
              <div key={sectionIdx}>
                {/* Section header */}
                {section.label && (
                  <button
                    onClick={() => toggleSection(section.label)}
                    className={`flex items-center w-full mt-4 mb-1 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors ${
                      collapsed ? 'justify-center' : 'justify-between'
                    }`}
                  >
                    {!collapsed && <span>{section.label}</span>}
                    {collapsed ? (
                      <span className="w-6 border-t border-gray-700" />
                    ) : (
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          isExpanded ? '' : '-rotate-90'
                        }`}
                      />
                    )}
                  </button>
                )}

                {/* Section items */}
                {(isExpanded || collapsed) &&
                  section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.path === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-indigo-600/20 text-indigo-400'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            );
          })}

          {/* Admin Panel - conditional */}
          {isAdmin && (
            <div>
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? 'Admin Panel' : undefined}
                className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Shield className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Admin Panel</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* User info + Logout at bottom */}
        <div className="shrink-0 border-t border-gray-800 p-4">
          {user && (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-indigo-400" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          {collapsed && user && (
            <button
              onClick={onLogout}
              title="Logout"
              className="mt-3 w-full flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top header bar */}
        <header className="sticky top-0 z-30 h-16 bg-white shadow-sm flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1" />

          {/* Header right side - user quick info */}
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="hidden sm:block text-sm font-medium">
                {user?.name || user?.email || 'Guest'}
              </span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
