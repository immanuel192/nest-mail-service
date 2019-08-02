#!/bin/bash
set -e

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  echo "This is PR, no need to deploy"
  exit 0
fi

npm run dist
echo "Deploying to PRODUCTION...."
