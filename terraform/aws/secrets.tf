# KMS key for secrets encryption
resource "aws_kms_key" "secrets" {
  description             = "KMS key for Community Connect secrets"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Project     = "community-connect"
  }
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/community-connect-${var.environment}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# Django secret key
resource "aws_secretsmanager_secret" "django_secret" {
  name                    = "community-connect/${var.environment}/django-secret"
  description             = "Django secret key for Community Connect"
  kms_key_id             = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
    Project     = "community-connect"
  }
}

resource "aws_secretsmanager_secret_version" "django_secret" {
  secret_id     = aws_secretsmanager_secret.django_secret.id
  secret_string = var.django_secret_key
}

# Database connection string
resource "aws_secretsmanager_secret" "db_url" {
  name                    = "community-connect/${var.environment}/db-url"
  description             = "Database connection string for Community Connect"
  kms_key_id             = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
    Project     = "community-connect"
  }
}

resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id = aws_secretsmanager_secret.db_url.id
  secret_string = jsonencode({
    host     = aws_rds_cluster.main.endpoint
    port     = aws_rds_cluster.main.port
    database = aws_rds_cluster.main.database_name
    username = aws_rds_cluster.main.master_username
    password = aws_rds_cluster.main.master_password
  })
}

# Redis connection string
resource "aws_secretsmanager_secret" "redis_url" {
  name                    = "community-connect/${var.environment}/redis-url"
  description             = "Redis connection string for Community Connect"
  kms_key_id             = aws_kms_key.secrets.arn
  recovery_window_in_days = 7

  tags = {
    Environment = var.environment
    Project     = "community-connect"
  }
}

resource "aws_secretsmanager_secret_version" "redis_url" {
  secret_id = aws_secretsmanager_secret.redis_url.id
  secret_string = jsonencode({
    host     = aws_elasticache_replication_group.redis.primary_endpoint_address
    port     = aws_elasticache_replication_group.redis.port
  })
}

# IAM role for ECS tasks to access secrets
resource "aws_iam_role_policy_attachment" "task_secrets" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

resource "aws_iam_policy" "secrets_access" {
  name        = "community-connect-${var.environment}-secrets-access"
  description = "Allow ECS tasks to access secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          aws_secretsmanager_secret.django_secret.arn,
          aws_secretsmanager_secret.db_url.arn,
          aws_secretsmanager_secret.redis_url.arn,
          aws_kms_key.secrets.arn
        ]
      }
    ]
  })
}