# VEYRA API — Frontend Developer Handoff Documentation

Welcome to the **VEYRA Guest Backend API** handoff documentation. This document provides complete technical specifications for integrating the existing Guest frontend UI with the VEYRA backend REST APIs.

---

## Table of Contents
1. [General Concepts & Authentication](#1-general-concepts--authentication)
2. [Data Models & Available Fields](#2-data-models--available-fields)
3. [Guest Property Browsing, Search & Filtering](#3-guest-property-browsing-search--filtering)
4. [Wishlist Management](#4-wishlist-management)
5. [Booking System & Validation](#5-booking-system--validation)
6. [Guest Bookings & History](#6-guest-bookings--history)
7. [Guest Profile & Security Settings](#7-guest-profile--security-settings)
8. [Reviews & Ratings](#8-reviews--ratings)

---

## 1. General Concepts & Authentication

### Base URL
All API endpoints are relative to:
`http://localhost:5000` (or `process.env.API_BASE_URL`)

### Authentication Header
Protected endpoints require a JSON Web Token (JWT) sent in the HTTP `Authorization` header:
```http
Authorization: Bearer <token>
```

### Standard Response Structure
All API responses follow a uniform JSON structure:

#### Success Response
```json
{
  "success": true,
  "message": "Human readable success message",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Description of the error"
}
```

---

## 2. Data Models & Available Fields

### Property / Listing (`Room`)
```json
{
  "_id": "66b1a2f3c4e5d6a7b8c9d0e1",
  "name": "Luxury Mountain Cabin",
  "propertyType": "Cabin",
  "location": "Nathia Gali, KPK",
  "pricePerNight": 18500,
  "guests": 8,
  "bedrooms": 4,
  "beds": 4,
  "bathrooms": 3,
  "description": "Handcrafted timber cabin perched amidst pine forests...",
  "amenities": ["High-Speed Fiber WiFi", "Indoor Slate Fireplace", "Free Parking", "Mountain View"],
  "image": "../images/luxury_mountain_cabin.png",
  "status": "Available",
  "owner": {
    "_id": "66b1a2f3c4e5d6a7b8c9d0e2",
    "name": "Alexander Wright"
  },
  "rating": 4.9,
  "reviewCount": 127,
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z"
}
```

### Guest User (`User`)
```json
{
  "id": "66b1a2f3c4e5d6a7b8c9d0e3",
  "name": "Ahmed Khan",
  "email": "ahmed.khan@example.com",
  "role": "guest",
  "phone": "+92 300 1234567",
  "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "cnic": "61101-1234567-1",
  "city": "Islamabad, Pakistan",
  "bio": "Passionate mountain explorer and photography enthusiast.",
  "wishlist": ["66b1a2f3c4e5d6a7b8c9d0e1"],
  "createdAt": "2024-01-15T08:00:00.000Z",
  "updatedAt": "2026-08-13T12:00:00.000Z"
}
```

### Booking (`Booking`)
```json
{
  "_id": "66b1a2f3c4e5d6a7b8c9d0e4",
  "referenceCode": "VEY-89421",
  "guest": "66b1a2f3c4e5d6a7b8c9d0e3",
  "room": {
    "_id": "66b1a2f3c4e5d6a7b8c9d0e1",
    "name": "Luxury Mountain Cabin",
    "location": "Nathia Gali, KPK",
    "image": "../images/luxury_mountain_cabin.png",
    "pricePerNight": 18500
  },
  "host": {
    "_id": "66b1a2f3c4e5d6a7b8c9d0e2",
    "name": "Alexander Wright",
    "email": "alex@example.com"
  },
  "checkIn": "2026-08-14T00:00:00.000Z",
  "checkOut": "2026-08-17T00:00:00.000Z",
  "nights": 3,
  "guests": 2,
  "pricePerNight": 18500,
  "cleaningFee": 3500,
  "serviceFee": 4200,
  "totalPrice": 63200,
  "status": "Confirmed",
  "cnic": "61101-1234567-1",
  "specialRequests": "Early check-in requested",
  "paymentMethod": "card",
  "createdAt": "2026-08-13T15:00:00.000Z"
}
```

---

## 3. Guest Property Browsing, Search & Filtering

### FEATURE: Get Available Properties
- **Method**: `GET`
- **Endpoint**: `/api/guest/properties`
- **Authentication**: Optional / Not required
- **Role**: Public / Guest

#### Query Parameters:
| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `location` | string | `Nathia Gali` | Search by destination or city (case-insensitive substring match) |
| `propertyType` | string | `Cabin` | Filter by type (`Cabin`, `Villa`, `Apartment`, `Chalet`, `Penthouse`, `Lodge`) |
| `price` | string | `budget` | Preset ranges: `budget` (<10k), `mid` (10k-25k), `premium` (25k-50k), `luxury` (>50k) |
| `minPrice` | number | `15000` | Minimum price per night in PKR |
| `maxPrice` | number | `30000` | Maximum price per night in PKR |
| `guests` | number/string | `2` or `3-4` | Minimum guest accommodation capacity |
| `bedrooms` | number/string | `2` or `4+` | Minimum bedrooms count |
| `amenity` | string | `wifi` | Filter by amenity string |
| `rating` | number | `4.5` | Filter properties with rating >= value |
| `checkIn` | string | `2026-08-14` | Excludes properties with conflicting confirmed bookings |
| `checkOut` | string | `2026-08-17` | Required when `checkIn` is provided |
| `sortBy` | string | `price-asc` | Options: `recommended`, `price-asc`, `price-desc`, `rating`, `newest` |

#### Example Request:
`GET /api/guest/properties?location=Nathia&price=mid&guests=2&sortBy=rating`

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "66b1a2f3c4e5d6a7b8c9d0e1",
      "name": "Luxury Mountain Cabin",
      "propertyType": "Cabin",
      "location": "Nathia Gali, KPK",
      "pricePerNight": 18500,
      "guests": 8,
      "bedrooms": 4,
      "beds": 4,
      "bathrooms": 3,
      "description": "Handcrafted timber cabin...",
      "amenities": ["WiFi", "Fireplace", "Parking"],
      "image": "../images/luxury_mountain_cabin.png",
      "status": "Available",
      "owner": {
        "_id": "66b1a2f3c4e5d6a7b8c9d0e2",
        "name": "Alexander Wright"
      },
      "rating": 4.9,
      "reviewCount": 127
    }
  ]
}
```

---

### FEATURE: Get Property Details
- **Method**: `GET`
- **Endpoint**: `/api/guest/properties/:id`
- **Authentication**: Optional / Not required
- **Role**: Public / Guest

#### Example Request:
`GET /api/guest/properties/66b1a2f3c4e5d6a7b8c9d0e1`

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "data": {
    "_id": "66b1a2f3c4e5d6a7b8c9d0e1",
    "name": "Luxury Mountain Cabin",
    "propertyType": "Cabin",
    "location": "Nathia Gali, KPK",
    "pricePerNight": 18500,
    "guests": 8,
    "bedrooms": 4,
    "beds": 4,
    "bathrooms": 3,
    "description": "Handcrafted timber cabin...",
    "amenities": ["WiFi", "Fireplace"],
    "image": "../images/luxury_mountain_cabin.png",
    "status": "Available",
    "owner": {
      "_id": "66b1a2f3c4e5d6a7b8c9d0e2",
      "name": "Alexander Wright",
      "email": "alex@example.com"
    },
    "rating": 4.9,
    "reviewCount": 127,
    "reviews": [
      {
        "_id": "66b1a2f3c4e5d6a7b8c9d0f1",
        "guest": {
          "name": "Tariq Aziz",
          "avatar": "https://images.unsplash.com/photo-1507003211169"
        },
        "rating": 5,
        "comment": "An absolute masterpiece of a cabin!",
        "createdAt": "2026-07-20T14:30:00.000Z"
      }
    ]
  }
}
```

---

## 4. Wishlist Management

### FEATURE: Get Saved Wishlist
- **Method**: `GET`
- **Endpoint**: `/api/guest/wishlist`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "66b1a2f3c4e5d6a7b8c9d0e1",
      "name": "Luxury Mountain Cabin",
      "location": "Nathia Gali, KPK",
      "pricePerNight": 18500
    }
  ]
}
```

---

### FEATURE: Add Property to Wishlist
- **Method**: `POST`
- **Endpoint**: `/api/guest/wishlist/:propertyId`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "message": "Property added to wishlist",
  "data": ["66b1a2f3c4e5d6a7b8c9d0e1"]
}
```

---

### FEATURE: Remove Property from Wishlist
- **Method**: `DELETE`
- **Endpoint**: `/api/guest/wishlist/:propertyId`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "message": "Property removed from wishlist",
  "data": []
}
```

---

## 5. Booking System & Validation

### FEATURE: Reserve & Create Stay Booking
- **Method**: `POST`
- **Endpoint**: `/api/guest/bookings`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`

#### Request Body:
```json
{
  "roomId": "66b1a2f3c4e5d6a7b8c9d0e1",
  "checkIn": "2026-08-14",
  "checkOut": "2026-08-17",
  "guests": 2,
  "cnic": "61101-1234567-1",
  "specialRequests": "Early check-in requested",
  "paymentMethod": "card"
}
```

#### Validation Rules (Enforced by Backend):
1. `roomId`, `checkIn`, `checkOut`, `guests` are strictly required.
2. `checkIn` must be today or a future date.
3. `checkOut` must be strictly after `checkIn`. Minimum stay is 1 night.
4. `guests` count must not exceed property capacity (`room.guests`).
5. Overlapping dates check: Returns `409 Conflict` if property has an existing `Confirmed` booking overlapping `[checkIn, checkOut)`.
6. Price calculation: `totalPrice` is calculated strictly on backend: `(nights * pricePerNight) + cleaningFee (3,500) + serviceFee (4,200)`. Frontend price is ignored.

#### Example Success Response (201 Created):
```json
{
  "success": true,
  "message": "Booking created and confirmed successfully",
  "data": {
    "_id": "66b1a2f3c4e5d6a7b8c9d0e4",
    "referenceCode": "VEY-89421",
    "checkIn": "2026-08-14T00:00:00.000Z",
    "checkOut": "2026-08-17T00:00:00.000Z",
    "nights": 3,
    "guests": 2,
    "pricePerNight": 18500,
    "cleaningFee": 3500,
    "serviceFee": 4200,
    "totalPrice": 63200,
    "status": "Confirmed",
    "room": {
      "name": "Luxury Mountain Cabin",
      "location": "Nathia Gali, KPK"
    }
  }
}
```

#### Example Error Response — Date Conflict (409 Conflict):
```json
{
  "success": false,
  "message": "This property is already booked for the selected dates. Please select different dates."
}
```

---

## 6. Guest Bookings & History

### FEATURE: Get My Bookings
- **Method**: `GET`
- **Endpoint**: `/api/guest/bookings`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`
- **Query Parameter**: `status` (`Confirmed`, `Completed`, `Canceled`)

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "66b1a2f3c4e5d6a7b8c9d0e4",
      "referenceCode": "VEY-89421",
      "status": "Confirmed",
      "checkIn": "2026-08-14T00:00:00.000Z",
      "checkOut": "2026-08-17T00:00:00.000Z",
      "nights": 3,
      "guests": 2,
      "totalPrice": 63200,
      "room": {
        "name": "Luxury Mountain Cabin",
        "location": "Nathia Gali, KPK",
        "image": "../images/luxury_mountain_cabin.png"
      }
    }
  ]
}
```

---

### FEATURE: Cancel Booking
- **Method**: `PATCH`
- **Endpoint**: `/api/guest/bookings/:id/cancel`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "message": "Booking canceled successfully",
  "data": {
    "_id": "66b1a2f3c4e5d6a7b8c9d0e4",
    "status": "Canceled"
  }
}
```

---

## 7. Guest Profile & Security Settings

### FEATURE: Update Guest Profile
- **Method**: `PUT`
- **Endpoint**: `/api/guest/profile`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`

#### Request Body:
```json
{
  "name": "Ahmed Khan",
  "phone": "+92 300 1234567",
  "cnic": "61101-1234567-1",
  "city": "Islamabad, Pakistan",
  "bio": "Mountain explorer & traveler",
  "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
}
```

#### Example Success Response (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "66b1a2f3c4e5d6a7b8c9d0e3",
    "name": "Ahmed Khan",
    "email": "ahmed.khan@example.com",
    "role": "guest",
    "phone": "+92 300 1234567",
    "city": "Islamabad, Pakistan"
  }
}
```

---

## 8. Reviews & Ratings

### FEATURE: Create Property Review
- **Method**: `POST`
- **Endpoint**: `/api/guest/reviews`
- **Authentication**: Required (`Bearer <token>`)
- **Role**: `guest`

#### Request Body:
```json
{
  "roomId": "66b1a2f3c4e5d6a7b8c9d0e1",
  "rating": 5,
  "comment": "An absolute masterpiece of a cabin!"
}
```

#### Example Success Response (201 Created):
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "_id": "66b1a2f3c4e5d6a7b8c9d0f1",
    "rating": 5,
    "comment": "An absolute masterpiece of a cabin!"
  }
}
```

---

## Summary Checklist for Frontend Developer
- Store JWT returned on `POST /api/auth/login` in `localStorage` under `token`.
- Include `Authorization: Bearer ${token}` header for all protected guest calls.
- Send dates as ISO string / `YYYY-MM-DD` for search and booking endpoints.
- Parse `response.data` for standard objects and arrays.
- Display `response.message` directly in UI alert/toast components on errors.
