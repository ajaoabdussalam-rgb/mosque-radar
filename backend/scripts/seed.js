const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Mosque = require('../models/Mosque');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedUsers = [
  {
    name: 'Admin Moderator',
    email: 'admin@mosqueradar.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    name: 'Community Moderator',
    email: 'mod@mosqueradar.com',
    password: 'Mod123!',
    role: 'moderator'
  },
  {
    name: 'Bilal User',
    email: 'user@mosqueradar.com',
    password: 'User123!',
    role: 'user'
  }
];

const seedMosques = [
  {
    name: 'Lagos Central Mosque',
    address: '46 Nnamdi Azikiwe St, Lagos Island, Lagos',
    location: {
      type: 'Point',
      coordinates: [3.3886, 6.4531] // [lng, lat]
    },
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'Lekki Central Mosque',
    address: 'Lekki Phase 1, Eti-Osa, Lagos',
    location: {
      type: 'Point',
      coordinates: [3.4883, 6.4474]
    },
    images: ['https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'Ikeja Central Mosque',
    address: 'Obafemi Awolowo Way, Alausa, Ikeja, Lagos',
    location: {
      type: 'Point',
      coordinates: [3.3592, 6.6175]
    },
    images: ['https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'Surulere Central Mosque',
    address: 'Akerele Street, Surulere, Lagos',
    location: {
      type: 'Point',
      coordinates: [3.3585, 6.5059]
    },
    images: ['https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'Victoria Island Community Mosque',
    address: 'Adeola Odeku Street, Victoria Island, Lagos',
    location: {
      type: 'Point',
      coordinates: [3.4246, 6.4281]
    },
    images: ['https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'Maryland Prayer Center',
    address: 'Mobolaji Bank Anthony Way, Maryland, Lagos',
    location: {
      type: 'Point',
      coordinates: [3.3664, 6.5723]
    },
    images: ['https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80'],
    status: 'pending',
    submittedBy: 'Amina Bello'
  },
  {
    name: 'London Central Mosque',
    address: '146 Park Rd, London NW8 7RG, United Kingdom',
    location: {
      type: 'Point',
      coordinates: [-0.1654, 51.5284]
    },
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'East London Mosque',
    address: '82-92 Whitechapel Rd, London E1 1JQ, United Kingdom',
    location: {
      type: 'Point',
      coordinates: [-0.0653, 51.5186]
    },
    images: ['https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'Al-Azhar Mosque',
    address: 'El-Darb El-Ahmar, Cairo Governorate, Egypt',
    location: {
      type: 'Point',
      coordinates: [31.2625, 30.0458]
    },
    images: ['https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  },
  {
    name: 'Blue Mosque (Sultanahmet)',
    address: 'Sultan Ahmet, Atmeydani Cd. No:7, Fatih/Istanbul, Turkey',
    location: {
      type: 'Point',
      coordinates: [28.9768, 41.0054]
    },
    images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'],
    status: 'verified',
    submittedBy: 'System Seeder',
    verifiedAt: new Date(),
    verifiedBy: 'System Administrator'
  }
];

async function runSeed() {
  try {
    await connectDB();
    console.log('Clearing existing mosques and users...');
    await Mosque.deleteMany({});
    await User.deleteMany({});

    console.log(`Seeding ${seedUsers.length} demo users...`);
    for (const u of seedUsers) {
      await User.create(u);
    }
    console.log('Demo users seeded successfully!');

    console.log(`Seeding ${seedMosques.length} mosques...`);
    const created = await Mosque.insertMany(seedMosques);
    console.log(`Successfully seeded ${created.length} mosques!`);

    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

runSeed();
