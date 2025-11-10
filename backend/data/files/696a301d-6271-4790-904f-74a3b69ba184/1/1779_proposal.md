
# ELEC 1779 - Project Proposal <!-- omit from toc -->

### Group Members: <!-- omit from toc -->
Vid Grujic - 1007004885
Stefan Masic - 1006265220
Wenhan Liang - 1011411492
Zifeng Liang - 1006731752

## Table of Contents <!-- omit from toc -->
- [Motivation](#motivation)
- [Project Objective](#project-objective)
- [Key Features](#key-features)
  - [System Design Overview](#system-design-overview)
  - [Backend Logic](#backend-logic)
  - [Database and Storage](#database-and-storage)
  - [Deployment and DevOps](#deployment-and-devops)
  - [Frontend and User Interface](#frontend-and-user-interface)
- [How the Features Fulfill the Project Requirements](#how-the-features-fulfill-the-project-requirements)
- [Scope and Feasibility](#scope-and-feasibility)
- [Tentative Plan](#tentative-plan)

## Motivation
Cloud-based content collaboration platforms have grown to be extremely prevalent over the last two decades, and their usage in business settings, education, and teamwork in general continues to grow steadily. Popular platforms such as Google Drive, Dropbox, and OneDrive offer a range of convenient tools for file sharing and collaboration, however free tiers only offer limited storage (ranging between 2 and 15 gigabytes), and the offered paid subscriptions only make sense fiscally for individual users and enterprises. For smaller project teams with limited financial resources, holding multiple subscriptions is infeasible, and many projects could exceed the storage capacities provided by the aforementioned free tiers. The platforms being used are also closed-source, preventing teams from customizing workflows (or any other aspect of the product) to better fit their project needs.

Our project can fulfill such requirements by providing teams with a customizable, open-source platform where teams can go in and edit configuration to fit their team needs. Expenses are dependent on the IaaS provider (in this case, DigitalOcean for storage volumes) rather than the content collaboration platform itself. The product being self-hosted also ensures the user can define the control of access of files with increased confidence. This solution primarily benefits small academic, research and entrepreneurial teams who need these collaboration services with less overhead. Pursuing this project will not only benefit future users, but also our team as developers, by giving us experience integrating services such as PostgreSQL, DigitalOcean and Docker, creating a CI/CD pipeline using Github Actions, along with other technologies widely used in software and DevOps teams today.

## Project Objective
The goal of our project is to build a simple and practical content sharing and collaboration platform that runs in a cloud-based environment. In this platform, users can upload their own files, track different versions, and collaborate through real-time comments. The platform also includes role-based access control, allowing file owners to manage content viewing and editing permissions like Google Drive.

All state data will be persisted using PostgreSQL and DigitalOcean volumes to ensure that uploaded files and metadata are not lost after deployment changes or container restarts. Deployments will be orchestrated and replicated using Docker Swarm on DigitalOcean. This solution not only provides core functionality but also demonstrates how real-world cloud applications maintain state, scale across nodes, and ensure continuous availability after service restarts.

## Key Features

### System Design Overview
Our system architecture is divided into four interconnected components, including backend logic, database and storage, deployment and DevOps, and the frontend. These layers interact seamlessly to support core features such as file upload and management, real-time collaboration, and version control, while maintaining strong security and operational reliability across development and deployment environments.

### Backend Logic
At the heart of the platform lies the backend logic, responsible for managing authentication, file versioning, collaboration features, and communication security. To ensure controlled access, we employ a JWT (JSON Web Token) mechanism for user authentication, with operational permissions defined by user roles: Owner, Collaborator, and Viewer. Middleware in the backend validates each request, ensuring that only authorized users can perform restricted actions. When users upload files, the backend automatically generates new version numbers and records all associated metadata, including timestamps, uploader details, and file size, in PostgreSQL. This supports a robust version control system that allows users to view previous file iterations or roll back changes when needed.

To foster collaboration, we implement real-time commenting and tagging, supported by an associative table structure that links each comment or tag to its corresponding file. Users can post comments, reply to others, and add descriptive tags, all of which update dynamically in the database. Complementing this functionality is an advanced collaboration notification feature, which automatically alerts relevant users when files are modified, commented on, or tagged. Each interaction generates an event log entry, and real-time notifications are delivered through WebSockets to maintain awareness across all contributors. To protect data in transit, we configure Nginx to serve content over HTTPS and encrypt frontend-backend communication with SSL certificates, ensuring secure and authenticated exchanges through JWT tokens. Collectively, these elements establish a backend that balances flexibility, performance, and strong access control.

### Database and Storage
The database and storage component manages the system's information architecture, ensuring data consistency, persistence, and efficient retrieval. We use PostgreSQL as the primary database for storing metadata, user details, and collaborative records, while DigitalOcean Volumes are employed for persistent file storage to preserve uploaded content across container restarts and updates. Together, these technologies ensure data durability and seamless integration with the backend services.
To enhance usability, we leverage PostgreSQL's full-text search for fast and efficient content discovery and plan to incorporate Redis caching to further improve query performance under heavy load. A tag-based search feature is also implemented, linking tags with file metadata to allow users to filter and locate files using one or more tags through indexed queries. Additionally, the database layer supports a data export feature, enabling users to download file metadata as JSON or CSV for external analysis or backup. These tools together provide a powerful and adaptable data management infrastructure capable of supporting both real-time collaboration and long-term scalability.

### Deployment and DevOps
The deployment and DevOps layer ensures reliability, scalability, and streamlined operations across development and production environments. All components are containerized using Docker, enabling consistent setup and easy replication across machines. Docker Compose is used to manage the local development environment, allowing the entire system to be launched and tested with minimal configuration.

For production deployment, we utilize Docker Swarm on DigitalOcean, which provides distributed service orchestration, automatic load balancing, and health checks to maintain system stability. Swarm manages container scheduling and replica distribution, ensuring that workloads are efficiently balanced and resilient to node failures. To automate the build and deployment process, we integrate a CI/CD pipeline (Advanced Feature) using GitHub Actions, which triggers automated testing, image creation, and deployment following each code commit.

Further resilience is achieved through auto-scaling and high-availability (Advanced Features), leveraging Swarm's self-healing mechanisms to automatically restart or relocate containers if failures occur. We plan to test these capabilities by simulating node outages to verify the cluster's ability to recover without manual intervention. System performance will be tracked using DigitalOcean's built-in monitoring and alerting tools, which record key metrics such as CPU, memory usage, and API response times. If additional insights are needed, we will integrate Grafana or DigitalOcean App Logs to visualize performance trends and identify bottlenecks. This DevOps approach ensures continuous delivery, consistent performance, and fault tolerance across all stages of system operation.

### Frontend and User Interface
The frontend interface provides a responsive, intuitive, and user-friendly environment for interacting with the system. It will be developed as a Single Page Application (SPA) using React, which communicates with the backend via Axios through RESTful API endpoints. Depending on team preferences and project progress, Vue.js may be adopted as an alternative. The frontend enables users to upload, download, and manage files, as well as view version histories and uploader details. Real-time updates ensure that actions such as file uploads, rollbacks, or metadata changes are reflected immediately, maintaining consistency across sessions.

Beyond core file management, the frontend supports collaborative commenting and editing, where users can post feedback, reply to others, or annotate shared files. Notifications for new comments or edits are delivered in real time through WebSocket connections, allowing all collaborators to stay synchronized without manual page refreshes. A search interface will further enhance usability by allowing keyword- and tag-based lookups for quick file retrieval. Together, these features create an interactive and cohesive interface that complements the system's backend and infrastructure layers, ensuring a consistent user experience and efficient workflow.

Overall, this system design integrates robust backend logic, reliable data management, scalable DevOps practices, and an intuitive frontend into a unified platform for secure and efficient collaboration. Each layer contributes to the project's overarching goals of performance, usability, and maintainability. The design remains modular enough for independent development by team members while ensuring seamless integration between components a balance.

## How the Features Fulfill the Project Requirements
Our project will fully meet the mandatory technical requirements of the course:

| Course Requirement | How This Project Implements It |
|-----------|-----------|
| Docker + Local Development | All core services including backend, PostgreSQL, monitoring, run in Docker containers. Docker Compose is used locally to spin up the entire environment consistently across machines. |
| Cloud Deployment | The platform is deployed on DigitalOcean using Droplets and attached persistent storage. Deployment configuration mirrors real-world production hosting. |
| Data Persistence | PostgreSQL stores user accounts, metadata, comments, tags, and version history. |
| Orchestration | Docker Swarm handles service replication, failover, and load balancing. If a container crashes, the remaining containers will continue to handle traffic. |
| Authentication & Role Control | JWT-based authentication ensures that only authorized users can access protected content. Role-based permissions (owners/collaborators/viewers) limit the scope of users who can modify or view shared files. |
| Real-Time Collaboration | WebSockets enables real-time commenting and update notifications, allowing users to see collaborative changes without refreshing the page. |
| CI/CD | A GitHub Actions pipeline will be added to automate builds and redeployments, reducing manual maintenance and streamlining the iteration process. |

## Scope and Feasibility
This project will be achievable within the course timeframe because core functionality (authentication, file uploads, version control, and persistent storage) is implemented ahead of time, allowing collaboration features to be built naturally. The use of Docker Swarm and DigitalOcean volume management technologies simplify infrastructure deployment and avoid redundant overhead, freeing up time to focus on application logic development. Team members are able to clearly divide responsibilities, enabling parallel development without blocking each other. The overall design meets the course's challenging requirements while ensuring completion within the final deadline.

## Tentative Plan
Our team will create a Content Sharing and Collaboration Platform that lets users securely upload files, manage versions, and collaborate through comments and tags. The goal is to provide a smooth user experience for content management and teamwork while demonstrating strong cloud-native design and deployment skills.
Each team member has a defined role to ensure the project progresses efficiently:

- **Leon** will lead backend development, designing the REST API in Node.js and Express to handle user authentication, file uploads, and permission logic. He will also implement the GitHub Actions CI/CD pipeline, automating code testing, image builds, and deployment to DigitalOcean.

- **Beck** will take charge of database and persistence management, setting up PostgreSQL schemas for users, files, and version tracking. He will integrate DigitalOcean Volumes for data durability and script daily automated backups for recovery.

- **Vid** will focus on DevOps and infrastructure, containerizing all services with Docker, writing the Docker Compose configuration for local development, and orchestrating containers with Docker Swarm. He will also configure load balancing, handle secret management, and connect monitoring tools to track CPU, memory, and disk usage through the DigitalOcean dashboard.

- **Stefan** will build the frontend interface, creating an intuitive dashboard for uploading, viewing, and commenting on files. He will also integrate real-time updates using WebSockets, enabling users to see new comments or file changes and ensure all communication is secured via HTTPS.

The system will progress from local multi-container testing to deployment on a Swarm cluster with replicated services. Monitoring dashboards will give visibility into performance and storage usage throughout the development cycle.

By combining backend automation, reliable data management, efficient orchestration, and a responsive frontend, the project will demonstrate all core concepts of a cloud-native system. With responsibilities clearly divided and well-defined deliverables, our plan is both realistic and achievable within the project deadline.