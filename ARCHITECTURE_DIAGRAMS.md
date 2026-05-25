# AWS Architecture - Detailed Mermaid Diagrams

## 1. Request Flow Diagram

```mermaid
graph LR
    User["🌐 Browser/Client"]
    WAF["🛡️ AWS WAF<br/>DDoS Protection"]
    ALB["⚖️ Application<br/>Load Balancer"]
    Ingress["📡 K8s Ingress<br/>Controller"]
    LB["🔄 K8s Service<br/>Load Balancer"]
    HAProxy["🔀 HAProxy<br/>Load Balancer"]
    
    FE["🎨 Frontend<br/>Service<br/>Replicas: 2-5"]
    BE1["⚙️ Backend<br/>Service 1"]
    BE2["⚙️ Backend<br/>Service 2"]
    BE3["⚙️ Backend<br/>Service 3"]
    BEn["⚙️ Backend<br/>Service 1-10"]
    
    PG["🗄️ PostgreSQL<br/>VM"]
    CS["🗄️ Cassandra<br/>Cluster<br/>3 Nodes"]
    NEO["🗄️ Neo4j<br/>Graph DB"]
    
    S3["📦 AWS S3<br/>Storage"]
    
    User -->|HTTPS| WAF
    WAF -->|Inspect/Allow| ALB
    ALB -->|Route Traffic| Ingress
    Ingress -->|Forward| LB
    LB -->|Split Traffic| HAProxy
    HAProxy -->|30%| FE
    HAProxy -->|70%| BE1
    BE1 --> BE2
    BE2 --> BE3
    BE3 --> BEn
    
    FE --> PG
    FE --> CS
    FE --> NEO
    FE --> S3
    
    BE1 --> PG
    BE1 --> CS
    BE1 --> NEO
    BE1 --> S3
    
    BEn --> PG
    BEn --> CS
    BEn --> NEO
    BEn --> S3
```

---

## 2. EKS Cluster Architecture

```mermaid
graph TB
    subgraph VPC["VPC 10.0.0.0/16"]
        subgraph PubSubnet["Public Subnets<br/>10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24"]
            NAT["🔄 NAT Gateway"]
        end
        
        subgraph PrivSubnet["Private Subnets - EKS Nodes"]
            Node1["🖥️ Worker Node 1<br/>t3.large"]
            Node2["🖥️ Worker Node 2<br/>t3.large"]
            Node3["🖥️ Worker Node 3<br/>t3.large"]
        end
        
        subgraph K8sControl["Kubernetes Control Plane<br/>Managed by AWS"]
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
    
    K8sControl -->|Manages| Node1
    K8sControl -->|Manages| Node2
    K8sControl -->|Manages| Node3
    
    API --> ETCD
    API --> Sched
```

---

## 3. Data Layer Architecture

```mermaid
graph TB
    subgraph DataLayer["Data Layer - EC2 Instances<br/>Private Subnets"]
        subgraph PGSubnet["PostgreSQL - Primary DB<br/>Private Subnet 10.0.21.0/24"]
            PG["Instance: r5.2xlarge<br/>Storage: 1.5TB gp3<br/>Port: 5432<br/>Multi-AZ: Enabled"]
            PGBK["EBS Snapshots<br/>Daily Backups<br/>30-day Retention"]
        end
        
        subgraph CSSubnet["Cassandra Cluster<br/>Private Subnets"]
            CS1["Node 1: r5.xlarge<br/>1TB gp3<br/>us-east-1a"]
            CS2["Node 2: r5.xlarge<br/>1TB gp3<br/>us-east-1b"]
            CS3["Node 3: r5.xlarge<br/>1TB gp3<br/>us-east-1c"]
        end
        
        subgraph NeoSubnet["Neo4j Graph Database<br/>Private Subnet"]
            NEO["Instance: m5.xlarge<br/>Storage: 500GB gp3<br/>Ports: 7687, 7474"]
            NEOBK["Daily Snapshots<br/>Monthly Full Backup"]
        end
    end
    
    subgraph Security["Security"]
        SG["Database Security Group<br/>Inbound from EKS-SG<br/>Specific Ports Only"]
        SECRETS["AWS Secrets Manager<br/>Credentials & Passwords"]
        KMS["AWS KMS<br/>Encryption Keys"]
    end
    
    subgraph Monitoring["Monitoring & Backup"]
        CW["CloudWatch Logs<br/>Connection Audit"]
        BACKUP["AWS Backup Service<br/>Centralized Management"]
    end
    
    PG --> PGBK
    CS1 -->|Replicate| CS2
    CS2 -->|Replicate| CS3
    NEO --> NEOBK
    
    DataLayer --> Security
    DataLayer --> Monitoring
    SECRETS -->|Authenticate| PG
    SECRETS -->|Authenticate| CS1
    SECRETS -->|Authenticate| NEO
    KMS -->|Encrypt| PGBK
    KMS -->|Encrypt| NEOBK
```

---

## 4. CI/CD Pipeline Flow

```mermaid
graph LR
    Git["📝 Git Repository<br/>GitHub/GitLab<br/>Webhook Trigger"]
    
    Jenkins["Jenkins Master<br/>t3.xlarge"]
    
    Build["🔨 Build Stage<br/>Maven/npm<br/>Compile & Test"]
    
    Test["🧪 Test Stage<br/>Unit Tests<br/>SonarQube<br/>SAST"]
    
    Container["📦 Container Stage<br/>Docker Build<br/>Image Scan<br/>Tag Image"]
    
    ECR["🐳 Amazon ECR<br/>Registry<br/>Image Push"]
    
    Deploy["🚀 Deploy Stage<br/>Helm Chart<br/>kubectl Apply<br/>Rollout"]
    
    EKS["☸️ Amazon EKS<br/>Kubernetes Cluster"]
    
    Verify["✅ Verification<br/>Smoke Tests<br/>Health Check"]
    
    Notify["📢 Notification<br/>Slack/Email<br/>Success/Failure"]
    
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

---

## 5. Storage & Backup Architecture

```mermaid
graph TB
    subgraph Applications["Applications & Services"]
        FE["Frontend Service"]
        BE["Backend Services"]
    end
    
    subgraph S3Buckets["AWS S3 Buckets"]
        Logs["app-logs-prod<br/>Application Logs<br/>90-day Retention"]
        Media["app-media<br/>User Uploads<br/>Indefinite"]
        Backups["app-backups<br/>DB Snapshots<br/>1-year Retention"]
        Artifacts["app-artifacts<br/>Build Artifacts<br/>30-day Retention"]
    end
    
    subgraph Features["S3 Features"]
        Versioning["✓ Versioning"]
        Encryption["✓ Encryption<br/>AES-256+KMS"]
        Replication["✓ Cross-Region<br/>Replication"]
        Lifecycle["✓ Lifecycle Rules<br/>Glacier Archive"]
    end
    
    subgraph CDN["CloudFront CDN"]
        CF["254 Edge<br/>Locations<br/>Global"]
    end
    
    Applications -->|Send| Logs
    Applications -->|Store| Media
    Backups -->|Receive| Artifacts
    FE -->|Upload| Media
    BE -->|Store Results| Artifacts
    
    Logs --> Features
    Media --> Features
    Backups --> Features
    
    Media --> CDN
    Artifacts --> CDN
    
    Features -->|Enable| Encryption
    Features -->|Enable| Versioning
```

---

## 6. Network Security Architecture

```mermaid
graph TB
    subgraph Internet["Internet"]
        Users["👥 End Users<br/>Browsers"]
    end
    
    subgraph Security["Security Layer"]
        WAF["🛡️ AWS WAF<br/>DDoS Protection<br/>Rate Limiting<br/>Rule Enforcement"]
        Shield["Shield Standard<br/>(Included)"]
    end
    
    subgraph EdgeServices["Edge Services"]
        ALB["⚖️ Application<br/>Load Balancer<br/>Multiple AZs<br/>SSL/TLS"]
    end
    
    subgraph VPC["VPC 10.0.0.0/16"]
        subgraph PublicSubs["Public Subnets"]
            IGW["Internet Gateway"]
        end
        
        subgraph PrivateSubs["Private Subnets"]
            SG1["Security Group:<br/>ALB"]
            SG2["Security Group:<br/>EKS"]
            SG3["Security Group:<br/>Database"]
            SG4["Security Group:<br/>Jenkins"]
        end
    end
    
    subgraph NACL["Network ACLs"]
        NACL1["Public NACL<br/>Inbound: 80,443<br/>Outbound: All"]
        NACL2["Private NACL<br/>Inbound: from Pub<br/>Outbound: All"]
    end
    
    Users -->|HTTPS| WAF
    WAF -->|Inspect| Shield
    Shield -->|Allow/Deny| ALB
    ALB --> IGW
    IGW --> PublicSubs
    PublicSubs --> PrivateSubs
    
    PrivateSubs --> SG1
    PrivateSubs --> SG2
    PrivateSubs --> SG3
    PrivateSubs --> SG4
    
    PublicSubs --> NACL1
    PrivateSubs --> NACL2
```

---

## 7. Monitoring & Observability Stack

```mermaid
graph TB
    subgraph Applications["Applications"]
        App["EKS Pods<br/>EC2 Instances<br/>Databases"]
    end
    
    subgraph CloudWatch["AWS CloudWatch"]
        CWLogs["📋 Logs<br/>Pod Logs<br/>EC2 Logs<br/>Application Logs"]
        CWMetrics["📊 Metrics<br/>CPU, Memory<br/>Disk, Network<br/>Request Count"]
        CWDashboard["📈 Dashboards<br/>Custom Views<br/>Real-time Graphs"]
    end
    
    subgraph XRay["AWS X-Ray"]
        Tracing["🔍 Distributed Tracing<br/>Service Map<br/>Request Timeline<br/>Latency Analysis"]
    end
    
    subgraph Alarms["CloudWatch Alarms"]
        Critical["🔴 Critical Alarms<br/>CPU > 90%<br/>Pod Crash Loop"]
        Warning["🟡 Warning Alarms<br/>CPU > 70%<br/>Disk > 80%"]
        Info["🟢 Info Alarms<br/>Deployment Status"]
    end
    
    subgraph Notifications["Notifications"]
        SNS["AWS SNS<br/>Email, Slack<br/>PagerDuty, SMS"]
        Email["📧 Email"]
        Slack["💬 Slack"]
        PD["🚨 PagerDuty"]
    end
    
    subgraph Optional["Optional Tools"]
        Prometheus["Prometheus<br/>Metrics Collection"]
        Grafana["Grafana<br/>Dashboard UI"]
        ELK["ELK Stack<br/>Centralized Logs"]
    end
    
    App -->|Send| CloudWatch
    App -->|Trace| XRay
    
    CWMetrics -->|Evaluate| Alarms
    CWLogs -->|Aggregate| Alarms
    
    Alarms -->|Trigger| SNS
    SNS -->|Route| Email
    SNS -->|Route| Slack
    SNS -->|Route| PD
    
    CloudWatch -->|Export| Optional
    XRay -->|Export| Optional
```

---

## 8. High Availability & Auto-Scaling

```mermaid
graph TB
    subgraph HA["High Availability Configuration"]
        AZ1["🏢 Availability Zone 1<br/>us-east-1a"]
        AZ2["🏢 Availability Zone 2<br/>us-east-1b"]
        AZ3["🏢 Availability Zone 3<br/>us-east-1c"]
    end
    
    subgraph EKS["Amazon EKS Distribution"]
        Node1["Worker Node 1<br/>Min: 3, Max: 10"]
        Node2["Worker Node 2<br/>Min: 3, Max: 10"]
        Node3["Worker Node 3<br/>Min: 3, Max: 10"]
    end
    
    subgraph Scaling["Auto-Scaling Policies"]
        ClusterAS["Cluster Auto-Scaler<br/>CPU > 70% = +2 nodes<br/>CPU < 30% = -1 node"]
        PodAS["Horizontal Pod Autoscaler<br/>CPU > 80% = +1 pod<br/>Requests > 1000/min = +2"]
    end
    
    subgraph Databases["Database HA"]
        PG["PostgreSQL<br/>Multi-AZ Replica"]
        CS["Cassandra 3-Node<br/>Replication Factor: 3"]
        NEO["Neo4j Causal Cluster<br/>Optional: 3+ nodes"]
    end
    
    subgraph HA_Features["HA Features"]
        LB["Load Balancing<br/>Across AZs"]
        HC["Health Checks<br/>30s interval"]
        RR["Readiness Probes<br/>10s interval"]
    end
    
    AZ1 --> Node1
    AZ2 --> Node2
    AZ3 --> Node3
    
    Node1 --> Scaling
    Node2 --> Scaling
    Node3 --> Scaling
    
    AZ1 --> PG
    AZ2 --> CS
    AZ3 --> NEO
    
    Scaling --> HA_Features
```

---

## 9. Security Layers

```mermaid
graph TB
    subgraph Layer1["Layer 1: Network Security"]
        WAF["AWS WAF<br/>Rule Evaluation"]
        Shield["AWS Shield<br/>DDoS Protection"]
        SG["Security Groups<br/>Stateful FW"]
        NACL["Network ACLs<br/>Stateless FW"]
    end
    
    subgraph Layer2["Layer 2: Identity & Access"]
        IAM["IAM Roles & Policies<br/>Least Privilege"]
        RBAC["Kubernetes RBAC<br/>Pod Security Policies"]
        SECRETS["Secrets Manager<br/>Credential Storage"]
    end
    
    subgraph Layer3["Layer 3: Data Security"]
        TLS["TLS 1.2+<br/>In-Transit Encryption"]
        KMS["AWS KMS<br/>At-Rest Encryption"]
        DB_Auth["Database Auth<br/>Strong Passwords"]
    end
    
    subgraph Layer4["Layer 4: Application Security"]
        SAST["SonarQube<br/>Code Analysis"]
        Scan["Container Image Scan<br/>Vulnerability Detection"]
        WAF_Rules["WAF Rules<br/>App Protection"]
    end
    
    subgraph Layer5["Layer 5: Compliance & Audit"]
        CloudTrail["CloudTrail<br/>API Logging"]
        Logs["CloudWatch Logs<br/>Audit Trails"]
        Inspector["AWS Inspector<br/>Compliance Check"]
    end
    
    style Layer1 fill:#ff9999
    style Layer2 fill:#ffcc99
    style Layer3 fill:#ffff99
    style Layer4 fill:#99ff99
    style Layer5 fill:#99ccff
```

---

## 10. Disaster Recovery Architecture

```mermaid
graph TB
    subgraph Primary["Primary Region: us-east-1"]
        PrimApp["EKS Cluster<br/>Frontend + Backends"]
        PrimDB["Databases<br/>PG, Cassandra, Neo4j"]
        PrimS3["S3 Primary Bucket<br/>app-prod-primary"]
    end
    
    subgraph Backup["Backup Strategy"]
        Snapshots["Daily EBS Snapshots<br/>30-day Retention"]
        S3_Repl["S3 Replication<br/>to us-west-2<br/>1-hour RTO"]
        BackupVault["AWS Backup Vault<br/>Centralized Management"]
    end
    
    subgraph Secondary["Secondary Region: us-west-2<br/>Warm Standby"]
        SecApp["Standby EKS Cluster<br/>Scaled Down"]
        SecDB["Replica Databases<br/>Read-Only"]
        SecS3["S3 Backup Bucket<br/>app-prod-backup"]
    end
    
    subgraph Recovery["Recovery Procedures"]
        Failover["Failover Scripts<br/>Automated"]
        DNSUpdate["Route53 DNS Update<br/>5-min RTO"]
        RTO["RTO: 1-2 hours<br/>RPO: 1 hour"]
    end
    
    PrimApp -->|Snapshot| Snapshots
    PrimDB -->|Snapshot| Snapshots
    PrimS3 -->|Replicate| S3_Repl
    
    Snapshots -->|Store| BackupVault
    S3_Repl -->|Replicate to| SecS3
    
    BackupVault -->|Restore to| SecApp
    BackupVault -->|Restore to| SecDB
    
    SecApp -->|Ready| Recovery
    SecDB -->|Ready| Recovery
    
    Recovery -->|Execute| Failover
    Failover -->|Update| DNSUpdate
```

---

## Component Specifications Summary

| Component | Type | Quantity | Size/Spec | Cost/Month |
|---|---|---|---|---|
| **Compute** | | | | |
| EKS Nodes | t3.large | 3-10 | 2vCPU, 8GB RAM | ~$500-1500 |
| Jenkins Master | t3.xlarge | 1 | 4vCPU, 16GB RAM | ~$250 |
| **Databases** | | | | |
| PostgreSQL | r5.2xlarge | 1 | 8vCPU, 64GB RAM | ~$3000 |
| Cassandra | r5.xlarge | 3 | 4vCPU, 32GB RAM each | ~$6000 |
| Neo4j | m5.xlarge | 1 | 4vCPU, 16GB RAM | ~$800 |
| **Storage** | | | | |
| EBS Volumes | gp3 | 5+ | 500GB-1.5TB | ~$200-400 |
| S3 Storage | Standard | 4 buckets | 10TB total | ~$250 |
| S3 Data Transfer | | | | ~$500-1000 |
| **Network** | | | | |
| ALB | Network LB | 1 | Multi-AZ | ~$200 |
| NAT Gateway | NAT | 3 | Per AZ | ~$150 |
| CloudFront | CDN | 1 | 254 locations | ~$100-500 |
| **Monitoring** | | | | |
| CloudWatch | Logs/Metrics | | | ~$100-300 |
| **Total Estimated** | | | | **$12,000-15,000/month** |

---

## Getting Started Checklist

- [ ] AWS Account with appropriate IAM permissions
- [ ] VPC and networking infrastructure
- [ ] EKS cluster with 3+ worker nodes
- [ ] EC2 instances for databases
- [ ] S3 buckets configured
- [ ] Jenkins installation and configuration
- [ ] ECR repositories created
- [ ] CI/CD pipelines configured
- [ ] Monitoring and alarms set up
- [ ] Backup procedures documented
- [ ] Disaster recovery plan tested
- [ ] Security hardening completed
- [ ] Load testing executed
- [ ] Go-live approval
