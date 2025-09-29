# RDS Subnet Group
resource "aws_db_subnet_group" "postgres" {
  name       = "community-connect-db-subnet-group"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Environment = var.environment
  }
}

# RDS Security Group
resource "aws_security_group" "postgres" {
  name        = "community-connect-postgres-sg"
  description = "Security group for PostgreSQL RDS instance"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  tags = {
    Name = "community-connect-postgres-sg"
  }
}

# Random password for PostgreSQL
resource "random_password" "postgres" {
  length  = 16
  special = false
}

# Store PostgreSQL password in Secrets Manager
resource "aws_secretsmanager_secret" "postgres_password" {
  name = "community-connect/${var.environment}/postgres-password"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "postgres_password" {
  secret_id     = aws_secretsmanager_secret.postgres_password.id
  secret_string = random_password.postgres.result
}

# RDS Parameter Group for PostGIS
resource "aws_db_parameter_group" "postgres" {
  family = "postgres15"
  name   = "community-connect-postgres-params"

  parameter {
    name  = "shared_preload_libraries"
    value = "postgis-3"
  }

  parameter {
    name  = "max_connections"
    value = "200"
  }

  parameter {
    name  = "work_mem"
    value = "4096"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "128000"
  }

  tags = {
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier = "community-connect-${var.environment}"

  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "community_connect"
  username = "postgres"
  password = random_password.postgres.result
  port     = 5432

  vpc_security_group_ids = [aws_security_group.postgres.id]
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az               = var.environment == "production"
  publicly_accessible    = false
  skip_final_snapshot    = var.environment != "production"
  deletion_protection    = var.environment == "production"

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.rds_monitoring_role.arn

  auto_minor_version_upgrade = true

  tags = {
    Environment = var.environment
  }
}

# RDS Monitoring Role
resource "aws_iam_role" "rds_monitoring_role" {
  name = "community-connect-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_policy" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Read Replica (for production only)
resource "aws_db_instance" "postgres_replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "community-connect-${var.environment}-replica"

  instance_class = var.db_instance_class
  replicate_source_db = aws_db_instance.postgres.id

  vpc_security_group_ids = [aws_security_group.postgres.id]
  
  auto_minor_version_upgrade = true
  backup_retention_period    = 0
  multi_az                  = false
  publicly_accessible       = false

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring_role.arn

  tags = {
    Environment = var.environment
  }
}