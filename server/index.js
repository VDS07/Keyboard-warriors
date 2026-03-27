import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const properties = [
  { id: 1, title: 'Harborview Studio', price: 2100, recommendedPrice: 2400, commuteAdvantage: "10 mins to Financial District", demandScore: 92, lat: 40.7449, lng: -73.9952, views: 145, inquiries: 12 },
  { id: 2, title: 'Riverside Loft', price: 2980, recommendedPrice: 2900, commuteAdvantage: "15 mins to Midtown Tech Park", demandScore: 85, lat: 40.7323, lng: -74.0079, views: 320, inquiries: 45 },
  { id: 3, title: 'Chelsea Corner', price: 2650, recommendedPrice: 3000, commuteAdvantage: "5 mins to Chelsea Market", demandScore: 95, lat: 40.7465, lng: -74.0014, views: 89, inquiries: 3 },
  { id: 4, title: 'Midtown Nest', price: 3200, recommendedPrice: 3100, commuteAdvantage: "Walking distance to Times Square", demandScore: 78, lat: 40.7558, lng: -73.9845, views: 412, inquiries: 80 }
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
    activeListings: properties.length
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
