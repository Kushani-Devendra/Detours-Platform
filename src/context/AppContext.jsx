import React, { createContext, useContext, useReducer, useEffect } from 'react';

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const INITIAL_TRIPS = [
  {
    id: 'trip-1',
    brand: 'Detours',
    title: '11 Days in Greece',
    slug: 'gay-tours/greece',
    shortDescription: 'An unforgettable journey through ancient ruins, stunning islands, and vibrant culture. From the bustling streets of Athens to the iconic cliffs of Santorini.',
    fullDescription: '<p>Join us for the ultimate Greek adventure. This 11-day journey takes you through Greece\'s most iconic destinations — from the ancient Acropolis to the white-washed villages of Mykonos.</p><p>Led by an experienced Detours guide throughout, you\'ll experience the best of Greek culture, cuisine, and history in a small, welcoming group of like-minded travelers.</p>',
    tripType: 'Standard Trip',
    duration: 11,
    destinations: ['Greece', 'Athens', 'Santorini', 'Mykonos'],
    region: 'Europe',
    departureCity: 'Athens',
    endCity: 'Athens',
    heroImage: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=80',
    mapImage: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&q=80',
    carouselImages: [
      'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80',
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80',
      'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=800&q=80',
    ],
    basePrice: 3899,
    navigationLabel: 'Greece',
    tripCategoryTags: [],
    seoTitle: '11 Days in Greece | Gay Tours | Detours Travel',
    seoDescription: 'Explore Greece with Detours — 11 days of ancient history, island hopping, and vibrant culture with a welcoming group of travelers.',
    seoKeywords: 'greece gay tour, athens santorini mykonos, gay travel greece',
    publishStatus: 'Published',
    internalNotes: 'Very popular trip — tends to sell out early. Watch capacity.',
    tags: ['Popular', 'Island'],
    preTripRequirements: [],
    itinerary: [
      {
        id: 'it-1', stopTitle: 'Days 1 and 2 – ATHENS', dayRange: 'Days 1 and 2',
        city: 'Athens', description: '<p>Arrive in Athens and meet your Detours leader. Explore the historic Plaka neighbourhood, enjoy a welcome dinner, and get a first glimpse of the Acropolis lit up at night.</p>',
        includedActivities: ['Walking tour of Plaka', 'Welcome dinner and drinks', 'Acropolis visit'],
        optionalActivities: ['Athens food tour', 'Day trip to Cape Sounion']
      },
      {
        id: 'it-2', stopTitle: 'Days 3, 4 and 5 – SANTORINI', dayRange: 'Days 3, 4 and 5',
        city: 'Santorini', description: '<p>Ferry to beautiful Santorini. Explore the clifftop villages of Oia and Fira, watch the world-famous sunset, and relax on volcanic beaches.</p>',
        includedActivities: ['Ferry transfer to Santorini', 'Walking tour of Oia', 'Sunset viewing'],
        optionalActivities: ['Wine tasting tour', 'Caldera boat trip', 'ATV rental']
      },
      {
        id: 'it-3', stopTitle: 'Days 6, 7, 8 – MYKONOS', dayRange: 'Days 6, 7 and 8',
        city: 'Mykonos', description: '<p>The party island awaits. Explore the iconic windmills, the charming Little Venice waterfront, and the vibrant beach clubs and nightlife.</p>',
        includedActivities: ['Ferry to Mykonos', 'Walking tour of Mykonos Town'],
        optionalActivities: ['Beach club day', 'Delos island day trip', 'Water sports']
      },
      {
        id: 'it-4', stopTitle: 'Days 9, 10 and 11 – ATHENS', dayRange: 'Days 9, 10 and 11',
        city: 'Athens', description: '<p>Return to Athens for final days. Visit the Acropolis Museum, explore the National Archaeological Museum, enjoy farewell dinner.</p>',
        includedActivities: ['Acropolis Museum', 'Farewell dinner'],
        optionalActivities: ['Spa day', 'Day trip to Delphi']
      },
    ],
    accommodations: [
      {
        id: 'acc-1', name: '360 Degrees Pop Art Hotel', linkedStop: 'it-1',
        description: '<p>A quirky, art-forward boutique hotel in central Athens, steps from the Acropolis.</p>',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
        disclaimer: 'Properties listed represent where we have stayed in the past.'
      },
      {
        id: 'acc-2', name: 'Katikies Santorini', linkedStop: 'it-2',
        description: '<p>Perched on the caldera cliffs of Oia, Katikies offers breathtaking infinity pool views and iconic cave-suite accommodation.</p>',
        image: 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=600&q=80',
        disclaimer: ''
      },
    ],
    inclusions: '<ul><li>All taxes and service charges</li><li>All group transportation between destinations</li><li>All accommodation as listed</li><li>3-hour walking tours at each destination</li><li>Welcome dinner and drinks</li><li>Farewell dinner</li><li>Knowledgeable Detours leader throughout</li></ul>',
    exclusions: '<ul><li>International airfare</li><li>Airport arrival and departure transfers</li><li>Meals and drinks outside of those listed</li><li>Optional activities and excursions</li><li>Personal expenses</li><li>Travel insurance</li><li>Gratuities</li></ul>',
    additionalSpendingNote: 'We recommend budgeting an additional $800–$1,200 USD for optional activities, meals, and personal expenses.',
    tripNotes: '<h3>Weather & Climate</h3><p>Greece in summer enjoys warm, sunny weather with temperatures ranging from the mid-70s to high-80s°F. Pack light clothing and sunscreen.</p><h3>Activity Level</h3><p>This is an active trip with walking on uneven surfaces, including cobblestones. Comfortable shoes are essential.</p><h3>Group Size</h3><p>Groups typically run between 10 and 20 travelers.</p><h3>Arrival & Logistics</h3><p>We start our trip together at 4:00pm on Day 1. Please arrive at Athens International Airport by 2:00pm.</p>',
    createdAt: '2024-01-15',
    updatedAt: '2024-06-20',
  },
  {
    id: 'trip-2',
    brand: 'Detours',
    title: '13 Days in Thailand & Cambodia',
    slug: 'gay-tours/thailand-cambodia',
    shortDescription: 'Experience the spiritual temples of Angkor Wat, the vibrant street markets of Bangkok, and the crystal-clear waters of Thailand\'s islands.',
    fullDescription: '<p>This 13-day adventure through Southeast Asia takes you from the temples of Siem Reap to the islands of southern Thailand, with a stop in Bangkok along the way.</p>',
    tripType: 'Standard Trip',
    duration: 13,
    destinations: ['Thailand', 'Cambodia', 'Bangkok', 'Siem Reap', 'Ko Samui'],
    region: 'Asia-Pacific',
    departureCity: 'Bangkok',
    endCity: 'Ko Samui',
    heroImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80',
    mapImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
    carouselImages: ['https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80'],
    basePrice: 4299,
    navigationLabel: 'Thailand & Cambodia',
    tripCategoryTags: [],
    seoTitle: '13 Days in Thailand & Cambodia | Gay Tours | Detours Travel',
    seoDescription: 'Explore Thailand & Cambodia with Detours — temples, beaches, and culture with a welcoming group.',
    seoKeywords: 'thailand cambodia gay tour, angkor wat, gay travel asia',
    publishStatus: 'Published',
    internalNotes: '',
    tags: ['Southeast Asia', 'Culture'],
    itinerary: [
      { id: 'it-5', stopTitle: 'Days 1, 2 and 3 – BANGKOK', dayRange: 'Days 1, 2 and 3', city: 'Bangkok', description: '<p>Arrive in Bangkok. Explore temples, markets, and the vibrant nightlife.</p>', includedActivities: ['Wat Pho visit', 'Chao Phraya river cruise', 'Welcome dinner'], optionalActivities: ['Muay Thai class', 'Cooking class'] },
      { id: 'it-6', stopTitle: 'Days 4, 5, 6 and 7 – SIEM REAP', dayRange: 'Days 4, 5, 6 and 7', city: 'Siem Reap', description: '<p>Fly to Siem Reap and explore the magnificent Angkor temple complex over multiple days.</p>', includedActivities: ['Angkor Wat sunrise', 'Angkor Thom tour', 'Ta Prohm visit'], optionalActivities: ['Quad bike tour', 'Tonle Sap lake excursion'] },
    ],
    accommodations: [],
    inclusions: '<ul><li>All accommodation</li><li>Group transport between cities</li><li>Angkor temple passes</li><li>Welcome and farewell dinners</li><li>Detours leader throughout</li></ul>',
    exclusions: '<ul><li>International flights</li><li>Visa fees</li><li>Travel insurance</li><li>Optional activities</li></ul>',
    additionalSpendingNote: 'Budget an additional $600–$1,000 for optional activities and personal expenses.',
    tripNotes: '<h3>Visas</h3><p>Most nationalities require a visa for Cambodia. We recommend applying online before travel.</p><h3>Activity Level</h3><p>Moderate activity level. Some temple visits involve significant walking.</p>',
    createdAt: '2024-02-01',
    updatedAt: '2024-06-18',
  },
  {
    id: 'trip-3',
    brand: 'Mawari',
    title: '10 Days in Japan',
    slug: 'gay-tours/japan',
    shortDescription: 'From the neon-lit streets of Tokyo to the ancient temples of Kyoto, experience Japan\'s perfect blend of tradition and modernity.',
    fullDescription: '<p>Japan is unlike anywhere else on earth. This 10-day journey takes you through the country\'s most iconic destinations.</p>',
    tripType: 'Standard Trip',
    duration: 10,
    destinations: ['Japan', 'Tokyo', 'Kyoto', 'Osaka'],
    region: 'Asia-Pacific',
    departureCity: 'Tokyo',
    endCity: 'Osaka',
    heroImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=80',
    mapImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80',
    carouselImages: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80'],
    basePrice: 4999,
    navigationLabel: 'Japan',
    tripCategoryTags: [],
    seoTitle: '10 Days in Japan | Gay Tours | Detours Travel',
    seoDescription: 'Discover Japan with Detours — 10 days of temples, tech, and tradition.',
    seoKeywords: 'japan gay tour, tokyo kyoto, gay travel japan',
    publishStatus: 'Published',
    internalNotes: 'Cherry blossom season (late March – early May) fills up fastest.',
    tags: ['Popular', 'Culture'],
    itinerary: [],
    accommodations: [],
    inclusions: '<ul><li>JR Rail Pass (7-day)</li><li>All accommodation</li><li>Welcome dinner in Tokyo</li><li>Farewell dinner in Osaka</li><li>Detours leader throughout</li></ul>',
    exclusions: '<ul><li>International flights</li><li>Meals not listed</li><li>Travel insurance</li></ul>',
    additionalSpendingNote: 'Budget $700–$1,200 for meals, optional activities, and personal expenses.',
    tripNotes: '<h3>Activity Level</h3><p>Moderate. Some days involve significant walking.</p>',
    createdAt: '2024-03-10',
    updatedAt: '2024-07-01',
  },
  {
    id: 'trip-4',
    brand: 'Mawari',
    title: 'Rhine River Cruise',
    slug: 'one-time-trips/rhine-cruise',
    shortDescription: 'A once-in-a-lifetime cruise along the scenic Rhine River, passing through Germany, France, and the Netherlands.',
    fullDescription: '<p>This exclusive one-time river cruise takes you through some of Europe\'s most scenic landscapes, with medieval castles, vineyard-covered hillsides, and charming villages.</p>',
    tripType: 'One-Time Trip',
    duration: 9,
    destinations: ['Germany', 'Netherlands', 'France', 'Basel', 'Amsterdam'],
    region: 'Europe',
    departureCity: 'Basel',
    endCity: 'Amsterdam',
    heroImage: 'https://images.unsplash.com/photo-1467803738586-46b7eb7b16a1?w=1200&q=80',
    mapImage: 'https://images.unsplash.com/photo-1467803738586-46b7eb7b16a1?w=800&q=80',
    carouselImages: [],
    basePrice: 5499,
    navigationLabel: 'Rhine River Cruise',
    tripCategoryTags: ['One Time Trips'],
    seoTitle: 'Rhine River Cruise | One-Time Trip | Detours Travel',
    seoDescription: 'Join Detours for an exclusive Rhine River Cruise — a 9-day journey through Europe\'s most scenic waterway.',
    seoKeywords: 'rhine river cruise, gay travel europe, one-time trip',
    publishStatus: 'Draft',
    internalNotes: 'Awaiting final pricing from cruise partner.',
    tags: ['Cruise', 'One-Time'],
    itinerary: [],
    accommodations: [],
    inclusions: '<ul><li>All river cruise accommodation (cabin)</li><li>All meals on board</li><li>Shore excursions as listed</li><li>Detours host throughout</li></ul>',
    exclusions: '<ul><li>Flights to/from Basel and Amsterdam</li><li>Gratuities</li><li>Travel insurance</li></ul>',
    additionalSpendingNote: 'Budget $300–$600 for optional shore excursions and personal expenses.',
    tripNotes: '<h3>Activity Level</h3><p>Low to moderate. Shore excursions involve walking.</p>',
    createdAt: '2024-05-20',
    updatedAt: '2024-07-03',
  },
];

const INITIAL_DEPARTURES = [
  {
    id: 'dep-1', tripId: 'trip-1',
    departureDate: '2026-09-15', returnDate: '2026-09-25',
    departureCity: 'Athens', endCity: 'Athens',
    price: 3899, depositAmount: 500,
    minParticipants: 10, maxParticipants: 18,
    balanceDeadlineDays: 90,
    balanceDeadlineDate: '2026-06-17',
    status: 'Open for Booking',
    waitlistEnabled: true,
    internalNotes: 'Guide: Marcus. Flight check-in meeting point confirmed.',
    tags: ['Peak Season'],
    confirmedCount: 12,
    waitlist: [
      { id: 'wl-1', guestName: 'David Chen', email: 'david.c@email.com', travelers: 2, message: 'Very keen to join if spots open up', submittedAt: '2026-07-01T10:30:00Z', status: 'Waiting' },
      { id: 'wl-2', guestName: 'Sarah Mitchell', email: 'sarah.m@email.com', travelers: 1, message: '', submittedAt: '2026-07-02T14:15:00Z', status: 'Waiting' },
    ],
    rooms: [
      { id: 'room-1', name: 'Room 101', type: 'Single', capacity: 1, price: 3899, description: 'Standard single room with city view.', images: [], reservedBy: 'booking-1', status: 'Reserved' },
      { id: 'room-2', name: 'Room 102', type: 'Single', capacity: 1, price: 3899, description: 'Standard single room.', images: [], reservedBy: null, status: 'Available' },
      { id: 'room-3', name: 'Room 201', type: 'Double', capacity: 2, price: 3699, description: 'Double room for two sharing.', images: [], reservedBy: 'booking-2', status: 'Reserved' },
      { id: 'room-4', name: 'Room 202', type: 'Twin', capacity: 2, price: 3699, description: 'Twin room with two beds.', images: [], reservedBy: null, status: 'Available' },
      { id: 'room-5', name: 'Garden Suite', type: 'Single', capacity: 1, price: 4299, description: 'Upgraded suite with garden terrace and private bathroom.', images: [], reservedBy: null, status: 'Available' },
    ],
    postTripCharges: [],
  },
  {
    id: 'dep-2', tripId: 'trip-1',
    departureDate: '2026-10-20', returnDate: '2026-10-30',
    departureCity: 'Athens', endCity: 'Athens',
    price: 3699, depositAmount: 500,
    minParticipants: 10, maxParticipants: 16,
    balanceDeadlineDays: 90,
    balanceDeadlineDate: '2026-07-22',
    status: 'Open for Booking',
    waitlistEnabled: false,
    internalNotes: '',
    tags: [],
    confirmedCount: 4,
    waitlist: [],
    rooms: [],
    postTripCharges: [],
  },
  {
    id: 'dep-3', tripId: 'trip-2',
    departureDate: '2026-08-10', returnDate: '2026-08-22',
    departureCity: 'Bangkok', endCity: 'Ko Samui',
    price: 4299, depositAmount: 600,
    minParticipants: 8, maxParticipants: 14,
    balanceDeadlineDays: 90,
    balanceDeadlineDate: '2026-05-12',
    status: 'Sold Out',
    waitlistEnabled: true,
    internalNotes: 'Fully sold out. Waiting list active.',
    tags: [],
    confirmedCount: 14,
    waitlist: [
      { id: 'wl-3', guestName: 'James Taylor', email: 'james.t@email.com', travelers: 2, message: 'We are flexible on trip dates.', submittedAt: '2026-06-15T09:00:00Z', status: 'Waiting' },
    ],
    rooms: [],
    postTripCharges: [],
  },
  {
    id: 'dep-4', tripId: 'trip-2',
    departureDate: '2026-09-25', returnDate: '2026-10-07',
    departureCity: 'Bangkok', endCity: 'Ko Samui',
    price: 4299, depositAmount: 600,
    minParticipants: 8, maxParticipants: 14,
    balanceDeadlineDays: 90,
    balanceDeadlineDate: '2026-06-27',
    status: 'Open for Booking',
    waitlistEnabled: false,
    internalNotes: '',
    tags: [],
    confirmedCount: 5,
    waitlist: [],
    rooms: [],
    postTripCharges: [],
  },
  {
    id: 'dep-5', tripId: 'trip-3',
    departureDate: '2026-10-05', returnDate: '2026-10-14',
    departureCity: 'Tokyo', endCity: 'Osaka',
    price: 4999, depositAmount: 700,
    minParticipants: 10, maxParticipants: 16,
    balanceDeadlineDays: 90,
    balanceDeadlineDate: '2026-07-07',
    status: 'Open for Booking',
    waitlistEnabled: false,
    internalNotes: '',
    tags: ['Peak Season'],
    confirmedCount: 7,
    waitlist: [],
    rooms: [],
    postTripCharges: [],
  },
];

const INITIAL_BOOKINGS = [
  {
    id: 'booking-1',
    ref: 'DT-2026-0001',
    tripId: 'trip-1',
    departureId: 'dep-1',
    primaryGuest: { firstName: 'Michael', lastName: 'Torres', email: 'michael.torres@email.com', phone: '+1 555 0101' },
    travelers: [
      { id: 'tot-1', firstName: 'Michael', lastName: 'Torres', preferredName: 'Mike', roomingPreference: 'One bed — solo', bedTypePreference: 'King/Double', dietaryRequirements: 'Vegetarian', roomAssignment: 'room-1', completedTrips: 2 },
    ],
    status: 'Confirmed',
    depositPaid: true,
    balancePaid: false,
    totalAmount: 3899,
    depositAmount: 500,
    balanceAmount: 3399,
    paymentMethod: 'Credit Card',
    bookedAt: '2026-04-15T10:30:00Z',
    referralCode: null,
    cancellationPolicy: null,
    creditIssued: 0,
  },
  {
    id: 'booking-2',
    ref: 'DT-2026-0002',
    tripId: 'trip-1',
    departureId: 'dep-1',
    primaryGuest: { firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@email.com', phone: '+1 555 0102' },
    travelers: [
      { id: 'tot-2', firstName: 'Emma', lastName: 'Wilson', preferredName: 'Emma', roomingPreference: 'Two beds — with a friend', bedTypePreference: 'Two Beds', dietaryRequirements: '', roomAssignment: 'room-3', completedTrips: 5 },
      { id: 'tot-3', firstName: 'Claire', lastName: 'Johnson', preferredName: 'Claire', roomingPreference: 'Two beds — with a friend', bedTypePreference: 'Two Beds', dietaryRequirements: 'Gluten-free', roomAssignment: 'room-3', completedTrips: 1 },
    ],
    status: 'Confirmed',
    depositPaid: true,
    balancePaid: true,
    totalAmount: 7398,
    depositAmount: 1000,
    balanceAmount: 0,
    paymentMethod: 'Credit Card',
    bookedAt: '2026-03-22T15:00:00Z',
    referralCode: 'REF-JONES',
    cancellationPolicy: null,
    creditIssued: 100,
  },
];

const INITIAL_EMAIL_TEMPLATES = [
  { id: 'et-1', trigger: 'registration_welcome_credentials', name: 'Welcome Email with Login Credentials', emailNum: '1', brand: 'Detours + Mawari', subject: 'Welcome to Detours, [First Name]! Here\'s how to access your account', body: '<p>Hi [First Name],</p><p>Welcome to Detours! We\'re so excited to have you join us.</p><p>Your account has been created. Use these credentials to log in:</p><p><strong>Email:</strong> [Email Address]<br><strong>Temporary Password:</strong> [Temporary Password]</p><p><a href="[Login URL]">Click here to log in and set your permanent password</a></p><p>Note: The same credentials work for both Detours and Mawari.</p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Last Name]', '[Email Address]', '[Temporary Password]', '[Login URL]'], isActive: true, lastModified: '2024-06-15' },
  { id: 'et-2', trigger: 'booking_confirmed_welcome', name: 'Welcome Email (Booking Confirmed)', emailNum: '2', brand: 'Detours + Mawari', subject: 'You\'re confirmed! [Trip Name] — [Departure Date]', body: '<p>Hi [First Name],</p><p>Your booking for <strong>[Trip Name]</strong> is confirmed!</p><p><strong>Trip Details:</strong></p><ul><li>Departure: [Departure City] on [Start Date]</li><li>Return: [End City] on [End Date]</li><li>Arrival: [Arrival Airport Code] by [Arrival Time]</li><li>Room: [Room Type]</li></ul><p><strong>Next Steps:</strong></p><ul><li>Complete your pre-trip requirements by [Pre-Trip Deadline]</li><li>Your balance of [Balance Amount] is due on [Balance Due Date]</li></ul><p><a href="[Account Link]">View your booking</a></p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Trip Name]', '[Departure City]', '[Start Date]', '[End Date]', '[End City]', '[Arrival Airport Code]', '[Arrival Time]', '[Room Type]', '[Pre-Trip Deadline]', '[Balance Amount]', '[Balance Due Date]', '[Account Link]'], isActive: true, lastModified: '2024-06-20' },
  { id: 'et-3', trigger: 'ach_processing', name: 'ACH Payment Processing Email', emailNum: '3', brand: 'Detours only', subject: 'ACH Payment Received — Processing', body: '<p>Hi [First Name],</p><p>We\'ve received your ACH payment of <strong>[Payment Amount]</strong> for [Trip Name]. ACH payments typically take 3–5 business days to fully process.</p><p>We\'ll notify you once the payment has settled.</p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Trip Name]', '[Payment Amount]'], isActive: true, lastModified: '2024-05-10' },
  { id: 'et-4', trigger: 'ach_confirmed', name: 'ACH Payment Confirmed Email', emailNum: '4', brand: 'Detours only', subject: 'ACH Payment Confirmed — [Trip Name]', body: '<p>Hi [First Name],</p><p>Great news! Your ACH payment of <strong>[Payment Amount]</strong> for [Trip Name] has been successfully processed. Your booking is fully paid.</p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Trip Name]', '[Payment Amount]'], isActive: true, lastModified: '2024-05-10' },
  { id: 'et-5', trigger: 'cancellation', name: 'Cancellation Email', emailNum: '5', brand: 'Detours + Mawari', subject: 'Your Booking has been Cancelled — [Trip Name]', body: '<p>Hi [First Name],</p><p>We\'re sorry to let you know that your booking for <strong>[Trip Name]</strong> (departing [Departure Start Date]) has been cancelled.</p><p>[Credit Note if applicable]</p><p>For travel insurance documentation, please <a href="[Contact Link]">contact us</a>.</p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Trip Name]', '[Departure Start Date]', '[Credit Note]', '[Contact Link]'], isActive: true, lastModified: '2024-06-01' },
  { id: 'et-6', trigger: 'cancellation_credit', name: 'Cancellation Credit Email', emailNum: '6', brand: 'Detours + Mawari', subject: 'Travel Credit Issued — [Credit Amount]', body: '<p>Hi [First Name],</p><p>A travel credit of <strong>[Credit Amount]</strong> has been issued to your Detours account. This credit has no expiry and can be applied to any future booking.</p><p><a href="[Account Link]">View your credit</a></p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Credit Amount]', '[Account Link]'], isActive: true, lastModified: '2024-06-01' },
  { id: 'et-7', trigger: 'waitlist_confirmation', name: 'Waitlist Confirmation Email', emailNum: '7', brand: 'Detours + Mawari', subject: 'You\'re on the Waitlist — [Trip Name]', body: '<p>Hi [First Name],</p><p>You\'ve been added to the waitlist for <strong>[Trip Name]</strong> departing [Departure Date].</p><p>We\'ll contact you immediately if a spot becomes available. Questions? Contact us anytime.</p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Trip Name]', '[Departure Date]'], isActive: true, lastModified: '2024-05-15' },
  { id: 'et-8', trigger: 'waitlist_spot_available', name: 'Waitlist Spot Available Email', emailNum: '8', brand: 'Detours + Mawari', subject: 'A spot is available! — [Trip Name]', body: '<p>Hi [First Name],</p><p>Great news! A spot has opened up on <strong>[Trip Name]</strong> departing [Departure Date].</p><p>This exclusive booking link is reserved for you until <strong>[Link Expiry Deadline]</strong>:</p><p><a href="[Booking Link]">Secure your spot now</a></p><p>If you don\'t complete your booking by the deadline, the spot will be offered to the next person on the waitlist.</p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Trip Name]', '[Departure Date]', '[Booking Link]', '[Link Expiry Deadline]'], isActive: true, lastModified: '2024-05-15' },
  { id: 'et-10', trigger: 'pre_trip_requirement_overdue', name: 'Pre-Trip Requirement Overdue Email', emailNum: '10', brand: 'Detours + Mawari', subject: 'Action Required: Pre-Trip Requirements Overdue', body: '<p>Hi [First Name],</p><p>Your pre-trip requirements for [Trip Name] were due on <strong>[Due Date]</strong>. The following items are still outstanding:</p><p>[Outstanding Requirements List]</p><p>Please <a href="[Account Link]">log in to your account</a> to complete these as soon as possible.</p><p>Warm regards,<br>The Detours Team</p>', dynamicFields: ['[First Name]', '[Trip Name]', '[Due Date]', '[Outstanding Requirements List]', '[Account Link]'], isActive: true, lastModified: '2024-05-20' },
  { id: 'et-a1', trigger: 'admin_new_registration', name: 'New Registration Notification (Admin)', emailNum: 'A1', brand: 'Detours + Mawari', subject: 'New Registration: [Traveler Name] — [Trip Name]', body: '<p>A new registration has been submitted.</p><p><strong>Traveler:</strong> [Traveler Full Name]<br><strong>Trip:</strong> [Trip Name]<br><strong>Dates:</strong> [Trip Dates]<br><strong>Group Code:</strong> [Group Code]</p><p>[Flagged Traveler Notice if applicable]</p><p><a href="[Admin Profile URL]">View profile in Kapuli</a></p>', dynamicFields: ['[Traveler Full Name]', '[Trip Name]', '[Trip Dates]', '[Group Code]', '[Flagged Traveler Notice]', '[Admin Profile URL]'], isActive: true, lastModified: '2024-06-01' },
  { id: 'et-a3', trigger: 'admin_welcome_cc_mawari', name: 'Welcome Email CC (Mawari Only)', emailNum: 'A3', brand: 'Mawari only', subject: '[CC] Welcome: [Traveler Name] — [Trip Name]', body: '<p>This is an automated CC of the welcome email sent to a Mawari traveler.</p><p>[Same content as customer welcome email]</p>', dynamicFields: ['[Traveler Full Name]', '[Trip Name]'], isActive: true, lastModified: '2024-06-01' },
];

const INITIAL_AUDIT_LOG = [
  { id: 'al-1', entityType: 'Trip', entityId: 'trip-1', field: 'publishStatus', oldValue: 'Draft', newValue: 'Published', user: 'Sarah Owen', timestamp: '2024-06-20T09:15:00Z' },
  { id: 'al-2', entityType: 'Trip', entityId: 'trip-1', field: 'basePrice', oldValue: '$3,799', newValue: '$3,899', user: 'Marcus Hall', timestamp: '2024-06-18T14:30:00Z' },
  { id: 'al-3', entityType: 'Departure', entityId: 'dep-1', field: 'status', oldValue: 'Open for Booking', newValue: 'Sold Out', user: 'System', timestamp: '2024-07-01T16:45:00Z' },
  { id: 'al-4', entityType: 'Departure', entityId: 'dep-1', field: 'status', oldValue: 'Sold Out', newValue: 'Waitlist Only', user: 'System', timestamp: '2024-07-01T16:45:01Z' },
  { id: 'al-5', entityType: 'Trip', entityId: 'trip-2', field: 'heroImage', oldValue: 'prev-image.jpg', newValue: 'thailand-hero.jpg', user: 'Sarah Owen', timestamp: '2024-06-17T11:00:00Z' },
];

const INITIAL_REQUIREMENTS_LIBRARY = [
  { id: 'req-1', name: 'Passport Copy', description: 'A clear scan of the photo page of your passport.' },
  { id: 'req-2', name: 'Travel Insurance', description: 'Proof of comprehensive travel insurance coverage.' },
  { id: 'req-3', name: 'Emergency Contact Form', description: 'Details of an emergency contact person.' },
  { id: 'req-4', name: 'Medical Information Form', description: 'Any relevant medical conditions or medications.' },
  { id: 'req-5', name: 'Dietary Requirements Confirmation', description: 'Confirmation of dietary requirements or preferences.' },
  { id: 'req-6', name: 'Visa Confirmation (Cambodia)', description: 'Proof of approved Cambodia e-Visa.' },
];

// ─── State Helpers ──────────────────────────────────────────────────────────

const getStoredState = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function appReducer(state, action) {
  let newState;

  switch (action.type) {
    // TRIPS
    case 'ADD_TRIP':
      newState = { ...state, trips: [...state.trips, action.payload] };
      break;
    case 'UPDATE_TRIP':
      newState = { ...state, trips: state.trips.map(t => t.id === action.payload.id ? { ...t, ...action.payload, updatedAt: new Date().toISOString().split('T')[0] } : t) };
      break;
    case 'DELETE_TRIP':
      newState = { ...state, trips: state.trips.filter(t => t.id !== action.payload) };
      break;

    // DEPARTURES
    case 'ADD_DEPARTURE':
      newState = { ...state, departures: [...state.departures, action.payload] };
      break;
    case 'UPDATE_DEPARTURE':
      newState = { ...state, departures: state.departures.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d) };
      break;
    case 'DELETE_DEPARTURE':
      newState = { ...state, departures: state.departures.filter(d => d.id !== action.payload) };
      break;

    // BOOKINGS
    case 'ADD_BOOKING': {
      const newBookings = [...state.bookings, action.payload];
      // Auto Sold Out / Waitlist Only: recalculate traveler count for the affected departure
      const affectedDepId = action.payload.departureId;
      const updatedDepartures = state.departures.map(d => {
        if (d.id !== affectedDepId) return d;
        const confirmedTravelers = newBookings
          .filter(b => b.departureId === affectedDepId && b.status === 'Confirmed')
          .reduce((sum, b) => sum + (b.travelers?.length || 1), 0);
        const available = d.maxParticipants - confirmedTravelers;
        if (available <= 0 && d.status === 'Open for Booking') {
          const nextStatus = d.waitlistEnabled ? 'Waitlist Only' : 'Sold Out';
          return { ...d, status: nextStatus };
        }
        return d;
      });
      newState = { ...state, bookings: newBookings, departures: updatedDepartures };
      break;
    }
    case 'UPDATE_BOOKING':
      newState = { ...state, bookings: state.bookings.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
      break;

    // ROOMS
    case 'ADD_ROOM':
      newState = { ...state, departures: state.departures.map(d => d.id === action.payload.departureId ? { ...d, rooms: [...d.rooms, action.payload.room] } : d) };
      break;
    case 'UPDATE_ROOM':
      newState = { ...state, departures: state.departures.map(d => d.id === action.payload.departureId ? { ...d, rooms: d.rooms.map(r => r.id === action.payload.room.id ? { ...r, ...action.payload.room } : r) } : d) };
      break;
    case 'DELETE_ROOM':
      newState = { ...state, departures: state.departures.map(d => d.id === action.payload.departureId ? { ...d, rooms: d.rooms.filter(r => r.id !== action.payload.roomId) } : d) };
      break;

    // WAITLIST
    case 'ADD_WAITLIST_ENTRY':
      newState = { ...state, departures: state.departures.map(d => d.id === action.payload.departureId ? { ...d, waitlist: [...d.waitlist, action.payload.entry] } : d) };
      break;
    case 'UPDATE_WAITLIST_ENTRY':
      newState = { ...state, departures: state.departures.map(d => d.id === action.payload.departureId ? { ...d, waitlist: d.waitlist.map(w => w.id === action.payload.entry.id ? { ...w, ...action.payload.entry } : w) } : d) };
      break;

    // POST-TRIP CHARGES
    case 'ADD_POST_TRIP_CHARGE':
      newState = { ...state, departures: state.departures.map(d => d.id === action.payload.departureId ? { ...d, postTripCharges: [...(d.postTripCharges || []), action.payload.charge] } : d) };
      break;

    // EMAIL TEMPLATES
    case 'UPDATE_EMAIL_TEMPLATE':
      newState = { ...state, emailTemplates: state.emailTemplates.map(t => t.id === action.payload.id ? { ...t, ...action.payload, lastModified: new Date().toISOString().split('T')[0] } : t) };
      break;

    // AUDIT LOG
    case 'ADD_AUDIT_ENTRY':
      newState = { ...state, auditLog: [action.payload, ...state.auditLog] };
      break;

    // LOYALTY CREDITS
    case 'ISSUE_LOYALTY_CREDITS':
      newState = { ...state, loyaltyCredits: [...state.loyaltyCredits, ...action.payload] };
      break;

    // TOAST
    case 'ADD_TOAST':
      newState = { ...state, toasts: [...state.toasts, action.payload] };
      break;
    case 'REMOVE_TOAST':
      newState = { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
      break;

    default:
      return state;
  }

  // Persist to localStorage (excluding toasts)
  const { toasts, ...persistable } = newState;
  localStorage.setItem('kapuli_state', JSON.stringify(persistable));
  return newState;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

const INITIAL_BRAND_SETTINGS = {
  Detours: { nearDepartureWarningThreshold: 90 },
  Mawari: { nearDepartureWarningThreshold: 90 },
};

export function AppProvider({ children }) {
  const storedState = getStoredState('kapuli_state', null);

  const initialState = storedState || {
    trips: INITIAL_TRIPS,
    departures: INITIAL_DEPARTURES,
    bookings: INITIAL_BOOKINGS,
    emailTemplates: INITIAL_EMAIL_TEMPLATES,
    auditLog: INITIAL_AUDIT_LOG,
    requirementsLibrary: INITIAL_REQUIREMENTS_LIBRARY,
    brandSettings: INITIAL_BRAND_SETTINGS,
    loyaltyCredits: [],
    toasts: [],
  };

  const [state, dispatch] = useReducer(appReducer, { ...initialState, toasts: [] });

  // Helper: add audit log entry
  const addAuditEntry = (entityType, entityId, field, oldValue, newValue, user = 'Sarah Owen') => {
    dispatch({ type: 'ADD_AUDIT_ENTRY', payload: { id: `al-${Date.now()}`, entityType, entityId, field, oldValue, newValue, user, timestamp: new Date().toISOString() } });
  };

  // Helper: show toast
  const showToast = (message, type = 'success') => {
    const id = `toast-${Date.now()}`;
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 3500);
  };

  // Helper: get departures for a trip
  const getDepartures = (tripId) => state.departures.filter(d => d.tripId === tripId);

  // Helper: get bookings for a departure
  const getBookings = (departureId) => state.bookings.filter(b => b.departureId === departureId);

  // Helper: get available spaces on a departure
  const getAvailableSpaces = (departure) => {
    const confirmedTravelers = state.bookings
      .filter(b => b.departureId === departure.id && b.status === 'Confirmed')
      .reduce((sum, b) => sum + b.travelers.length, 0);
    return departure.maxParticipants - confirmedTravelers;
  };

  // Helper: check if departure is at-risk
  const isAtRisk = (departure) => {
    const trip = state.trips.find(t => t.id === departure.tripId);
    const threshold = trip && trip.brand && state.brandSettings && state.brandSettings[trip.brand] 
      ? state.brandSettings[trip.brand].nearDepartureWarningThreshold 
      : 90;
    
    const daysUntil = Math.floor((new Date(departure.departureDate) - new Date()) / (1000 * 60 * 60 * 24));
    const confirmedTravelers = state.bookings
      .filter(b => b.departureId === departure.id && b.status === 'Confirmed')
      .reduce((sum, b) => sum + b.travelers.length, 0);
    return daysUntil <= threshold && confirmedTravelers < departure.minParticipants;
  };

  // Helper: get confirmed traveler count
  const getConfirmedCount = (departure) => {
    return state.bookings
      .filter(b => b.departureId === departure.id && b.status === 'Confirmed')
      .reduce((sum, b) => sum + b.travelers.length, 0);
  };

  // Derived stats
  const stats = {
    totalTrips: state.trips.filter(t => t.publishStatus === 'Published').length,
    totalDepartures: state.departures.filter(d => d.status === 'Open for Booking').length,
    atRiskCount: state.departures.filter(d => isAtRisk(d)).length,
    soldOutCount: state.departures.filter(d => d.status === 'Sold Out').length,
  };

  const value = {
    state,
    dispatch,
    addAuditEntry,
    showToast,
    getDepartures,
    getBookings,
    getAvailableSpaces,
    isAtRisk,
    getConfirmedCount,
    stats,
    requirementsLibrary: state.requirementsLibrary,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
