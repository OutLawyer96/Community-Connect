terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }

  backend "gcs" {
    bucket = "community-connect-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "community-connect-network"
  auto_create_subnetworks = false
}

# Subnets
resource "google_compute_subnetwork" "private" {
  name          = "community-connect-private-subnet"
  ip_cidr_range = var.private_subnet_cidr
  network       = google_compute_network.main.id
  region        = var.region

  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pod_subnet_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.service_subnet_cidr
  }
}

# Cloud NAT
resource "google_compute_router" "router" {
  name    = "community-connect-router"
  network = google_compute_network.main.id
  region  = var.region
}

resource "google_compute_router_nat" "nat" {
  name                               = "community-connect-nat"
  router                            = google_compute_router.router.name
  region                            = var.region
  nat_ip_allocate_option           = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Firewall Rules
resource "google_compute_firewall" "allow_internal" {
  name    = "community-connect-allow-internal"
  network = google_compute_network.main.id

  allow {
    protocol = "tcp"
  }
  allow {
    protocol = "udp"
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.private_subnet_cidr,
    var.pod_subnet_cidr,
    var.service_subnet_cidr
  ]
}

# Load Balancer
resource "google_compute_global_address" "default" {
  name = "community-connect-ip"
}

resource "google_compute_managed_ssl_certificate" "default" {
  provider = google-beta
  name     = "community-connect-cert"

  managed {
    domains = [var.domain_name]
  }
}

resource "google_compute_global_forwarding_rule" "https" {
  name       = "community-connect-https-rule"
  target     = google_compute_target_https_proxy.default.id
  port_range = "443"
  ip_address = google_compute_global_address.default.address
}

resource "google_compute_target_https_proxy" "default" {
  name             = "community-connect-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_url_map" "default" {
  name            = "community-connect-url-map"
  default_service = google_compute_backend_service.frontend.id

  host_rule {
    hosts        = [var.domain_name]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_service.frontend.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.backend.id
    }
  }
}

# IAM for Service Accounts
resource "google_service_account" "cloud_run" {
  account_id   = "cloud-run-sa"
  display_name = "Cloud Run Service Account"
}

resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
    "roles/redis.viewer"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}