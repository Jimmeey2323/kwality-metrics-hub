
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MetricsTable from '@/components/MetricsTable';
import { parseCSV, ParsedCSVData } from '@/utils/csvParser';

const Dashboard = () => {
  const [data, setData] = useState<ParsedCSVData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/Metrics.csv');
        if (!response.ok) {
          throw new Error('Failed to load CSV file');
        }
        const csvText = await response.text();
        console.log('CSV Text loaded:', csvText.substring(0, 500) + '...');
        const parsedData = parseCSV(csvText);
        console.log('Parsed data:', parsedData);
        setData(parsedData);
      } catch (err) {
        console.error('Error loading CSV:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  const locations = Object.keys(data);
  
  // Updated location display names to match CSV data exactly
  const locationDisplayNames = {
    'Kenkere House': 'Kenkere House',
    'Supreme HQ Bandra': 'Supreme HQ, Bandra', 
    'Kwality House Kemps Corner': 'Kwality House, Kemps Corner'
  };

  console.log('Available locations:', locations);
  console.log('Location display names:', locationDisplayNames);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-800">Loading Metrics Data...</h2>
          <p className="text-slate-600 mt-2">Please wait while we load your performance metrics</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-red-200">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No Data Available</h2>
          <p className="text-slate-600">No metrics data found in the CSV file</p>
          <p className="text-slate-500 text-sm mt-2">Check console for debugging information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/90 via-blue-50/80 to-purple-50/90 backdrop-blur-xl border-b border-white/30 shadow-xl">
        <div className="max-w-full mx-auto px-8 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-4">
              Performance Analytics Dashboard
            </h1>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto leading-relaxed">
              Comprehensive metrics analysis across all locations with advanced visualizations and growth indicators
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto mt-6 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-8 py-8">
        <Tabs defaultValue={locations[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl p-2 mb-8">
            {locations.map((location) => (
              <TabsTrigger 
                key={location}
                value={location}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/80 transition-all duration-300 rounded-xl px-6 py-4 text-lg font-semibold"
              >
                <div className="text-center">
                  <div className="font-bold">{locationDisplayNames[location as keyof typeof locationDisplayNames] || location}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {Object.keys(data[location]).length} metrics available
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {locations.map((location) => (
            <TabsContent key={location} value={location} className="mt-0">
              <MetricsTable 
                locationData={data[location]} 
                locationName={locationDisplayNames[location as keyof typeof locationDisplayNames] || location}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
