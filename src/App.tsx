import { useState } from 'react';
import Header from './components/Header';
import CampusMap from './components/CampusMap';
import IssueReportForm from './components/IssueReportForm';
import IssueDashboard from './components/IssueDashboard';

function App() {
  const [activeView, setActiveView] = useState<'map' | 'report' | 'dashboard'>('map');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | undefined>();
  const [refreshMap, setRefreshMap] = useState(0);

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setSelectedLocation({ lat, lng, name });
  };

  const handleReportSuccess = () => {
    setRefreshMap((prev) => prev + 1);
    setActiveView('map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50">
      <Header activeView={activeView} onViewChange={setActiveView} />

      <main className="container mx-auto px-4 py-8">
        {/* MAP VIEW */}
        {activeView === 'map' && (
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{ height: 'calc(100vh - 140px)' }}
          >
            <CampusMap key={refreshMap} />
          </div>
        )}

        {/* REPORT ISSUE VIEW */}
        {activeView === 'report' && (
          <div className="max-w-5xl mx-auto">
            {/* SELECT ISSUE LOCATION CARD */}
            <div className="mb-10 bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                Select Issue Location
              </h2>

              <div
                className="bg-gray-50 rounded-xl overflow-hidden border"
                style={{ height: '60vh' }}
              >
                <CampusMap
                  selectMode={true}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>

            {/* ISSUE REPORT FORM */}
            <IssueReportForm
              onSuccess={handleReportSuccess}
              preselectedLocation={selectedLocation}
            />
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && <IssueDashboard />}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-10">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p className="font-semibold mb-2">
              CampusConnect - Making Campus Better Together
            </p>
            <p>
              Report issues, track progress, and navigate your campus efficiently.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
