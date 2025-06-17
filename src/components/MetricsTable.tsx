
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricData, formatINRValue, getMonthColumns } from '@/utils/csvParser';

interface MetricsTableProps {
  locationData: {
    [metric: string]: {
      [category: string]: {
        [product: string]: MetricData;
      };
    };
  };
  locationName: string;
}

const GrowthIndicator: React.FC<{ current: number | null; previous: number | null }> = ({ current, previous }) => {
  if (!current || !previous || current === 0 || previous === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <Minus className="w-3 h-3" />
        <span className="text-xs">-</span>
      </div>
    );
  }

  const growth = ((current - previous) / previous) * 100;
  const isPositive = growth > 0;
  const isNeutral = Math.abs(growth) < 0.1;

  if (isNeutral) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Minus className="w-3 h-3" />
        <span className="text-xs">0%</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span className="text-xs">{Math.abs(growth).toFixed(1)}%</span>
    </div>
  );
};

const MetricsTable: React.FC<MetricsTableProps> = ({ locationData, locationName }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>(Object.keys(locationData)[0] || '');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const monthColumns = getMonthColumns();
  const availableMetrics = Object.keys(locationData);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const calculateCategoryTotal = (categoryData: { [product: string]: MetricData }, columnKey: string) => {
    return Object.values(categoryData).reduce((sum, productData) => {
      const value = productData.months[columnKey];
      return sum + (value || 0);
    }, 0);
  };

  const calculateMetricTotal = (metricData: { [category: string]: { [product: string]: MetricData } }, columnKey: string) => {
    return Object.values(metricData).reduce((sum, categoryData) => {
      return sum + calculateCategoryTotal(categoryData, columnKey);
    }, 0);
  };

  const groupColumnsByYear = () => {
    const grouped: { [year: number]: typeof monthColumns } = {};
    monthColumns.forEach(col => {
      if (!grouped[col.year]) grouped[col.year] = [];
      grouped[col.year].push(col);
    });
    return grouped;
  };

  const groupColumnsByQuarter = (yearColumns: typeof monthColumns) => {
    const grouped: { [quarter: number]: typeof monthColumns } = {};
    yearColumns.forEach(col => {
      if (!grouped[col.quarter]) grouped[col.quarter] = [];
      grouped[col.quarter].push(col);
    });
    return grouped;
  };

  const yearGroups = groupColumnsByYear();

  if (!selectedMetric || !locationData[selectedMetric]) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for this location
      </div>
    );
  }

  const metricData = locationData[selectedMetric];
  const isRevenueMetric = selectedMetric.toLowerCase().includes('sales') || 
                         selectedMetric.toLowerCase().includes('revenue') || 
                         selectedMetric.toLowerCase().includes('value') ||
                         selectedMetric.toLowerCase().includes('amount') ||
                         selectedMetric.toLowerCase().includes('vat');

  return (
    <div className="w-full bg-gradient-to-br from-white/80 via-blue-50/30 to-purple-50/20 p-6 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-xl">
      {/* Metric Selector */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent">
            {locationName} Performance Metrics
          </h2>
          <p className="text-slate-600 text-sm mt-2">Select a metric to analyze performance across categories and products</p>
        </div>
        
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList className="grid w-full bg-white/60 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-2" style={{ gridTemplateColumns: `repeat(${availableMetrics.length}, 1fr)` }}>
            {availableMetrics.map((metric) => (
              <TabsTrigger 
                key={metric} 
                value={metric}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/80 transition-all duration-300 rounded-xl px-4 py-3 text-sm font-medium"
              >
                {metric}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto rounded-3xl shadow-2xl border border-white/30 bg-white/70 backdrop-blur-xl">
        <Table className="min-w-full">
          <TableHeader className="sticky top-0 z-20">
            {/* Year Headers */}
            <TableRow className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 border-b border-slate-700">
              <TableHead className="sticky left-0 z-30 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white border-r border-slate-700 w-80 font-bold text-lg">
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  {selectedMetric}
                </div>
              </TableHead>
              {Object.entries(yearGroups).map(([year, columns]) => (
                <TableHead 
                  key={year}
                  colSpan={columns.length}
                  className="text-center font-bold text-white border-r border-slate-700 text-lg tracking-wide px-4"
                >
                  {year}
                </TableHead>
              ))}
            </TableRow>
            
            {/* Quarter Headers */}
            <TableRow className="bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 border-b border-slate-600">
              <TableHead className="sticky left-0 z-30 bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 text-slate-200 border-r border-slate-600"></TableHead>
              {Object.entries(yearGroups).map(([year, yearColumns]) => {
                const quarterGroups = groupColumnsByQuarter(yearColumns);
                return Object.entries(quarterGroups).map(([quarter, qColumns]) => (
                  <TableHead 
                    key={`${year}-Q${quarter}`}
                    colSpan={qColumns.length}
                    className="text-center font-bold text-slate-200 border-r border-slate-600 tracking-wider px-4"
                  >
                    Q{quarter}
                  </TableHead>
                ));
              })}
            </TableRow>
            
            {/* Month Headers */}
            <TableRow className="bg-gradient-to-r from-slate-700 via-blue-700 to-purple-700 border-b border-slate-500">
              <TableHead className="sticky left-0 z-30 bg-gradient-to-r from-slate-700 via-blue-700 to-purple-700 text-white border-r border-slate-500 font-bold">
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                  Category / Product
                </div>
              </TableHead>
              {monthColumns.map((column) => (
                <TableHead 
                  key={column.key}
                  className="text-center text-sm font-bold text-white min-w-[120px] border-r border-slate-500 px-4 tracking-wide"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {Object.entries(metricData).map(([category, categoryData]) => (
              <React.Fragment key={category}>
                {/* Category Row */}
                <TableRow 
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer bg-gradient-to-r from-blue-50/50 to-purple-50/30 border-b border-slate-200/50 group transition-all duration-300 hover:shadow-lg"
                  onClick={() => toggleCategory(category)}
                >
                  <TableCell className="sticky left-0 z-10 bg-gradient-to-r from-blue-50/80 to-purple-50/60 group-hover:from-blue-100/80 group-hover:to-purple-100/60 border-r border-slate-200/50 font-bold py-4 transition-all duration-300">
                    <div className="flex items-center gap-4 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full transition-all duration-200 hover:scale-110"
                      >
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="h-4 w-4 text-slate-700" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-700" />
                        )}
                      </Button>
                      <div className="flex flex-col">
                        <div className="font-bold text-slate-900 text-base">{category}</div>
                        <div className="text-sm text-blue-600 font-semibold bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                          {Object.keys(categoryData).length} products
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {monthColumns.map((column, index) => {
                    const currentValue = calculateCategoryTotal(categoryData, column.key);
                    const previousValue = index < monthColumns.length - 1 ? 
                      calculateCategoryTotal(categoryData, monthColumns[index + 1].key) : null;
                    
                    return (
                      <TableCell 
                        key={column.key}
                        className="text-center text-sm border-r border-slate-200/50 font-bold py-4 group-hover:bg-gradient-to-r group-hover:from-blue-50/50 group-hover:to-purple-50/50 transition-all duration-300"
                      >
                        <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/80 transition-all duration-200">
                          <span className={`font-bold text-base ${currentValue === 0 ? 'text-gray-400' : 'text-slate-900'}`}>
                            {currentValue === 0 ? '-' : isRevenueMetric ? formatINRValue(currentValue) : currentValue.toFixed(1)}
                          </span>
                          {currentValue > 0 && previousValue !== null && (
                            <GrowthIndicator 
                              current={currentValue} 
                              previous={previousValue} 
                            />
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                
                {/* Product Rows */}
                {expandedCategories.has(category) && Object.entries(categoryData).map(([product, productData]) => (
                  <TableRow 
                    key={`${category}-${product}`}
                    className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 bg-gradient-to-r from-slate-50/50 to-blue-50/30 border-b border-blue-200/50 transition-all duration-300 ease-in-out hover:shadow-md"
                  >
                    <TableCell className="sticky left-0 z-10 bg-gradient-to-r from-slate-50/50 to-blue-50/30 hover:from-indigo-50 hover:to-blue-50 border-r border-blue-200/50 pl-20 py-3 transition-all duration-300">
                      <div className="flex flex-col border-l-4 border-gradient-to-b from-blue-400 to-purple-500 pl-4 py-1 rounded-r-lg bg-white/60 shadow-sm">
                        <div className="font-bold text-slate-800 text-sm">{product}</div>
                      </div>
                    </TableCell>
                    {monthColumns.map((column, index) => {
                      const currentValue = productData.months[column.key];
                      const previousValue = index < monthColumns.length - 1 ? 
                        productData.months[monthColumns[index + 1].key] : null;
                      
                      return (
                        <TableCell 
                          key={column.key}
                          className="text-center text-sm border-r border-blue-200/50 py-3 hover:bg-white/80 transition-all duration-200"
                        >
                          <div className="flex flex-col items-center gap-2 p-2 rounded-lg">
                            <span className={`font-bold ${!currentValue || currentValue === 0 ? 'text-gray-400' : 'text-slate-800'}`}>
                              {!currentValue || currentValue === 0 ? '-' : isRevenueMetric ? formatINRValue(currentValue) : currentValue.toFixed(1)}
                            </span>
                            {currentValue && currentValue > 0 && previousValue !== null && (
                              <GrowthIndicator 
                                current={currentValue} 
                                previous={previousValue} 
                              />
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
            
            {/* Totals Row */}
            <TableRow className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 font-bold border-t-4 border-emerald-500 shadow-lg">
              <TableCell className="sticky left-0 z-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 border-r border-emerald-400 font-bold text-white py-4 text-lg">
                <div className="flex items-center gap-3 px-4">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  TOTALS
                </div>
              </TableCell>
              {monthColumns.map((column) => {
                const total = calculateMetricTotal(metricData, column.key);
                return (
                  <TableCell 
                    key={column.key}
                    className="text-center font-bold border-r border-emerald-400 text-white py-4 text-base tracking-wide"
                  >
                    <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                      {total === 0 ? '-' : isRevenueMetric ? formatINRValue(total) : total.toFixed(1)}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MetricsTable;
