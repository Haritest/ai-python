# Architecture Diagrams

## Overview

This document captures the primary AWS architecture diagrams for the platform.
It uses Mermaid notation for visual design and reflects AWS components such as Route 53, CloudFront, WAF, ALB, EKS, RDS, S3, ECR, and AWS Backup.

## Contents

- [Overview](#overview)
- [Request Flow Diagram](#1-request-flow-diagram)
- [EKS Cluster Architecture](#2-eks-cluster-architecture)
- [Data Layer Architecture](#3-data-layer-architecture)
- [CI/CD Pipeline Flow](#4-cicd-pipeline-flow)
- [Storage & Backup Architecture](#5-storage--backup-architecture)
- [Diagram Conventions](#diagram-conventions)

---

## 1. Request Flow Diagram

This diagram shows the external request path from the client through AWS edge services, network security, load balancing, and into the Kubernetes application tier.

```mermaid
graph LR
    DNS["🌐 Route 53<br/>DNS Resolution"]
    CDN["☁️ CloudFront<br/>Global CDN"]
    WAF["🛡️ AWS WAF<br/>Web ACL / DDoS Protection"]
    ALB["⚖️ ALB<br/>Application Load Balancer"]
    Ingress["📡 EKS Ingress<br/>Controller"]
    NLB["🔄 NLB<br/>Network Load Balancer"]
    Proxy["🔀 HAProxy<br/>Internal Proxy"]

    FE["🎨 Frontend<br/>Service<br/>Replicas: 2-5"]
    BE1["⚙️ Backend<br/>Service 1"]
    BE2["⚙️ Backend<br/>Service 2"]
    BE3["⚙️ Backend<br/>Service 3"]
    BEn["⚙️ Backend<br/>Service 1-10"]

    RDS["🗄️ Amazon RDS<br/>PostgreSQL"]
    Cassandra["🗄️ Cassandra<br/>EC2 Cluster<br/>3 Nodes"]
    Neo4j["🗄️ Neo4j<br/>Graph DB<br/>EC2"]
    S3["📦 Amazon S3<br/>Object Storage"]

    DNS --> CDN
    CDN --> WAF
    WAF --> ALB
    ALB --> Ingress
    Ingress --> NLB
    NLB --> Proxy
    Proxy -->|30%| FE
    Proxy -->|70%| BE1
    BE1 --> BE2
    BE2 --> BE3
    BE3 --> BEn

    FE --> RDS
    FE --> Cassandra
    FE --> Neo4j
    FE --> S3

    BE1 --> RDS
    BE1 --> Cassandra
    BE1 --> Neo4j
    BE1 --> S3

    BEn --> RDS
    BEn --> Cassandra
    BEn --> Neo4j
    BEn --> S3
```

This flow emphasizes AWS edge services, secure ingress, and service-to-data connectivity across frontend and backend tiers.

---

## 2. EKS Cluster Architecture

This view describes the AWS VPC, subnet layout, EKS managed control plane, worker node groups, and pod placement.

```mermaid
graph TB
    subgraph VPC["VPC 10.0.0.0/16"]
        subgraph PubSubnet["Public Subnets<br/>10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24"]
            NAT["🔄 NAT Gateway"]
            IGW["🌐 Internet Gateway"]
        end

        subgraph PrivSubnet["Private Subnets<br/>EKS Worker Nodes"]
            Node1["🖥️ Worker Node 1<br/>t3.large"]
            Node2["🖥️ Worker Node 2<br/>t3.large"]
            Node3["🖥️ Worker Node 3<br/>t3.large"]
        end

        subgraph EKSControl["☸️ AWS EKS Control Plane<br/>Managed by AWS"]
            API["API Server"]
            ETCD["etcd Database"]
            Sched["Scheduler"]
        end

        subgraph Pods["Pods & Services"]
            subgraph FEDeployment["Frontend Deployment"]
                FEPod1["Pod: Frontend<br/>Container: Node.js"]
                FEPod2["Pod: Frontend<br/>Container: Node.js"]
            end
            
            subgraph BEDeployment["Backend Deployment<br/>10 Services"]
                BEPod1["Pod: Service-1<br/>Container: Java"]
                BEPod2["Pod: Service-2<br/>Container: Python"]
                BEPod3["Pod: Service-10<br/>Container: Go"]
            end
            
            subgraph HAProxyDeploy["HAProxy Deployment"]
                HAP1["Pod: HAProxy<br/>Replicas: 2"]
                HAP2["Pod: HAProxy<br/>Replicas: 2"]
            end
        end
    end

    Node1 --> FEPod1
    Node2 --> FEPod2
    Node3 --> BEPod1
    Node1 --> BEPod2
    Node2 --> BEPod3
    Node3 --> HAP1
    Node1 --> HAP2

    EKSControl -->|Manages| Node1
    EKSControl -->|Manages| Node2
    EKSControl -->|Manages| Node3

    API --> ETCD
    API --> Sched
    NAT --> Node1
    NAT --> Node2
    NAT --> Node3
    IGW --> NAT
```

The cluster diagram highlights AWS managed EKS control plane separation, private worker node groups, and public subnet egress.

---

## 3. Data Layer Architecture

This section illustrates AWS data infrastructure, security boundaries, and backup flows for the stateful data tier.

```mermaid
graph TB
    subgraph DataLayer["Data Layer<br/>Private Subnets"]
        subgraph RDSSubnet["Amazon RDS<br/>Private Subnet"]
            RDS["🗄️ Amazon RDS<br/>PostgreSQL<br/>Multi-AZ"]
            RDSBackup["📦 Automated Backups<br/>7-Day Retention"]
        end

        subgraph CassSubnet["Cassandra Cluster<br/>EC2 / Private Subnets"]
            CS1["Node 1: r5.xlarge<br/>1TB gp3<br/>us-east-1a"]
            CS2["Node 2: r5.xlarge<br/>1TB gp3<br/>us-east-1b"]
            CS3["Node 3: r5.xlarge<br/>1TB gp3<br/>us-east-1c"]
        end

        subgraph NeoSubnet["Neo4j Graph DB<br/>EC2 Instance"]
            Neo4j["🗄️ Neo4j<br/>m5.xlarge<br/>Ports: 7687, 7474"]
            NeoBackup["📦 Snapshot Backup<br/>Daily"]
        end
    end

    subgraph Security["Security"]
        SG["🔐 DB Security Group<br/>EKS Ingress Only"]
        Secrets["🔑 AWS Secrets Manager<br/>Credentials"]
        KMS["🔐 AWS KMS<br/>Encryption Keys"]
    end

    subgraph Monitoring["Monitoring & Audit"]
        CloudWatch["📈 CloudWatch Logs<br/>Connection Audit"]
        Backup["💾 AWS Backup Service<br/>Centralized Management"]
    end

    RDS --> RDSBackup
    CS1 -->|Replicate| CS2
    CS2 -->|Replicate| CS3
    Neo4j --> NeoBackup

    DataLayer --> Security
    DataLayer --> Monitoring
    Secrets -->|Authenticates| RDS
    Secrets -->|Authenticates| CS1
    Secrets -->|Authenticates| Neo4j
    KMS -->|Encrypts| RDSBackup
    KMS -->|Encrypts| NeoBackup
```

This data layer emphasizes AWS-managed relational storage, secrets management, encryption, and multi-node replication.

---

## 4. CI/CD Pipeline Flow

The pipeline diagram outlines code commit through build, test, containerization, deployment, and verification with AWS container registry integration.

```mermaid
graph LR
    Git["📝 Git Repository<br/>GitHub/GitLab<br/>Webhook Trigger"]
    
    Jenkins["🚀 Jenkins Master<br/>Build Orchestration"]
    
    Build["🔨 Build Stage<br/>Maven / npm<br/>Compile & Test"]
    
    Test["🧪 Test Stage<br/>Unit Tests<br/>SonarQube<br/>SAST"]
    
    Container["📦 Docker Build<br/>Image Scan<br/>Tag Image"]
    
    ECR["🐳 Amazon ECR<br/>Container Registry"]
    
    Deploy["📤 Deploy Stage<br/>Helm Chart<br/>kubectl Apply"]
    
    EKS["☸️ Amazon EKS<br/>Kubernetes Cluster"]
    
    Verify["✅ Verification<br/>Smoke Tests<br/>Health Check"]
    
    Notify["📢 Notification<br/>Slack / Email<br/>Success / Failure"]
    
    Git -->|Webhook| Jenkins
    Jenkins --> Build
    Build --> Test
    Test --> Container
    Container --> ECR
    ECR --> Deploy
    Deploy --> EKS
    EKS --> Verify
    Verify --> Notify
```

The CI/CD flow supports continuous delivery with a verification step before notification and deployment to Amazon EKS.

---

## 5. Storage & Backup Architecture

This diagram shows how AWS storage and backup services integrate with the application and data tiers to ensure recovery and retention.

```mermaid
graph LR
    AppTier["🖥️ Application Tier<br/>EKS / EC2"]
    
    S3["📦 Amazon S3<br/>Object Storage<br/>Static Assets, Logs"]
    
    EBS["🔌 Amazon EBS<br/>Block Storage"]
    
    Snapshot["🗄️ EBS Snapshots<br/>Daily Retention"]
    
    Backup["💾 AWS Backup<br/>Policy-Based Backup"]
    
    Glacier["🥶 Amazon S3 Glacier<br/>Long-Term Archival"]
    
    AppTier -->|Stores Data| S3
    AppTier -->|Attaches Volume| EBS
    EBS --> Snapshot
    Snapshot --> Backup
    S3 --> Backup
    Backup --> Glacier
```

This section standardizes the storage layer with Amazon S3, Amazon EBS, AWS Backup, and Glacier archival.

---

## Diagram Conventions

- All diagrams use Mermaid code blocks for consistent rendering.
- Headings use a numbered structure for easy navigation.
- AWS components are labeled with service names and deployment intent.
- Each section includes a summary to explain the diagram purpose.
