import { useState } from 'react';
import { LayoutDashboard, User, Users, FileText, LogOut, Building2, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

type SidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['quotes']);

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'clients', label: 'Clients', icon: Users },
    { 
      id: 'quotes', 
      label: 'Devis / Factures', 
      icon: FileText,
      subItems: [
        { id: 'quotes-generator', label: 'Générateur', icon: FileText },
        { id: 'quotes-tracking', label: 'Suivi', icon: FileText }
      ]
    },
  ];

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsOpen(false);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed lg:static top-0 left-0 w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen flex flex-col shadow-xl transition-transform duration-300 transform z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">Clients Manager</h1>
              <p className="text-xs text-slate-400">Gestion professionnelle</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 sm:p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => activeTab === sub.id));
              const isExpanded = expandedItems.includes(item.id);
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <li key={item.id}>
                  <div>
                    <button
                      onClick={() => {
                        if (hasSubItems) {
                          toggleExpanded(item.id);
                        } else {
                          handleTabChange(item.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {hasSubItems && (
                        <span className="w-4 h-4 flex items-center justify-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </span>
                      )}
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base flex-1 text-left">{item.label}</span>
                    </button>
                    
                    {hasSubItems && isExpanded && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {item.subItems?.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = activeTab === subItem.id;
                          return (
                            <li key={subItem.id}>
                              <button
                                onClick={() => handleTabChange(subItem.id)}
                                className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 ${
                                  isSubActive
                                    ? 'bg-blue-500 text-white'
                                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                              >
                                <SubIcon className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium text-xs sm:text-sm">{subItem.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 sm:p-4 border-t border-slate-700">
          <button
            onClick={() => handleTabChange('logout')}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Déconnexion</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
