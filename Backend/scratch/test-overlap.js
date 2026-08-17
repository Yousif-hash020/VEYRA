/**
 * Automated Verification Script for Booking Overlap Logic
 * Verifies all 7 test cases specified in the requirement.
 */

const existingBooking = {
  checkIn: new Date("2026-08-20T00:00:00.000Z"),
  checkOut: new Date("2026-08-25T00:00:00.000Z")
};

function isOverlapping(existing, newCheckInStr, newCheckOutStr) {
  const newCheckIn = new Date(newCheckInStr);
  const newCheckOut = new Date(newCheckOutStr);

  // MongoDB Overlap condition:
  // existing.checkIn < newCheckOut AND existing.checkOut > newCheckIn
  const overlaps = (existing.checkIn < newCheckOut) && (existing.checkOut > newCheckIn);
  return overlaps;
}

const testCases = [
  {
    name: "1. Exact same dates (2026-08-20 to 2026-08-25)",
    checkIn: "2026-08-20T00:00:00.000Z",
    checkOut: "2026-08-25T00:00:00.000Z",
    expectedOverlap: true
  },
  {
    name: "2. New booking starts during existing (2026-08-22 to 2026-08-27)",
    checkIn: "2026-08-22T00:00:00.000Z",
    checkOut: "2026-08-27T00:00:00.000Z",
    expectedOverlap: true
  },
  {
    name: "3. New booking ends during existing (2026-08-18 to 2026-08-22)",
    checkIn: "2026-08-18T00:00:00.000Z",
    checkOut: "2026-08-22T00:00:00.000Z",
    expectedOverlap: true
  },
  {
    name: "4. New booking completely contains existing (2026-08-15 to 2026-08-30)",
    checkIn: "2026-08-15T00:00:00.000Z",
    checkOut: "2026-08-30T00:00:00.000Z",
    expectedOverlap: true
  },
  {
    name: "5. New booking completely inside existing (2026-08-21 to 2026-08-23)",
    checkIn: "2026-08-21T00:00:00.000Z",
    checkOut: "2026-08-23T00:00:00.000Z",
    expectedOverlap: true
  },
  {
    name: "6. Non-overlapping booking immediately before (2026-08-15 to 2026-08-20)",
    checkIn: "2026-08-15T00:00:00.000Z",
    checkOut: "2026-08-20T00:00:00.000Z",
    expectedOverlap: false
  },
  {
    name: "7. Non-overlapping booking immediately after (2026-08-25 to 2026-08-30)",
    checkIn: "2026-08-25T00:00:00.000Z",
    checkOut: "2026-08-30T00:00:00.000Z",
    expectedOverlap: false
  }
];

console.log("=== VEYRA BOOKING OVERLAP VERIFICATION ===");
console.log(`Existing Booking: ${existingBooking.checkIn.toISOString().split('T')[0]} -> ${existingBooking.checkOut.toISOString().split('T')[0]}`);
console.log("------------------------------------------");

let passed = 0;
testCases.forEach((tc) => {
  const result = isOverlapping(existingBooking, tc.checkIn, tc.checkOut);
  const isCorrect = result === tc.expectedOverlap;
  if (isCorrect) passed++;
  const status = isCorrect ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} | ${tc.name}`);
  console.log(`       Result: ${result ? "Overlapped (Rejected)" : "Available (Allowed)"} | Expected: ${tc.expectedOverlap ? "Overlapped (Rejected)" : "Available (Allowed)"}`);
});

console.log("------------------------------------------");
console.log(`Summary: ${passed}/${testCases.length} Test Cases Passed.`);
if (passed === testCases.length) {
  console.log("SUCCESS: All date overlap test cases passed flawlessly!");
} else {
  console.error("FAILURE: Some test cases failed.");
  process.exit(1);
}
