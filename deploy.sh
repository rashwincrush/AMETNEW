#!/bin/bash
# AMET Alumni Portal Deployment Script
# This script helps deploy the application to Vercel

echo "AMET Alumni Portal Deployment Script"
echo "===================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git not found. Please install git and try again."
    exit 1
fi

# Ensure we're in the project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "You have uncommitted changes. Please commit or stash them before deploying."
    echo "Run 'git status' to see the changes."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Ask for confirmation
read -p "Deploy branch '$CURRENT_BRANCH' to Vercel? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

# Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "Deployment initiated. Check the Vercel dashboard for deployment status."
echo "https://vercel.com/dashboard"
