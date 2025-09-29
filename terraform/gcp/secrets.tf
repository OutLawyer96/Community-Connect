# Django secret key
resource "google_secret_manager_secret" "django_secret" {
  secret_id = "community-connect-${var.environment}-django-secret"

  replication {
    auto {
      customer_managed_encryption {
        kms_key_name = google_kms_crypto_key.secret_key.id
      }
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Database credentials
resource "google_secret_manager_secret" "db_password" {
  secret_id = "community-connect-${var.environment}-db-password"

  replication {
    auto {
      customer_managed_encryption {
        kms_key_name = google_kms_crypto_key.secret_key.id
      }
    }
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Initial versions of secrets
resource "google_secret_manager_secret_version" "django_secret_data" {
  secret      = google_secret_manager_secret.django_secret.id
  secret_data = var.django_secret_key
}

resource "google_secret_manager_secret_version" "db_password_data" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

# KMS key for encrypting secrets
resource "google_kms_key_ring" "secret_keyring" {
  name     = "community-connect-${var.environment}-keyring"
  location = var.region
}

resource "google_kms_crypto_key" "secret_key" {
  name     = "community-connect-${var.environment}-key"
  key_ring = google_kms_key_ring.secret_keyring.id

  rotation_period = "7776000s" # 90 days

  lifecycle {
    prevent_destroy = true
  }
}

# IAM for Cloud Run to access secrets
resource "google_secret_manager_secret_iam_member" "django_secret_access" {
  secret_id = google_secret_manager_secret.django_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "db_password_access" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# IAM for Cloud Run to access secrets is already defined above

# Cloud Monitoring for secret access metrics
resource "google_monitoring_dashboard" "secrets" {
  dashboard_json = jsonencode({
    displayName = "Secrets Access Dashboard"
    gridLayout = {
      columns = 2
      widgets = [
        {
          title = "Secret Access Count"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"secretmanager.googleapis.com/secret_access_count\" resource.type=\"secret\""
                }
              }
            }]
          }
        }
      ]
    }
  })
}