# AWS Provider Configuration
terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. VPC & Network Architecture
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "3.19.0"

  name = "ticketing-platform-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"] # Secure App & DB Layer
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"] # Load Balancers & Ingress

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Environment = "production"
    Project     = "ticketing-platform"
  }
}

# 2. Kubernetes Cluster (Amazon EKS)
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.5.1"

  cluster_name    = var.cluster_name
  cluster_version = "1.24"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 5

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  tags = {
    Environment = "production"
  }
}

# 3. Database Layer (PostgreSQL - Amazon RDS with Master-Replica configuration)
resource "aws_db_subnet_group" "db_subnets" {
  name       = "ticketing-db-subnets"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "db_sg" {
  name   = "ticketing-db-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Primary PostgreSQL Instance
resource "aws_db_instance" "postgresql_primary" {
  identifier             = "ticketing-postgres-primary"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "14"
  instance_class         = "db.t3.micro"
  db_name                = "ticketing"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.db_subnets.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot    = true
  multi_az               = true # High Availability enabled as per Deployment Diagram

  tags = {
    Name = "ticketing-postgres-master"
  }
}

# 4. Cache & Temporary Distributed Locks Layer (ElastiCache Redis)
resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "ticketing-redis-subnets"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "redis_sg" {
  name   = "ticketing-redis-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Cluster-mode / Sentinel-equivalent Redis replication group
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id        = "ticketing-redis-cluster"
  description                 = "Redis Cluster for Distributed Seat Locking"
  node_type                   = "cache.t3.micro"
  port                        = 6379
  parameter_group_name        = "default.redis7"
  automatic_failover_enabled  = true
  num_cache_clusters          = 2 # Primary + Replica for lock persistence
  subnet_group_name           = aws_elasticache_subnet_group.redis_subnets.name
  security_group_ids          = [aws_security_group.redis_sg.id]

  tags = {
    Name = "ticketing-redis-store"
  }
}