#!/bin/bash
set -e

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
GCP_PROJECT=${GCP_PROJECT_ID}
APP_NAME="community-connect"

# Function to log with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to AWS
deploy_aws() {
    log "Deploying to AWS..."

    # Build and push Docker images to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-backend:$TAG -f Dockerfile.backend .
    docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-frontend:$TAG -f Dockerfile.frontend .
    
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-backend:$TAG
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$APP_NAME-frontend:$TAG

    # Apply database migrations
    log "Running database migrations..."
    aws ecs run-task --cluster $APP_NAME \
        --task-definition $APP_NAME-migrate \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_IDS]}"

    # Update ECS services
    log "Updating ECS services..."
    aws ecs update-service --cluster $APP_NAME --service $APP_NAME-backend --force-new-deployment
    aws ecs update-service --cluster $APP_NAME --service $APP_NAME-frontend --force-new-deployment

    # Collect and upload static files
    log "Collecting static files..."
    aws ecs run-task --cluster $APP_NAME \
        --task-definition $APP_NAME-collectstatic \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$SECURITY_GROUP_IDS]}"
}

# Function to deploy to GCP
deploy_gcp() {
    log "Deploying to GCP..."

    # Build and push Docker images to GCR
    gcloud auth configure-docker
    
    docker build -t gcr.io/$GCP_PROJECT/$APP_NAME-backend:$TAG -f Dockerfile.backend .
    docker build -t gcr.io/$GCP_PROJECT/$APP_NAME-frontend:$TAG -f Dockerfile.frontend .
    
    docker push gcr.io/$GCP_PROJECT/$APP_NAME-backend:$TAG
    docker push gcr.io/$GCP_PROJECT/$APP_NAME-frontend:$TAG

    # Deploy to Cloud Run
    log "Deploying to Cloud Run..."
    gcloud run deploy $APP_NAME-backend \
        --image gcr.io/$GCP_PROJECT/$APP_NAME-backend:$TAG \
        --platform managed \
        --region $GCP_REGION \
        --allow-unauthenticated

    gcloud run deploy $APP_NAME-frontend \
        --image gcr.io/$GCP_PROJECT/$APP_NAME-frontend:$TAG \
        --platform managed \
        --region $GCP_REGION \
        --allow-unauthenticated

    # Run migrations
    log "Running database migrations..."
    gcloud run jobs execute $APP_NAME-migrate --wait

    # Collect static files
    log "Collecting static files..."
    gsutil -m rsync -r static gs://$GCP_BUCKET/static
}

# Function to verify deployment
verify_deployment() {
    log "Verifying deployment..."
    local endpoint=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$endpoint/health/" > /dev/null; then
            log "Deployment verified successfully!"
            return 0
        fi
        
        log "Attempt $attempt of $max_attempts: Service not ready yet..."
        sleep 10
        ((attempt++))
    done

    log "ERROR: Deployment verification failed after $max_attempts attempts"
    return 1
}

# Main execution
main() {
    # Set deployment tag
    TAG=${GITHUB_SHA:-$(git rev-parse HEAD)}
    
    # Validate required environment variables
    if [ -z "$DEPLOYMENT_TARGET" ]; then
        log "ERROR: DEPLOYMENT_TARGET environment variable must be set to 'aws' or 'gcp'"
        exit 1
    fi

    # Deploy based on target
    case $DEPLOYMENT_TARGET in
        aws)
            deploy_aws
            verify_deployment "$AWS_ALB_DNS"
            ;;
        gcp)
            deploy_gcp
            verify_deployment "$GCP_SERVICE_URL"
            ;;
        *)
            log "ERROR: Invalid DEPLOYMENT_TARGET. Must be 'aws' or 'gcp'"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"