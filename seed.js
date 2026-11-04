require("dotenv").config();
const { MongoClient } = require("mongodb");

const studios = [
  {
    title: "Northlight Cyclorama Studio",
    category: "Photo Studio",
    hourlyRate: 65,
    securityDeposit: 150,
    maxCapacity: 12,
    location: "Banani, Dhaka",
    image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200",
      "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?w=1200",
    ],
    amenities: ["Infinity Cove", "Strobe Lighting Kit", "Makeup Station", "Wi-Fi"],
    overview:
      "A 1,400 sq ft white cyclorama wall with north-facing windows and a full strobe kit. Ideal for fashion lookbooks, product shoots, and portrait sessions. Backdrop paper in six colors is included.",
    rating: 4.8,
    reviews: [
      { name: "Rafiq Ahmed", rating: 5, comment: "The cove is spotless and the lighting kit saved us a rental fee." },
      { name: "Nadia Karim", rating: 4.5, comment: "Easy loading access and a very responsive host." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-01"),
  },
  {
    title: "Echo Chamber Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 40,
    securityDeposit: 80,
    maxCapacity: 5,
    location: "Zindabazar, Sylhet",
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200",
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200",
    ],
    amenities: ["4 Shure Mics", "Acoustic Panels", "Mixing Desk", "Coffee Bar"],
    overview:
      "A soundproofed lounge with four broadcast microphones, a mixing desk, and a comfortable sofa set. Built for interview shows, panel recordings, and live streams.",
    rating: 4.9,
    reviews: [
      { name: "Tanvir Hasan", rating: 5, comment: "Zero outside noise. Our audio came out clean on the first take." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-05"),
  },
  {
    title: "Soundstage One Film Hall",
    category: "Film Stage",
    hourlyRate: 180,
    securityDeposit: 500,
    maxCapacity: 40,
    location: "Uttara, Dhaka",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200",
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200",
    ],
    amenities: ["Green Screen", "Lighting Grid", "Green Room", "Power Distribution", "Parking"],
    overview:
      "A 4,000 sq ft column-free soundstage with a 16 ft ceiling grid, a built-in green screen wall, and three-phase power. Suitable for short films, music videos, and commercial shoots.",
    rating: 4.7,
    reviews: [
      { name: "Imran Chowdhury", rating: 5, comment: "The grid height gave us total freedom with our lighting plan." },
      { name: "Sadia Rahman", rating: 4.5, comment: "Plenty of power and a comfortable green room for the cast." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-10"),
  },
  {
    title: "Reverb Room Recording Suite",
    category: "Music Suite",
    hourlyRate: 55,
    securityDeposit: 120,
    maxCapacity: 8,
    location: "Dhanmondi, Dhaka",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200",
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200",
    ],
    amenities: ["Live Room", "Vocal Booth", "Studio Monitors", "Upright Piano"],
    overview:
      "A two-room recording suite with a treated live room, an isolated vocal booth, and a control room with nearpfield monitors. An engineer is available on request.",
    rating: 4.6,
    reviews: [
      { name: "Farhan Mahmud", rating: 4.5, comment: "The vocal booth sounds great and the piano was in tune." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-14"),
  },
  {
    title: "Clay & Canvas Art Workshop",
    category: "Workshop",
    hourlyRate: 30,
    securityDeposit: 60,
    maxCapacity: 15,
    location: "Chittagong City Centre",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200",
      "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200",
    ],
    amenities: ["Easels", "Pottery Wheel", "Kiln Access", "Sink Station"],
    overview:
      "A bright open workshop with ten easels, two pottery wheels, and kiln access. Great for classes, craft meetups, and painting sessions.",
    rating: 4.5,
    reviews: [
      { name: "Mim Akter", rating: 4.5, comment: "Perfect natural light for our weekend painting class." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-18"),
  },
  {
    title: "Halo Portrait Loft",
    category: "Photo Studio",
    hourlyRate: 48,
    securityDeposit: 100,
    maxCapacity: 8,
    location: "Gulshan, Dhaka",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200",
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200",
    ],
    amenities: ["Natural Light", "Reflector Set", "Backdrop Stands", "Changing Room"],
    overview:
      "A sunlit loft with tall windows, soft-toned walls, and a reflector kit. Popular for portraits, couples shoots, and lifestyle brand content.",
    rating: 4.4,
    reviews: [
      { name: "Lamia Sultana", rating: 4, comment: "Gorgeous window light in the afternoon." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-22"),
  },
  {
    title: "Voltage Live Session Stage",
    category: "Music Suite",
    hourlyRate: 75,
    securityDeposit: 200,
    maxCapacity: 20,
    location: "Zindabazar, Sylhet",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200",
    ],
    amenities: ["PA System", "Drum Kit", "Backline Amps", "Stage Lighting"],
    overview:
      "A live-session room with a raised stage, a full drum kit, and backline amplifiers. Used for band rehearsals, acoustic nights, and multi-cam performance recordings.",
    rating: 4.3,
    reviews: [
      { name: "Shuvo Das", rating: 4, comment: "Our whole band fit comfortably and the PA was loud and clear." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-26"),
  },
  {
    title: "Noir Product Photography Booth",
    category: "Photo Studio",
    hourlyRate: 35,
    securityDeposit: 70,
    maxCapacity: 4,
    location: "Mirpur, Dhaka",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200",
      "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=1200",
    ],
    amenities: ["Light Tent", "Turntable", "Tripods", "Black Acrylic Sheets"],
    overview:
      "A compact table-top setup with a light tent, a motorized turntable, and reflective acrylic sheets. Made for jewelry, cosmetics, and e-commerce product photos.",
    rating: 4.2,
    reviews: [
      { name: "Rubina Islam", rating: 4, comment: "Quick setup and sharp results for our jewelry catalog." },
    ],
    ownerName: "Studio Seed Host",
    ownerEmail: "host@studiospace.com",
    createdAt: new Date("2026-09-30"),
  },
];

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const col = client.db("studiospace").collection("studios");
    await col.deleteMany({ ownerEmail: "host@studiospace.com" });
    const result = await col.insertMany(studios);
    console.log(`Seeded ${result.insertedCount} studios`);
  } finally {
    await client.close();
  }
}

seed();