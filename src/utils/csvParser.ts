
import Papa from 'papaparse';

export interface MetricData {
  location: string;
  category: string;
  product: string;
  metric: string;
  months: { [key: string]: number | null };
  total: number;
}

export interface ParsedCSVData {
  [location: string]: {
    [metric: string]: {
      [category: string]: {
        [product: string]: MetricData;
      };
    };
  };
}

export const parseCSV = (csvText: string): ParsedCSVData => {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const parsedData: ParsedCSVData = {};

  result.data.forEach((row: any) => {
    const location = row.Location?.trim();
    const category = row.Category?.trim();
    const product = row.Product?.trim();
    const metric = row.Metric?.trim();
    const total = parseFloat(row.Total) || 0;

    if (!location || !category || !product || !metric) return;

    if (!parsedData[location]) {
      parsedData[location] = {};
    }
    if (!parsedData[location][metric]) {
      parsedData[location][metric] = {};
    }
    if (!parsedData[location][metric][category]) {
      parsedData[location][metric][category] = {};
    }

    const months: { [key: string]: number | null } = {};
    
    // Parse month columns
    Object.keys(row).forEach(key => {
      if (key.includes('-') && (key.includes('24') || key.includes('25'))) {
        const value = row[key];
        months[key] = value && value !== '' ? parseFloat(value) : null;
      }
    });

    parsedData[location][metric][category][product] = {
      location,
      category,
      product,
      metric,
      months,
      total,
    };
  });

  return parsedData;
};

export const formatINRValue = (value: number): string => {
  if (value >= 10000000) { // 1 Crore
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  } else if (value >= 100000) { // 1 Lakh
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (value >= 1000) { // 1 Thousand
    return `₹${(value / 1000).toFixed(1)}K`;
  } else {
    return `₹${value.toFixed(0)}`;
  }
};

export const getMonthColumns = () => {
  const months = [
    'Jun-25', 'May-25', 'Apr-25', 'Mar-25', 'Feb-25', 'Jan-25',
    'Dec-24', 'Nov-24', 'Oct-24', 'Sep-24', 'Aug-24', 'Jul-24',
    'Jun-24', 'May-24', 'Apr-24', 'Mar-24', 'Feb-24', 'Jan-24'
  ];
  
  return months.map(month => {
    const [monthName, year] = month.split('-');
    const monthNum = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    }[monthName] || 0;
    
    return {
      key: month,
      header: month,
      year: parseInt(`20${year}`),
      quarter: Math.floor(monthNum / 3) + 1
    };
  });
};
