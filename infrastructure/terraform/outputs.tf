output "vpc_id" {
  description = "The ID of the provisioned VPC"
  value       = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  description = "Kubernetes API server endpoint for EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "database_primary_endpoint" {
  description = "Endpoint address of the PostgreSQL Master database Instance"
  value       = aws_db_instance.postgresql_primary.endpoint
}

output "redis_primary_endpoint" {
  description = "Connection endpoint for Redis distributed lock engine"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}