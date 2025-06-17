
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
  console.log('Starting CSV parse...');
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  console.log('Papa parse result:', result);
  console.log('Headers found:', result.meta.fields);
  console.log('Total rows:', result.data.length);

  const parsedData: ParsedCSVData = {};

  result.data.forEach((row: any, index: number) => {
    const location = row.Location?.trim();
    const category = row.Category?.trim();
    const product = row.Product?.trim();
    const metric = row.Metric?.trim();
    const total = parseFloat(row.Total) || 0;

    console.log(`Processing row ${index}:`, { location, category, product, metric, total });

    if (!location || !category || !product || !metric) {
      console.log(`Skipping row ${index} due to missing required fields:`, { location, category, product, metric });
      return;
    }

    // Initialize nested structure
    if (!parsedData[location]) {
      parsedData[location] = {};
      console.log(`Created location: ${location}`);
    }
    if (!parsedData[location][metric]) {
      parsedData[location][metric] = {};
      console.log(`Created metric: ${metric} for location: ${location}`);
    }
    if (!parsedData[location][metric][category]) {
      parsedData[location][metric][category] = {};
      console.log(`Created category: ${category} for metric: ${metric} in location: ${location}`);
    }

    const months: { [key: string]: number | null } = {};
    
    // Parse month columns - look for columns that match month-year pattern
    Object.keys(row).forEach(key => {
      if (key.includes('-') && (key.includes('24') || key.includes('25'))) {
        const value = row[key];
        // Handle different representations of empty values
        if (value === '' || value === null || value === undefined || value === 'null' || value === '0') {
          months[key] = null;
        } else {
          const numValue = parseFloat(value);
          months[key] = isNaN(numValue) ? null : numValue;
        }
      }
    });

    console.log(`Months data for ${product} in ${category}:`, months);

    // Store the product data
    parsedData[location][metric][category][product] = {
      location,
      category,
      product,
      metric,
      months,
      total,
    };

    console.log(`Successfully added: ${location} > ${metric} > ${category} > ${product}`);
  });

  console.log('Final parsed data structure:');
  Object.keys(parsedData).forEach(location => {
    console.log(`Location: ${location}`);
    Object.keys(parsedData[location]).forEach(metric => {
      console.log(`  Metric: ${metric}`);
      Object.keys(parsedData[location][metric]).forEach(category => {
        console.log(`    Category: ${category}`);
        const products = Object.keys(parsedData[location][metric][category]);
        console.log(`      Products (${products.length}):`, products);
      });
    });
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
