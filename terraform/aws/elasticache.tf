# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "redis" {
  name       = "community-connect-redis-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Environment = var.environment
  }
}

# ElastiCache Security Group
resource "aws_security_group" "redis" {
  name        = "community-connect-redis-sg"
  description = "Security group for Redis cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  tags = {
    Name = "community-connect-redis-sg"
  }
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "redis" {
  family = "redis7"
  name   = "community-connect-redis-params"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Kgx"
  }

  tags = {
    Environment = var.environment
  }
}

# ElastiCache Replication Group
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "community-connect-${var.environment}"
  description         = "Redis cluster for Community Connect"

  node_type            = var.redis_node_type
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [aws_security_group.redis.id]

  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"
  num_cache_clusters        = var.environment == "production" ? 2 : 1

  engine               = "redis"
  engine_version      = "7.0"
  maintenance_window  = "sun:05:00-sun:06:00"
  snapshot_window    = "04:00-05:00"
  snapshot_retention_limit = var.environment == "production" ? 7 : 1

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  auto_minor_version_upgrade = true

  tags = {
    Environment = var.environment
  }
}

# Store Redis connection info in Secrets Manager
resource "aws_secretsmanager_secret" "redis_url" {
  name = "community-connect/${var.environment}/redis-url"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  secret_id = aws_secretsmanager_secret.redis_url.id
  secret_string = "rediss://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379/0"
}

# CloudWatch Alarms for Redis
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "community-connect-${var.environment}-redis-cpu"
  alarm_description   = "Redis cluster CPU utilization"
  namespace           = "AWS/ElastiCache"
  metric_name         = "CPUUtilization"
  comparison_operator = "GreaterThanThreshold"
  threshold           = "75"
  evaluation_periods  = "2"
  period             = "300"
  statistic          = "Average"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  alarm_actions = [var.sns_alarm_topic_arn]
  ok_actions    = [var.sns_alarm_topic_arn]

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "community-connect-${var.environment}-redis-memory"
  alarm_description   = "Redis cluster memory utilization"
  namespace           = "AWS/ElastiCache"
  metric_name         = "DatabaseMemoryUsagePercentage"
  comparison_operator = "GreaterThanThreshold"
  threshold           = "80"
  evaluation_periods  = "2"
  period             = "300"
  statistic          = "Average"

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  alarm_actions = [var.sns_alarm_topic_arn]
  ok_actions    = [var.sns_alarm_topic_arn]

  tags = {
    Environment = var.environment
  }
}