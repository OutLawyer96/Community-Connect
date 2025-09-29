#!/bin/bash

# Setup script for Community Connect project

# Check for required tools
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Terraform is required but not installed. Aborting." >&2; exit 1; }

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create environment files
echo "Creating environment files..."
cp env.template .env
cp frontend/.env.template frontend/.env

# Initialize Git hooks
echo "Setting up Git hooks..."
cp scripts/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit

# Initialize Terraform
echo "Initializing Terraform..."
cd terraform/aws
terraform init
cd ../gcp
terraform init
cd ../..

echo "Setup complete! Please update the environment variables in .env and frontend/.env"