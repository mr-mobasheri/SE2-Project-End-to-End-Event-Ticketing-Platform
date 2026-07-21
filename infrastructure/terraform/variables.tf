variable "aws_region" {
  description = "AWS Cloud hosting region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "EKS Kubernetes Cluster name"
  type        = string
  default     = "ticketing-prod-cluster"
}

variable "db_username" {
  description = "PostgreSQL DB Administrator Username"
  type        = string
  default     = "postgres_admin"
}

variable "db_password" {
  description = "PostgreSQL DB Administrator Password"
  type        = string
  sensitive   = true
  default     = "TicketingSecurePass123"
}