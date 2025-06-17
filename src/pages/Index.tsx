
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
  
  const locationDisplayNames = {
    'Kenkere House': 'Kenkere House',
    'Supreme HQ Bandra': 'Supreme HQ Bandra', 
    'Kwality House Kemps Corner': 'Kwality House Kemps Corner'
  };

  console.log('Available locations:', locations);
  console.log('Location display names:', locationDisplayNames);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading Metrics Data</h2>
          <p className="text-gray-600 mt-2">Please wait while we load your performance metrics</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-sm border border-red-200 max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-sm border max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">No metrics data found in the CSV file</p>
          <p className="text-gray-500 text-sm mt-2">Check console for debugging information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Performance Analytics Dashboard
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Comprehensive metrics analysis across all locations with detailed insights and growth indicators
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue={locations[0]} className="w-full">
          {/* Location Tabs */}
          <div className="mb-8">
            <TabsList className="inline-flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              {locations.map((location) => (
                <TabsTrigger 
                  key={location}
                  value={location}
                  className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-sm text-gray-700 hover:text-gray-900 transition-colors px-6 py-3 text-sm font-medium rounded-md"
                >
                  <div className="text-center">
                    <div className="font-semibold">{locationDisplayNames[location as keyof typeof locationDisplayNames] || location}</div>
                    <div className="text-xs opacity-75 mt-0.5">
                      {Object.keys(data[location]).length} metrics
                    </div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
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
