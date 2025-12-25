import { MapPin, AlertCircle, BarChart3 } from 'lucide-react';

interface HeaderProps {
  activeView: 'map' | 'report' | 'dashboard';
  onViewChange: (view: 'map' | 'report' | 'dashboard') => void;
}

export default function Header({ activeView, onViewChange }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <MapPin className="text-blue-600" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CampusConnect</h1>
              <p className="text-blue-100 text-sm">Report. Track. Navigate.</p>
            </div>
          </div>

          <nav className="flex gap-2">
            <button
              onClick={() => onViewChange('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeView === 'map'
                  ? 'bg-white text-blue-600 font-semibold shadow-md'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <MapPin size={18} />
              <span className="hidden sm:inline">Map</span>
            </button>

            <button
              onClick={() => onViewChange('report')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeView === 'report'
                  ? 'bg-white text-blue-600 font-semibold shadow-md'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <AlertCircle size={18} />
              <span className="hidden sm:inline">Report Issue</span>
            </button>

            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeView === 'dashboard'
                  ? 'bg-white text-blue-600 font-semibold shadow-md'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <BarChart3 size={18} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
