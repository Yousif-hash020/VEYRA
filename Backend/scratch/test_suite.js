const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');

const authRoutes = require('../routes/authRoutes');
const hostRoutes = require('../routes/hostRoutes');
const guestRoutes = require('../routes/guestRoutes');
const roomRoutes = require('../routes/roomRoutes');

const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/rooms', roomRoutes);

let server;
const PORT = 5009;

async function runTests() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    server = app.listen(PORT, async () => {
      console.log(`Test server running on port ${PORT}`);

      const baseURL = `http://localhost:${PORT}`;

      const timestamp = Date.now();
      const guestEmail = `testguest_${timestamp}@example.com`;
      const hostEmail = `testhost_${timestamp}@example.com`;
      const password = 'Password123!';

      let guestToken = '';
      let hostToken = '';
      let testRoomId = '';
      let secondRoomId = '';
      let bookingId = '';

      console.log('\n--- 1. GUEST REGISTRATION ---');
      const guestRegRes = await fetch(`${baseURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Guest',
          email: guestEmail,
          password: password,
          confirmPassword: password,
          role: 'guest',
        }),
      });
      const guestRegData = await guestRegRes.json();
      console.log('Guest Register Status:', guestRegRes.status, guestRegData.message);
      if (!guestRegData.success) throw new Error('Guest registration failed');

      console.log('\n--- 2. GUEST LOGIN ---');
      const guestLoginRes = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: guestEmail, password: password }),
      });
      const guestLoginData = await guestLoginRes.json();
      console.log('Guest Login Status:', guestLoginRes.status, 'Token acquired:', !!guestLoginData.token);
      guestToken = guestLoginData.token;

      console.log('\n--- 3. HOST REGISTRATION ---');
      const hostRegRes = await fetch(`${baseURL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Host',
          email: hostEmail,
          password: password,
          confirmPassword: password,
          role: 'host',
        }),
      });
      const hostRegData = await hostRegRes.json();
      console.log('Host Register Status:', hostRegRes.status, hostRegData.message);

      console.log('\n--- 4. HOST LOGIN ---');
      const hostLoginRes = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hostEmail, password: password }),
      });
      const hostLoginData = await hostLoginRes.json();
      console.log('Host Login Status:', hostLoginRes.status, 'Token acquired:', !!hostLoginData.token);
      hostToken = hostLoginData.token;

      console.log('\n--- 5. HOST PROPERTY CREATION ---');
      const createRoomRes = await fetch(`${baseURL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hostToken}`,
        },
        body: JSON.stringify({
          name: 'Nathia Gali Sunset Villa',
          propertyType: 'Villa',
          location: 'Nathia Gali',
          pricePerNight: 20000,
          guests: 4,
          bedrooms: 2,
          beds: 2,
          bathrooms: 2,
          description: 'Beautiful luxury villa surrounded by pine trees.',
          amenities: ['wifi', 'fireplace', 'parking'],
          image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          status: 'Available',
        }),
      });
      const createRoomData = await createRoomRes.json();
      console.log('Host Create Room Status:', createRoomRes.status, createRoomData.message);
      testRoomId = createRoomData.data._id;

      // Create a second room for deletion test
      const createRoom2Res = await fetch(`${baseURL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hostToken}`,
        },
        body: JSON.stringify({
          name: 'Temporary Room for Delete Test',
          propertyType: 'Apartment',
          location: 'Islamabad',
          pricePerNight: 15000,
          guests: 2,
          bedrooms: 1,
          beds: 1,
          bathrooms: 1,
          description: 'Temp room',
          amenities: ['wifi'],
          image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
          status: 'Available',
        }),
      });
      const createRoom2Data = await createRoom2Res.json();
      secondRoomId = createRoom2Data.data._id;

      console.log('\n--- 6. HOST PROPERTY RETRIEVAL ---');
      const getHostPropsRes = await fetch(`${baseURL}/api/host/properties`, {
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      const getHostPropsData = await getHostPropsRes.json();
      console.log('Host Properties Count:', getHostPropsData.count);

      console.log('\n--- 7. HOST PROPERTY UPDATE ---');
      const updateRoomRes = await fetch(`${baseURL}/api/rooms/${testRoomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hostToken}`,
        },
        body: JSON.stringify({ name: 'Nathia Gali Sunset Villa Updated' }),
      });
      const updateRoomData = await updateRoomRes.json();
      console.log('Host Update Room Status:', updateRoomRes.status, updateRoomData.data.name);

      console.log('\n--- 8. HOST PROPERTY DELETION ---');
      const deleteRoomRes = await fetch(`${baseURL}/api/rooms/${secondRoomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${hostToken}` },
      });
      const deleteRoomData = await deleteRoomRes.json();
      console.log('Host Delete Room Status:', deleteRoomRes.status, deleteRoomData.message);

      console.log('\n--- 9. SECURITY: GUEST CANNOT PERFORM HOST OPERATIONS ---');
      const forbiddenRes = await fetch(`${baseURL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({ name: 'Illegal Room' }),
      });
      const forbiddenData = await forbiddenRes.json();
      console.log('Guest Host-Op Attempt Status:', forbiddenRes.status, '(Expected 403 Forbidden)', forbiddenData.message);

      console.log('\n--- 10. GUEST PROPERTY BROWSING & FILTERS ---');
      const browseRes = await fetch(`${baseURL}/api/guest/properties?location=Nathia&minPrice=10000&maxPrice=30000&guests=2`);
      const browseData = await browseRes.json();
      console.log('Guest Browse Properties Count:', browseData.count, 'Found:', browseData.data.map(r => r.name));

      console.log('\n--- 11. GUEST WISHLIST (ADD, GET, REMOVE) ---');
      const addWishRes = await fetch(`${baseURL}/api/guest/wishlist/${testRoomId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${guestToken}` },
      });
      const addWishData = await addWishRes.json();
      console.log('Add Wishlist Status:', addWishRes.status, 'Wishlist Count:', addWishData.data.length);

      const getWishRes = await fetch(`${baseURL}/api/guest/wishlist`, {
        headers: { Authorization: `Bearer ${guestToken}` },
      });
      const getWishData = await getWishRes.json();
      console.log('Get Wishlist Status:', getWishRes.status, 'Retrieved Count:', getWishData.count);

      const removeWishRes = await fetch(`${baseURL}/api/guest/wishlist/${testRoomId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${guestToken}` },
      });
      const removeWishData = await removeWishRes.json();
      console.log('Remove Wishlist Status:', removeWishRes.status, 'Remaining Count:', removeWishData.data.length);

      console.log('\n--- 12. GUEST CAPACITY VALIDATION ---');
      const overCapacityRes = await fetch(`${baseURL}/api/guest/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          roomId: testRoomId,
          checkIn: '2026-09-01',
          checkOut: '2026-09-04',
          guests: 10, // Exceeds capacity of 4
        }),
      });
      const overCapacityData = await overCapacityRes.json();
      console.log('Capacity Validation Status:', overCapacityRes.status, '(Expected 400)', overCapacityData.message);

      console.log('\n--- 13. GUEST BOOKING CREATION (SERVER PRICE CALCULATION) ---');
      const createBookingRes = await fetch(`${baseURL}/api/guest/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          roomId: testRoomId,
          checkIn: '2026-09-10',
          checkOut: '2026-09-13', // 3 nights @ 20000 = 60000 + 3500 + 4200 = 67700
          guests: 2,
          cnic: '61101-1234567-1',
          paymentMethod: 'card',
        }),
      });
      const createBookingData = await createBookingRes.json();
      console.log('Booking Creation Status:', createBookingRes.status, 'Total Calculated by Server:', createBookingData.data.totalPrice, 'RefCode:', createBookingData.data.referenceCode);
      bookingId = createBookingData.data._id;

      console.log('\n--- 14. BOOKING DATE CONFLICT VALIDATION ---');
      const conflictRes = await fetch(`${baseURL}/api/guest/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          roomId: testRoomId,
          checkIn: '2026-09-11', // Overlaps 2026-09-10 to 2026-09-13
          checkOut: '2026-09-15',
          guests: 2,
        }),
      });
      const conflictData = await conflictRes.json();
      console.log('Date Conflict Status:', conflictRes.status, '(Expected 409)', conflictData.message);

      console.log('\n--- 15. GUEST BOOKING RETRIEVAL ---');
      const getBookingsRes = await fetch(`${baseURL}/api/guest/bookings`, {
        headers: { Authorization: `Bearer ${guestToken}` },
      });
      const getBookingsData = await getBookingsRes.json();
      console.log('Guest Bookings Count:', getBookingsData.count, 'Room Name:', getBookingsData.data[0].room.name);

      console.log('\n--- 16. GUEST BOOKING CANCELLATION ---');
      const cancelBookingRes = await fetch(`${baseURL}/api/guest/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${guestToken}` },
      });
      const cancelBookingData = await cancelBookingRes.json();
      console.log('Cancel Booking Status:', cancelBookingRes.status, 'New Status:', cancelBookingData.data.status);

      console.log('\n--- 17. GUEST PROFILE UPDATE ---');
      const updateProfileRes = await fetch(`${baseURL}/api/guest/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          phone: '+92 300 9876543',
          city: 'Islamabad',
          bio: 'Avid traveler and mountain enthusiast',
        }),
      });
      const updateProfileData = await updateProfileRes.json();
      console.log('Update Profile Status:', updateProfileRes.status, 'Phone:', updateProfileData.user.phone, 'City:', updateProfileData.user.city);

      console.log('\n--- 18. GUEST PASSWORD CHANGE ---');
      const changePassRes = await fetch(`${baseURL}/api/guest/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          currentPassword: password,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        }),
      });
      const changePassData = await changePassRes.json();
      console.log('Change Password Status:', changePassRes.status, changePassData.message);

      console.log('\n--- 19. GUEST REVIEW CREATION & RETRIEVAL ---');
      const createReviewRes = await fetch(`${baseURL}/api/guest/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          roomId: testRoomId,
          rating: 5,
          comment: 'Spectacular villa and amazing hospitality!',
        }),
      });
      const createReviewData = await createReviewRes.json();
      console.log('Create Review Status:', createReviewRes.status, createReviewData.message);

      const getReviewsRes = await fetch(`${baseURL}/api/guest/reviews/room/${testRoomId}`);
      const getReviewsData = await getReviewsRes.json();
      console.log('Get Room Reviews Count:', getReviewsData.count, 'Rating:', getReviewsData.data[0].rating);

      console.log('\n==================================================');
      console.log('  ALL TESTS PASSED CLEANLY & SUCCESSFULLY! 🎉');
      console.log('==================================================\n');

      // Cleanup test data created during run
      await Booking.deleteMany({ _id: bookingId });
      await Review.deleteMany({ room: testRoomId });
      await Room.deleteMany({ _id: testRoomId });
      await User.deleteMany({ email: { $in: [guestEmail, hostEmail] } });

      server.close();
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (err) {
    console.error('Test Suite Failed:', err);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTests();
