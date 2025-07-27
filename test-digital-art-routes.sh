#!/bin/bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:5010/api"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TESTING DIGITAL ART API ROUTES${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. GET all digital artworks
echo -e "${YELLOW}1. GET ALL DIGITAL ARTWORKS${NC}"
echo "curl -X GET ${BASE_URL}/digital-art"
curl -X GET ${BASE_URL}/digital-art 2>/dev/null | jq '.' || echo "Error: Is the server running?"
echo -e "\n"

# 2. GET with filters
echo -e "${YELLOW}2. GET WITH FILTERS (limit=2, available=true, featured=true)${NC}"
echo "curl -X GET \"${BASE_URL}/digital-art?limit=2&available=true&featured=true\""
curl -X GET "${BASE_URL}/digital-art?limit=2&available=true&featured=true" 2>/dev/null | jq '.'
echo -e "\n"

# 3. GET with search
echo -e "${YELLOW}3. SEARCH DIGITAL ARTWORKS (search='digital')${NC}"
echo "curl -X GET \"${BASE_URL}/digital-art?search=digital\""
curl -X GET "${BASE_URL}/digital-art?search=digital" 2>/dev/null | jq '.'
echo -e "\n"

# 4. GET single artwork (using first ID from list)
echo -e "${YELLOW}4. GET SINGLE DIGITAL ARTWORK${NC}"
FIRST_ID=$(curl -s "${BASE_URL}/digital-art?limit=1" | jq -r '.data[0]._id' 2>/dev/null)
if [ "$FIRST_ID" != "null" ] && [ ! -z "$FIRST_ID" ]; then
    echo "curl -X GET ${BASE_URL}/digital-art/${FIRST_ID}"
    curl -X GET ${BASE_URL}/digital-art/${FIRST_ID} 2>/dev/null | jq '.'
else
    echo -e "${RED}No digital artworks found to test${NC}"
fi
echo -e "\n"

# 5. GET by original artwork
echo -e "${YELLOW}5. GET BY ORIGINAL ARTWORK ID${NC}"
echo "curl -X GET ${BASE_URL}/digital-art/by-original/687cc12a14b35ed5f26563f2"
curl -X GET ${BASE_URL}/digital-art/by-original/687cc12a14b35ed5f26563f2 2>/dev/null | jq '.'
echo -e "\n"

# 6. Test invalid ID
echo -e "${YELLOW}6. TEST INVALID ID (should return error)${NC}"
echo "curl -X GET ${BASE_URL}/digital-art/invalid-id-12345"
curl -X GET ${BASE_URL}/digital-art/invalid-id-12345 2>/dev/null | jq '.'
echo -e "\n"

# 7. Test non-existent ID
echo -e "${YELLOW}7. TEST NON-EXISTENT ID (should return 404)${NC}"
echo "curl -X GET ${BASE_URL}/digital-art/507f1f77bcf86cd799439011"
curl -X GET ${BASE_URL}/digital-art/507f1f77bcf86cd799439011 2>/dev/null | jq '.'
echo -e "\n"

# 8. POST without auth (should fail)
echo -e "${YELLOW}8. CREATE WITHOUT AUTH (should fail with 401)${NC}"
echo "curl -X POST ${BASE_URL}/digital-art"
curl -X POST ${BASE_URL}/digital-art \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Digital Artwork",
    "originalArtworkId": "687cc12a14b35ed5f26563f2",
    "originalTitle": "Original Test",
    "version": "99",
    "description": "Test description",
    "imageUrl": "https://example.com/test.jpg",
    "sizes": [{
      "size": "A4",
      "dimensions": "21 x 29.7 cm",
      "price": 10000,
      "available": true
    }]
  }' 2>/dev/null | jq '.'
echo -e "\n"

# 9. PUT without auth (should fail)
echo -e "${YELLOW}9. UPDATE WITHOUT AUTH (should fail with 401)${NC}"
if [ ! -z "$FIRST_ID" ]; then
    echo "curl -X PUT ${BASE_URL}/digital-art/${FIRST_ID}"
    curl -X PUT ${BASE_URL}/digital-art/${FIRST_ID} \
      -H "Content-Type: application/json" \
      -d '{"title": "Updated Title"}' 2>/dev/null | jq '.'
fi
echo -e "\n"

# 10. PATCH availability without auth (should fail)
echo -e "${YELLOW}10. UPDATE AVAILABILITY WITHOUT AUTH (should fail with 401)${NC}"
if [ ! -z "$FIRST_ID" ]; then
    echo "curl -X PATCH ${BASE_URL}/digital-art/${FIRST_ID}/availability"
    curl -X PATCH ${BASE_URL}/digital-art/${FIRST_ID}/availability \
      -H "Content-Type: application/json" \
      -d '{"available": false}' 2>/dev/null | jq '.'
fi
echo -e "\n"

# 11. DELETE without auth (should fail)
echo -e "${YELLOW}11. DELETE WITHOUT AUTH (should fail with 401)${NC}"
if [ ! -z "$FIRST_ID" ]; then
    echo "curl -X DELETE ${BASE_URL}/digital-art/${FIRST_ID}"
    curl -X DELETE ${BASE_URL}/digital-art/${FIRST_ID} 2>/dev/null | jq '.'
fi
echo -e "\n"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓${NC} Public routes (GET) should work without authentication"
echo -e "${RED}✗${NC} Protected routes (POST, PUT, PATCH, DELETE) should fail with 401"
echo -e "${YELLOW}ℹ${NC} Check the responses above to verify expected behavior"