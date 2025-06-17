
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
      <div className="flex items-center gap-1 text-slate-400">
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
      <div className="flex items-center gap-1 text-slate-500">
        <Minus className="w-3 h-3" />
        <span className="text-xs">0%</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      <span className="text-xs font-medium">{Math.abs(growth).toFixed(1)}%</span>
    </div>
  );
};

const MetricsTable: React.FC<MetricsTableProps> = ({ locationData, locationName }) => {
  const [selectedMetric, setSelectedMetric] = useState<string>(Object.keys(locationData)[0] || '');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const monthColumns = getMonthColumns();
  const availableMetrics = Object.keys(locationData);

  console.log('MetricsTable - locationData:', locationData);
  console.log('MetricsTable - availableMetrics:', availableMetrics);
  console.log('MetricsTable - selectedMetric:', selectedMetric);

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
      <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
        <p className="text-lg">No data available for this metric</p>
        <p className="text-sm mt-2 text-slate-400">Available metrics: {availableMetrics.join(', ')}</p>
      </div>
    );
  }

  const metricData = locationData[selectedMetric];
  const categories = Object.keys(metricData);
  
  console.log('MetricsTable - metricData:', metricData);
  console.log('MetricsTable - categories:', categories);

  const isRevenueMetric = selectedMetric.toLowerCase().includes('sales') || 
                         selectedMetric.toLowerCase().includes('revenue') || 
                         selectedMetric.toLowerCase().includes('value') ||
                         selectedMetric.toLowerCase().includes('amount') ||
                         selectedMetric.toLowerCase().includes('vat');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
        <h2 className="text-3xl font-light text-slate-900 mb-3">{locationName}</h2>
        <p className="text-slate-600 text-lg">Performance metrics across categories and products</p>
      </div>

      {/* Metric Selector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
          <div className="border-b border-slate-100 bg-slate-50/50">
            <TabsList className="w-full justify-start bg-transparent h-auto p-6 gap-2 overflow-x-auto">
              {availableMetrics.map((metric) => (
                <TabsTrigger 
                  key={metric} 
                  value={metric}
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap text-slate-600 hover:text-slate-900 transition-all duration-200 px-6 py-3 text-sm font-medium rounded-lg border border-transparent data-[state=active]:border-slate-800"
                >
                  {metric}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-8">
            <div className="bg-slate-50/30 rounded-xl overflow-hidden border border-slate-200">
              <Table className="min-w-full">
                <TableHeader className="sticky top-0 z-20">
                  {/* Year Headers */}
                  <TableRow className="bg-slate-900 border-b border-slate-800 hover:bg-slate-900">
                    <TableHead className="sticky left-0 z-30 bg-slate-900 text-white border-r border-slate-700 w-80 font-medium">
                      <div className="px-6 py-4 text-sm">
                        {selectedMetric}
                      </div>
                    </TableHead>
                    {Object.entries(yearGroups).map(([year, columns]) => (
                      <TableHead 
                        key={year}
                        colSpan={columns.length}
                        className="text-center font-medium text-white border-r border-slate-700 text-sm px-4"
                      >
                        {year}
                      </TableHead>
                    ))}
                  </TableRow>
                  
                  {/* Quarter Headers */}
                  <TableRow className="bg-slate-800 border-b border-slate-700 hover:bg-slate-800">
                    <TableHead className="sticky left-0 z-30 bg-slate-800 text-slate-300 border-r border-slate-700"></TableHead>
                    {Object.entries(yearGroups).map(([year, yearColumns]) => {
                      const quarterGroups = groupColumnsByQuarter(yearColumns);
                      return Object.entries(quarterGroups).map(([quarter, qColumns]) => (
                        <TableHead 
                          key={`${year}-Q${quarter}`}
                          colSpan={qColumns.length}
                          className="text-center font-medium text-slate-300 border-r border-slate-700 text-xs px-4"
                        >
                          Q{quarter}
                        </TableHead>
                      ));
                    })}
                  </TableRow>
                  
                  {/* Month Headers */}
                  <TableRow className="bg-slate-700 border-b border-slate-600 hover:bg-slate-700">
                    <TableHead className="sticky left-0 z-30 bg-slate-700 text-white border-r border-slate-600 font-medium">
                      <div className="px-6 py-4 text-sm">
                        Category / Product
                      </div>
                    </TableHead>
                    {monthColumns.map((column) => (
                      <TableHead 
                        key={column.key}
                        className="text-center text-xs font-medium text-white min-w-[100px] border-r border-slate-600 px-3"
                      >
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {categories.map((category) => {
                    const categoryData = metricData[category];
                    const products = Object.keys(categoryData);
                    
                    console.log(`Rendering category: ${category}, products:`, products);
                    
                    return (
                      <React.Fragment key={category}>
                        {/* Category Row */}
                        <TableRow 
                          className="hover:bg-slate-50 cursor-pointer bg-white border-b border-slate-100 group transition-colors"
                          onClick={() => toggleCategory(category)}
                        >
                          <TableCell className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-100 font-medium py-4 transition-colors">
                            <div className="flex items-center gap-3 px-6">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-slate-100 rounded-md"
                              >
                                {expandedCategories.has(category) ? (
                                  <ChevronDown className="h-3 w-3 text-slate-600" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-slate-600" />
                                )}
                              </Button>
                              <div>
                                <div className="font-medium text-slate-900 text-sm">{category}</div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {products.length} products
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
                                className="text-center text-sm border-r border-slate-100 py-4 group-hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`font-medium text-sm ${currentValue === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                                    {currentValue === 0 ? '—' : isRevenueMetric ? formatINRValue(currentValue) : currentValue.toFixed(1)}
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
                        {expandedCategories.has(category) && products.map((product) => {
                          const productData = categoryData[product];
                          console.log(`Rendering product: ${product}`, productData);
                          
                          return (
                            <TableRow 
                              key={`${category}-${product}`}
                              className="hover:bg-blue-50/50 bg-slate-50/50 border-b border-slate-100 transition-colors"
                            >
                              <TableCell className="sticky left-0 z-10 bg-slate-50/50 hover:bg-blue-50/50 border-r border-slate-100 pl-20 py-3 transition-colors">
                                <div className="text-sm text-slate-700 font-medium">{product}</div>
                              </TableCell>
                              {monthColumns.map((column, index) => {
                                const currentValue = productData.months[column.key];
                                const previousValue = index < monthColumns.length - 1 ? 
                                  productData.months[monthColumns[index + 1].key] : null;
                                
                                return (
                                  <TableCell 
                                    key={column.key}
                                    className="text-center text-sm border-r border-slate-100 py-3 hover:bg-blue-50/50 transition-colors"
                                  >
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`font-medium text-sm ${!currentValue || currentValue === 0 ? 'text-slate-400' : 'text-slate-800'}`}>
                                        {!currentValue || currentValue === 0 ? '—' : isRevenueMetric ? formatINRValue(currentValue) : currentValue.toFixed(1)}
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
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Totals Row */}
                  <TableRow className="bg-slate-900 font-semibold border-t-2 border-slate-700 hover:bg-slate-900">
                    <TableCell className="sticky left-0 z-10 bg-slate-900 border-r border-slate-700 font-semibold text-white py-4">
                      <div className="px-6 text-sm">
                        TOTALS
                      </div>
                    </TableCell>
                    {monthColumns.map((column) => {
                      const total = calculateMetricTotal(metricData, column.key);
                      return (
                        <TableCell 
                          key={column.key}
                          className="text-center font-semibold border-r border-slate-700 text-white py-4 text-sm"
                        >
                          {total === 0 ? '—' : isRevenueMetric ? formatINRValue(total) : total.toFixed(1)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MetricsTable;
