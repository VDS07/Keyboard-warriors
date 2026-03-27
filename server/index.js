const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const properties = [
  // Nagpur Sellers
  { id: 1, title: 'Dharampeth Heritage Flat', price: 18000, recommendedPrice: 21000, commuteAdvantage: "5 mins to Law College Square", demandScore: 82, lat: 21.1500, lng: 79.0800, views: 245, inquiries: 22, owner: "Rajesh Mehta", phone: "+91-9876543210" },
  { id: 2, title: 'Sadar Luxury Studio', price: 12000, recommendedPrice: 14000, commuteAdvantage: "Near Sadar Bus Stand", demandScore: 75, lat: 21.1552, lng: 79.0880, views: 180, inquiries: 15, owner: "Priya Deshmukh", phone: "+91-9123456789" },
  { id: 3, title: 'Civil Lines Bungalow', price: 45000, recommendedPrice: 50000, commuteAdvantage: "Heart of Civil Lines", demandScore: 94, lat: 21.1600, lng: 79.0750, views: 521, inquiries: 78, owner: "Dr. Anil Wankhede", phone: "+91-9988776655" },
  { id: 4, title: 'Trimurti Nagar Duplex', price: 22000, recommendedPrice: 25000, commuteAdvantage: "Near Trimurti Nagar Square", demandScore: 84, lat: 21.1350, lng: 79.0500, views: 312, inquiries: 35, owner: "Sunita Borkar", phone: "+91-7766554433" },

  // Mumbai Sellers
  { id: 5, title: 'Andheri West 1BHK', price: 35000, recommendedPrice: 38000, commuteAdvantage: "Near Andheri Metro", demandScore: 76, lat: 19.1360, lng: 72.8296, views: 489, inquiries: 55, owner: "Vikram Shah", phone: "+91-9876123456" },
  { id: 6, title: 'Bandra Sea-View Flat', price: 85000, recommendedPrice: 82000, commuteAdvantage: "Walking to Bandstand", demandScore: 95, lat: 19.0596, lng: 72.8295, views: 812, inquiries: 120, owner: "Meera Kapoor", phone: "+91-9845671234" },
  { id: 7, title: 'Powai Lake Residency', price: 42000, recommendedPrice: 45000, commuteAdvantage: "Lake-facing in Hiranandani", demandScore: 88, lat: 19.1176, lng: 72.9060, views: 378, inquiries: 48, owner: "Amit Joshi", phone: "+91-9012345678" },
  { id: 8, title: 'Worli Skyline Tower', price: 75000, recommendedPrice: 72000, commuteAdvantage: "Sea Link views", demandScore: 91, lat: 19.0176, lng: 72.8153, views: 654, inquiries: 92, owner: "Tina Malhotra", phone: "+91-8899776655" },

  // Bangalore Sellers
  { id: 9, title: 'Koramangala 3BHK', price: 45000, recommendedPrice: 48000, commuteAdvantage: "10 mins to Forum Mall", demandScore: 90, lat: 12.9352, lng: 77.6245, views: 520, inquiries: 85, owner: "Arjun Rao", phone: "+91-9845612345" },
  { id: 10, title: 'HSR Layout Duplex', price: 35000, recommendedPrice: 38000, commuteAdvantage: "Near Silk Board Junction", demandScore: 92, lat: 12.9121, lng: 77.6446, views: 445, inquiries: 72, owner: "Kavitha Nair", phone: "+91-9900112233" },
  { id: 11, title: 'MG Road Penthouse', price: 90000, recommendedPrice: 88000, commuteAdvantage: "MG Road Metro access", demandScore: 97, lat: 12.9758, lng: 77.6068, views: 920, inquiries: 140, owner: "Nikhil Sharma", phone: "+91-9876540000" },

  // Hyderabad Sellers
  { id: 12, title: 'HITEC City 2BHK', price: 22000, recommendedPrice: 25000, commuteAdvantage: "Near Microsoft Campus", demandScore: 83, lat: 17.4435, lng: 78.3772, views: 310, inquiries: 42, owner: "Srinivas Reddy", phone: "+91-9876501234" },
  { id: 13, title: 'Banjara Hills Villa', price: 65000, recommendedPrice: 68000, commuteAdvantage: "Road No. 10 Premium", demandScore: 95, lat: 17.4156, lng: 78.4347, views: 678, inquiries: 98, owner: "Fatima Begum", phone: "+91-9988001122" },
  { id: 14, title: 'Jubilee Hills Duplex', price: 55000, recommendedPrice: 58000, commuteAdvantage: "Jubilee Hills Checkpost", demandScore: 93, lat: 17.4310, lng: 78.4073, views: 543, inquiries: 80, owner: "Ravi Kumar", phone: "+91-8877665544" },

  // Pune Sellers
  { id: 15, title: 'Koregaon Park Bungalow', price: 55000, recommendedPrice: 60000, commuteAdvantage: "Near Osho Ashram", demandScore: 94, lat: 18.5362, lng: 73.8948, views: 492, inquiries: 65, owner: "Manish Patil", phone: "+91-9876509876" },
  { id: 16, title: 'Baner Hilltop 2BHK', price: 24000, recommendedPrice: 27000, commuteAdvantage: "Balewadi Stadium views", demandScore: 85, lat: 18.5596, lng: 73.7868, views: 267, inquiries: 32, owner: "Sneha Kulkarni", phone: "+91-9012349876" },

  // Delhi NCR Sellers
  { id: 17, title: 'Gurugram Cyber Hub Flat', price: 38000, recommendedPrice: 40000, commuteAdvantage: "Walking to Cyber Hub", demandScore: 84, lat: 28.4950, lng: 77.0878, views: 410, inquiries: 58, owner: "Rohit Aggarwal", phone: "+91-9845679012" },
  { id: 18, title: 'South Delhi Green Park', price: 48000, recommendedPrice: 52000, commuteAdvantage: "Green Park Metro", demandScore: 91, lat: 28.5599, lng: 77.2090, views: 589, inquiries: 88, owner: "Pooja Khanna", phone: "+91-9900887766" },
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
