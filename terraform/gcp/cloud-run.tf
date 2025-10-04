locals {
  service_name_prefix = "community-connect"
  common_annotations = {
    "autoscaling.knative.dev/maxScale" = "10"
    "autoscaling.knative.dev/minScale" = "1"
  }
  
  # Backend settings
  backend = {
    name           = "${local.service_name_prefix}-backend"
    container_port = 8000
    health_path    = "/health/"
  }
  
  # Frontend settings
  frontend = {
    name           = "${local.service_name_prefix}-frontend"
    container_port = 80
    health_path    = "/health"
  }
  
  # Common service settings
  service_settings = {
    container_concurrency = 80
    timeout_seconds      = 300
  }
}

# Cloud Run Backend Service
resource "google_cloud_run_service" "backend" {
  name     = local.backend.name
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email
      
      containers {
        image = "gcr.io/${var.project_id}/backend:latest"
        
        resources {
          limits = {
            cpu    = var.backend_cpu
            memory = var.backend_memory
          }
        }

        env {
          name  = "DJANGO_SETTINGS_MODULE"
          value = "backend.settings"
        }

        env {
          name = "DJANGO_SECRET_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.django_secret.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }

        env {
          name = "REDIS_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.redis_url.secret_id
              key  = "latest"
            }
          }
        }

        ports {
          name           = "http1"
          container_port = local.backend.container_port
        }

        startup_probe {
          http_get {
            path = local.backend.health_path
          }
          initial_delay_seconds = 10
          timeout_seconds      = 3
          period_seconds      = 5
          failure_threshold   = 3
        }

        liveness_probe {
          http_get {
            path = local.backend.health_path
          }
          initial_delay_seconds = 60
          timeout_seconds      = 3
          period_seconds      = 30
        }
      }

      container_concurrency = local.service_settings.container_concurrency
      timeout_seconds      = local.service_settings.timeout_seconds
    }

    metadata {
      annotations = merge(local.common_annotations, {
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.id
        "run.googleapis.com/cloudsql-instances"  = google_sql_database_instance.postgres.connection_name
      })
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true

  depends_on = [
    google_project_service.run,
    google_project_service.vpcaccess
  ]
}

# Cloud Run Frontend Service
resource "google_cloud_run_service" "frontend" {
  name     = local.frontend.name
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email
      
      containers {
        image = "gcr.io/${var.project_id}/frontend:latest"
        
        resources {
          limits = {
            cpu    = var.frontend_cpu
            memory = var.frontend_memory
          }
        }

        env {
          name  = "API_URL"
          value = "https://${var.domain_name}/api"
        }

        ports {
          name           = "http1"
          container_port = local.frontend.container_port
        }

        startup_probe {
          http_get {
            path = local.frontend.health_path
          }
          initial_delay_seconds = 5
          timeout_seconds      = 3
          period_seconds      = 5
          failure_threshold   = 3
        }

        liveness_probe {
          http_get {
            path = local.frontend.health_path
          }
          initial_delay_seconds = 30
          timeout_seconds      = 3
          period_seconds      = 30
        }
      }

      container_concurrency = local.service_settings.container_concurrency
      timeout_seconds      = local.service_settings.timeout_seconds
    }

    metadata {
      annotations = local.common_annotations
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

# VPC Access Connector
resource "google_vpc_access_connector" "connector" {
  name          = "${local.service_name_prefix}-vpc-connector"
  ip_cidr_range = var.vpc_connector_cidr
  network       = google_compute_network.main.name
  region        = var.region

  depends_on = [
    google_project_service.vpcaccess
  ]
}

# Cloud Run NEG Backend Service
resource "google_compute_backend_service" "backend" {
  name = local.backend.name

  protocol    = "HTTP"
  port_name   = "http1"
  timeout_sec = local.service_settings.timeout_seconds

  backend {
    group = google_compute_region_network_endpoint_group.backend.id
  }

  log_config {
    enable = true
  }

  health_checks = [google_compute_health_check.backend.id]
}

resource "google_compute_region_network_endpoint_group" "backend" {
  name                  = "${local.backend.name}-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_service.backend.name
  }
}

# Frontend NEG Backend Service
resource "google_compute_backend_service" "frontend" {
  name = local.frontend.name

  protocol    = "HTTP"
  port_name   = "http1"
  timeout_sec = local.service_settings.timeout_seconds

  backend {
    group = google_compute_region_network_endpoint_group.frontend.id
  }

  log_config {
    enable = true
  }

  health_checks = [google_compute_health_check.frontend.id]
}

resource "google_compute_region_network_endpoint_group" "frontend" {
  name                  = "${local.frontend.name}-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_service.frontend.name
  }
}

# Health Checks
resource "google_compute_health_check" "backend" {
  name = "${local.backend.name}-health"

  http_health_check {
    port         = local.backend.container_port
    request_path = local.backend.health_path
  }
}

resource "google_compute_health_check" "frontend" {
  name = "${local.frontend.name}-health"

  http_health_check {
    port         = local.frontend.container_port
    request_path = local.frontend.health_path
  }
}