# Backend outputs
output "gcp_cloud_run_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_service.backend.status[0].url
}

output "gcp_cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "gcp_redis_host" {
  description = "Redis instance host"
  value       = google_redis_instance.cache.host
}

output "gcp_storage_bucket_static" {
  description = "Cloud Storage bucket for static files"
  value       = google_storage_bucket.static.name
}

output "gcp_storage_bucket_media" {
  description = "Cloud Storage bucket for media files"
  value       = google_storage_bucket.media.name
}

# Frontend outputs
output "gcp_cdn_backend_bucket_static" {
  description = "CDN backend bucket for static files"
  value       = google_compute_backend_bucket.static.name
}

output "gcp_cdn_backend_bucket_media" {
  description = "CDN backend bucket for media files"
  value       = google_compute_backend_bucket.media.name
}

# Container Registry outputs
output "gcp_container_registry" {
  description = "Container Registry URL"
  value       = "gcr.io/${var.project_id}"
}

# Monitoring outputs
output "gcp_monitoring_dashboard_cdn" {
  description = "CDN monitoring dashboard"
  value       = google_monitoring_dashboard.cdn.dashboard_json
}

output "gcp_monitoring_dashboard_redis" {
  description = "Redis monitoring dashboard"
  value       = google_monitoring_dashboard.redis.dashboard_json
}

output "gcp_monitoring_dashboard_secrets" {
  description = "Secrets monitoring dashboard"
  value       = google_monitoring_dashboard.secrets.dashboard_json
}