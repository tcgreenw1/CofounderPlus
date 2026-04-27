export const generateSampleAnalyticsData = (timeRange: string) => {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const baseViews = 100 + Math.random() * 200;
    const baseConversions = baseViews * (0.02 + Math.random() * 0.08); // 2-10% conversion rate
    const baseSales = Math.floor(baseConversions);
    const revenue = baseSales * (50 + Math.random() * 200); // Random price range
    
    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(baseViews),
      conversions: Math.floor(baseConversions),
      sales: baseSales,
      revenue: Math.floor(revenue),
      clickThroughRate: (baseConversions / baseViews * 100).toFixed(2),
      avgOrderValue: baseSales > 0 ? (revenue / baseSales).toFixed(2) : 0
    });
  }
  
  return data;
};

export const generateProductPerformanceData = (products: any[]) => {
  return products.map(product => ({
    name: product.name,
    sales: product.sales || Math.floor(Math.random() * 100),
    revenue: (product.sales || Math.floor(Math.random() * 100)) * product.price,
    views: product.views || Math.floor(Math.random() * 1000),
    conversionRate: product.conversion_rate || (Math.random() * 10).toFixed(2),
    category: product.category
  }));
};

export const generateFunnelData = () => [
  { name: 'Product Views', value: 10000, fill: '#8884d8' },
  { name: 'Add to Cart', value: 3000, fill: '#83a6ed' },
  { name: 'Checkout Started', value: 1500, fill: '#8dd1e1' },
  { name: 'Payment Completed', value: 800, fill: '#82ca9d' },
  { name: 'Order Confirmed', value: 750, fill: '#a4de6c' }
];

export const generateCategoryData = (products: any[]) => {
  const categoryCount = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff0088'];
  
  return Object.entries(categoryCount).map(([category, count], index) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: count,
    fill: colors[index % colors.length]
  }));
};