# Static files bucket
resource "google_storage_bucket" "static" {
  name          = "community-connect-${var.environment}-static"
  location      = var.region
  force_destroy = var.environment != "production"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["https://${var.domain_name}"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Media files bucket
resource "google_storage_bucket" "media" {
  name          = "community-connect-${var.environment}-media"
  location      = var.region
  force_destroy = var.environment != "production"

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["https://${var.domain_name}"]
    method          = ["GET", "HEAD", "OPTIONS"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# IAM for Cloud Run to access buckets
resource "google_storage_bucket_iam_member" "static_viewer" {
  bucket = google_storage_bucket.static.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_storage_bucket_iam_member" "media_viewer" {
  bucket = google_storage_bucket.media.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud CDN backend buckets
resource "google_compute_backend_bucket" "static" {
  name        = "community-connect-static-backend"
  bucket_name = google_storage_bucket.static.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    client_ttl        = 3600
    default_ttl       = 3600
    max_ttl          = 86400
    serve_while_stale = 86400
  }
}

resource "google_compute_backend_bucket" "media" {
  name        = "community-connect-media-backend"
  bucket_name = google_storage_bucket.media.name
  enable_cdn  = true

  cdn_policy {
    cache_mode        = "USE_ORIGIN_HEADERS"
    client_ttl        = 3600
    default_ttl       = 3600
    max_ttl          = 86400
    serve_while_stale = 86400
  }
}

# URL map paths for static and media
resource "google_compute_url_map" "cdn" {
  name            = "community-connect-cdn"
  default_service = google_compute_backend_service.frontend.id

  host_rule {
    hosts        = [var.domain_name]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.frontend.id

    path_rule {
      paths   = ["/static/*"]
      service = google_compute_backend_bucket.static.id
    }

    path_rule {
      paths   = ["/media/*"]
      service = google_compute_backend_bucket.media.id
    }

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.backend.id
    }
  }
}

# DNS record for CDN
resource "google_dns_record_set" "cdn" {
  name         = var.domain_name
  type         = "A"
  ttl          = 300
  managed_zone = var.dns_zone_name

  rrdatas = [google_compute_global_address.default.address]
}

# Cloud Monitoring dashboard for CDN metrics
resource "google_monitoring_dashboard" "cdn" {
  dashboard_json = jsonencode({
    displayName = "CDN Performance Dashboard"
    gridLayout = {
      columns = 2
      widgets = [
        {
          title = "Cache Hit Rate"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"loadbalancing.googleapis.com/https/request_bytes_count\" resource.type=\"https_lb_rule\""
                }
                unitOverride = "1"
              }
            }]
          }
        },
        {
          title = "Edge Latency"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"loadbalancing.googleapis.com/https/total_latencies\" resource.type=\"https_lb_rule\""
                }
                unitOverride = "ms"
              }
            }]
          }
        }
      ]
    }
  })
}