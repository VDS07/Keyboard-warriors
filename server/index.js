const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const properties = [
  { id: 1, title: 'Dharampeth Heritage Flat', price: 18000, recommendedPrice: 21000, commuteAdvantage: "5 mins to Law College Square", demandScore: 82, lat: 21.1500, lng: 79.0800, views: 245, inquiries: 22 },
  { id: 2, title: 'Sadar Luxury Studio', price: 12000, recommendedPrice: 14000, commuteAdvantage: "Near Sadar Bus Stand", demandScore: 75, lat: 21.1552, lng: 79.0880, views: 180, inquiries: 15 },
  { id: 3, title: 'Koramangala 3BHK', price: 45000, recommendedPrice: 48000, commuteAdvantage: "10 mins to Forum Mall", demandScore: 90, lat: 12.9352, lng: 77.6245, views: 520, inquiries: 85 },
  { id: 4, title: 'Bandra Sea-View', price: 85000, recommendedPrice: 82000, commuteAdvantage: "Walking to Bandstand", demandScore: 95, lat: 19.0596, lng: 72.8295, views: 812, inquiries: 120 },
  { id: 5, title: 'HITEC City 2BHK', price: 22000, recommendedPrice: 25000, commuteAdvantage: "Near Microsoft Campus", demandScore: 83, lat: 17.4435, lng: 78.3772, views: 310, inquiries: 42 },
  { id: 6, title: 'Hinjewadi Phase 1', price: 18000, recommendedPrice: 20000, commuteAdvantage: "5 mins to Rajiv Gandhi IT Park", demandScore: 76, lat: 18.5912, lng: 73.7380, views: 198, inquiries: 18 },
];

app.get('/api/properties', (req, res) => {
  res.json(properties);
});

app.get('/api/owner/stats', (req, res) => {
  const totalViews = properties.reduce((sum, p) => sum + p.views, 0);
  const totalInquiries = properties.reduce((sum, p) => sum + p.inquiries, 0);
  res.json({
    totalProperties: properties.length,
    totalViews,
    totalInquiries,
    activeListings: properties.length,
  });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
