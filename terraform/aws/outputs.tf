# Backend outputs
output "aws_ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "aws_ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.backend.name
}

output "aws_rds_endpoint" {
  description = "Database endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "aws_elasticache_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "aws_cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "aws_s3_bucket_static" {
  description = "S3 bucket for static files"
  value       = aws_s3_bucket.static.id
}

output "aws_s3_bucket_media" {
  description = "S3 bucket for media files"
  value       = aws_s3_bucket.media.id
}

# Frontend outputs
output "aws_cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "aws_route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

# ECR outputs
output "aws_ecr_repository_backend_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "aws_ecr_repository_frontend_url" {
  description = "ECR repository URL for frontend"
  value       = aws_ecr_repository.frontend.repository_url
}