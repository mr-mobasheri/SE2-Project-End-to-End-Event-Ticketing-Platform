provider "aws" {
  region = "us-east-1"
}
resource "aws_eks_cluster" "ticketing_cluster" {
  name     = "ticketing-production-cluster"
  role_arn = aws_iam_role.eks_role.arn
}
resource "aws_db_instance" "postgres_primary" {
  allocated_storage    = 50
  engine               = "postgres"
  db_name              = "ticketing_db"
  username             = "admin"
  password             = "secure_password_here"
}