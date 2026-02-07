#!/bin/bash

# TenantForge - Stripe Testing Script
# This script helps test the Stripe integration

set -e

API_URL="http://localhost:3001/api/v1"
TOKEN=""
WORKSPACE_SLUG=""

echo "🧪 TenantForge Stripe Testing Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Register user
echo -e "${BLUE}1. Registering test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "stripe-test-'$(date +%s)'@example.com",
    "password": "SecurePass123!",
    "name": "Stripe Test User"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')
echo -e "${GREEN}✓ User registered${NC}"
echo ""

# 2. Create workspace
echo -e "${BLUE}2. Creating workspace...${NC}"
WORKSPACE_RESPONSE=$(curl -s -X POST $API_URL/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Stripe Test Company"
  }')

WORKSPACE_SLUG=$(echo $WORKSPACE_RESPONSE | jq -r '.data.slug')
echo -e "${GREEN}✓ Workspace created: $WORKSPACE_SLUG${NC}"
echo ""

# 3. Get billing info (should be FREE)
echo -e "${BLUE}3. Checking current billing status...${NC}"
BILLING_INFO=$(curl -s -X GET $API_URL/workspaces/$WORKSPACE_SLUG/billing \
  -H "Authorization: Bearer $TOKEN")

CURRENT_PLAN=$(echo $BILLING_INFO | jq -r '.data.plan')
echo -e "${GREEN}✓ Current plan: $CURRENT_PLAN${NC}"
echo ""

# 4. Create checkout session
echo -e "${BLUE}4. Creating checkout session...${NC}"
echo -e "${YELLOW}Note: Replace STRIPE_PRICE_PRO with your actual price ID${NC}"
echo ""
echo "Run this command manually:"
echo ""
echo "curl -X POST $API_URL/workspaces/$WORKSPACE_SLUG/billing/checkout \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $TOKEN\" \\"
echo "  -d '{\"priceId\": \"YOUR_PRICE_ID_HERE\"}'"
echo ""

# 5. Create portal session
echo -e "${BLUE}5. Creating Customer Portal session...${NC}"
PORTAL_RESPONSE=$(curl -s -X POST $API_URL/workspaces/$WORKSPACE_SLUG/billing/portal \
  -H "Authorization: Bearer $TOKEN")

PORTAL_URL=$(echo $PORTAL_RESPONSE | jq -r '.data.url')
echo -e "${GREEN}✓ Portal URL generated${NC}"
echo -e "${YELLOW}Open this URL: $PORTAL_URL${NC}"
echo ""

# Save credentials for future use
echo -e "${BLUE}Credentials saved for testing:${NC}"
echo "TOKEN=$TOKEN"
echo "WORKSPACE_SLUG=$WORKSPACE_SLUG"
echo ""
echo "export TOKEN=\"$TOKEN\""
echo "export WORKSPACE_SLUG=\"$WORKSPACE_SLUG\""
