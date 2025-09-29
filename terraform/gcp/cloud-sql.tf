# Random password for PostgreSQL
resource "random_password" "postgres" {
  length  = 32
  special = true
}

# Cloud SQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "community-connect-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  deletion_protection = var.environment == "production"

  settings {
    tier              = var.db_instance_tier
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = var.environment == "production"
      location                       = var.db_backup_location
      backup_retention_settings {
        retained_backups = var.environment == "production" ? 30 : 7
      }
    }

    ip_configuration {
      ipv4_enabled        = false
      private_network     = google_compute_network.main.id
      require_ssl         = true
      allocated_ip_range  = google_compute_global_address.private_ip_range.name
    }

    database_flags {
      name  = "max_connections"
      value = "200"
    }

    database_flags {
      name  = "shared_preload_libraries"
      value = "postgis-3"
    }

    insights_config {
      query_insights_enabled = true
      query_string_length    = 1024
      record_application_tags = true
      record_client_address  = true
    }

    maintenance_window {
      day          = 1  # Monday
      hour         = 4  # 4 AM
      update_track = "stable"
    }
  }

  depends_on = [
    google_service_networking_connection.private_vpc_connection
  ]
}

# Private IP range for Cloud SQL
resource "google_compute_global_address" "private_ip_range" {
  name          = "community-connect-private-ip-range"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

# VPC peering for Cloud SQL
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}

# Database
resource "google_sql_database" "database" {
  name     = "community_connect"
  instance = google_sql_database_instance.postgres.name
}

# Database user
resource "google_sql_user" "user" {
  name     = "postgres"
  instance = google_sql_database_instance.postgres.name
  password = random_password.postgres.result
}

# Read replica (for production)
resource "google_sql_database_instance" "postgres_replica" {
  count = var.environment == "production" ? 1 : 0

  name             = "community-connect-${var.environment}-replica"
  database_version = "POSTGRES_15"
  region           = var.region

  master_instance_name = google_sql_database_instance.postgres.name

  replica_configuration {
    failover_target = false
  }

  settings {
    tier              = var.db_instance_tier
    availability_type = "ZONAL"

    ip_configuration {
      ipv4_enabled        = false
      private_network     = google_compute_network.main.id
      require_ssl         = true
      allocated_ip_range  = google_compute_global_address.private_ip_range.name
    }

    insights_config {
      query_insights_enabled = true
      query_string_length    = 1024
      record_application_tags = true
      record_client_address  = true
    }
  }

  depends_on = [
    google_sql_database_instance.postgres
  ]
}

# Store database credentials in Secret Manager
resource "google_secret_manager_secret" "database_url" {
  secret_id = "community-connect-${var.environment}-database-url"

  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret = google_secret_manager_secret.database_url.id

  secret_data = "postgres://postgres:${random_password.postgres.result}@${google_sql_database_instance.postgres.private_ip_address}/community_connect"
}

# Cloud SQL monitoring alerts
resource "google_monitoring_alert_policy" "database_cpu" {
  display_name = "Cloud SQL CPU Usage - ${var.environment}"
  combiner     = "OR"
  conditions {
    display_name = "CPU Usage"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/cpu/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
    }
  }

  notification_channels = [var.notification_channel_id]

  documentation {
    content   = "Cloud SQL instance CPU usage is above 80%"
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "database_memory" {
  display_name = "Cloud SQL Memory Usage - ${var.environment}"
  combiner     = "OR"
  conditions {
    display_name = "Memory Usage"
    condition_threshold {
      filter          = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/memory/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
    }
  }

  notification_channels = [var.notification_channel_id]

  documentation {
    content   = "Cloud SQL instance memory usage is above 85%"
    mime_type = "text/markdown"
  }
}