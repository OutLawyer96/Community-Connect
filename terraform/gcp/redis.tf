# Redis instance
resource "google_redis_instance" "cache" {
  name           = "community-connect-${var.environment}"
  tier           = var.environment == "production" ? "STANDARD_HA" : "BASIC"
  memory_size_gb = var.environment == "production" ? 5 : 1

  region                  = var.region
  authorized_network      = google_compute_network.vpc.id
  connect_mode           = "PRIVATE_SERVICE_ACCESS"
  redis_version          = "REDIS_6_X"
  display_name           = "Community Connect Cache"
  reserved_ip_range      = "10.0.0.0/29"
  maintenance_policy {
    weekly_maintenance_window {
      day = "SUNDAY"
      start_time {
        hours   = 2
        minutes = 0
      }
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# VPC Connector for Cloud Run to access Redis
resource "google_vpc_access_connector" "redis" {
  name          = "community-connect-redis-connector"
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc.name
  region        = var.region
}

locals {
  redis_connection = {
    host = google_redis_instance.cache.host
    port = google_redis_instance.cache.port
  }
  vpc_connector_annotations = {
    "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.redis.name
    "run.googleapis.com/vpc-access-egress"    = "private-ranges-only"
  }
}

# Cloud Monitoring dashboard for Redis metrics
resource "google_monitoring_dashboard" "redis" {
  dashboard_json = jsonencode({
    displayName = "Redis Performance Dashboard"
    gridLayout = {
      columns = 2
      widgets = [
        {
          title = "Connected Clients"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"redis.googleapis.com/stats/connected_clients\" resource.type=\"redis_instance\""
                }
              }
            }]
          }
        },
        {
          title = "Memory Usage"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"redis.googleapis.com/stats/memory/usage\" resource.type=\"redis_instance\""
                }
                unitOverride = "By"
              }
            }]
          }
        }
      ]
    }
  })
}

# Alert policy for Redis memory usage
resource "google_monitoring_alert_policy" "redis_memory" {
  display_name = "Redis High Memory Usage"
  combiner     = "OR"
  conditions {
    display_name = "Redis Memory Usage > 90%"
    condition_threshold {
      filter          = "metric.type=\"redis.googleapis.com/stats/memory/usage\" resource.type=\"redis_instance\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.9
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [var.notification_channel_id]

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "Redis instance memory usage is above 90%. Consider upgrading the instance size or optimizing the cache usage."
    mime_type = "text/markdown"
  }
}