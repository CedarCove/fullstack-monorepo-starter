#!/bin/bash

# Vercel Ignored Build Step
# This script determines whether Vercel should build the web app
# Exit code 1: Build should proceed
# Exit code 0: Build should be skipped
#
# Docs: https://vercel.com/docs/projects/overview#ignored-build-step

echo "🔍 Checking if build is needed for @grasp/web..."

# For production/preview deployments, check for changes
if [[ "$VERCEL_ENV" == "production" ]] || [[ "$VERCEL_ENV" == "preview" ]]; then
  echo "Environment: $VERCEL_ENV"
  echo "Branch: $VERCEL_GIT_COMMIT_REF"

  # Get the previous commit to compare against
  if [[ -z "$VERCEL_GIT_PREVIOUS_SHA" ]]; then
    echo "⚠️  No previous commit found, proceeding with build"
    exit 1
  fi

  echo "Comparing $VERCEL_GIT_PREVIOUS_SHA...$VERCEL_GIT_COMMIT_SHA"

  # Check for changes in web app or shared packages
  git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" -- \
    apps/web \
    packages \
    package.json \
    pnpm-lock.yaml \
    turbo.json

  # If git diff exits with 1, there are changes
  if [[ $? -eq 1 ]]; then
    echo "✅ Changes detected in web app or dependencies"
    echo "📦 Proceeding with build..."
    exit 1
  else
    echo "⏭️  No changes detected in web app"
    echo "🚫 Skipping build..."
    exit 0
  fi
else
  # For development deployments, always build
  echo "Development environment: always building"
  exit 1
fi
