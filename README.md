# OpenCollab - ECE1779 Final Project - Group 16

OpenCollab is a self-hosted, open-source content collaboration platform inspired by tools like Google Drive and Dropbox. It is designed for small academic, research, and entrepreneurial teams that need reliable file sharing, version history, and lightweight collaboration without per-user subscription costs.

---

## Team Information

| Name | Student Number | Preferred Email |
|---|---:|---|
| Vid Grujic | 1007004885 | **vid.grujic@mail.utoronto.ca** |
| Stefan Masic | 1006265220 | **stefan.masic@mail.utoronto.ca** |
| Wenhan Liang | 1011411492 | **wenhan.liang@mail.utoronto.ca** |
| Zifeng Liang | 1006731752 | **zifeng.liang@mail.utoronto.ca** |


---

## Motivation

Cloud-based content collaboration platforms have grown to be extremely prevalent over the last two decades, and their usage in business settings, education, and teamwork in general continues to grow steadily. Popular platforms such as Google Drive, Dropbox, and OneDrive offer a range of convenient tools for file sharing and collaboration, however free tiers only offer limited storage (ranging between 2 and 15 gigabytes), and the offered paid subscriptions only make sense fiscally for individual users and enterprises. For smaller project teams with limited financial resources, holding multiple subscriptions is infeasible, and many projects could exceed the storage capacities provided by the aforementioned free tiers. The platforms being used are also closed-source, preventing teams from customizing workflows (or any other aspect of the product) to better fit their project needs.

Our project can fulfill such requirements by providing teams with a customizable, open-source platform where teams can go in and edit configuration to fit their team needs. Expenses are dependent on the IaaS provider (in this case, DigitalOcean for storage volumes) rather than the content collaboration platform itself. The product being self-hosted also ensures the user can define the control of access of files with increased confidence. This solution primarily benefits small academic, research and entrepreneurial teams who need these collaboration services with less overhead. Pursuing this project will not only benefit future users, but also our team as developers, by giving us experience integrating services such as PostgreSQL, DigitalOcean and Docker, creating a CI/CD pipeline using Github Actions, along with other technologies widely used in software and DevOps teams today.

---

## Objectives

## Objectives

The goal of **OpenCollab** is to provide a complete, secure, and extensible platform for collaborative file management that demonstrates strong software engineering and cloud deployment principles.

1. **Secure User Access**  
   Implement user authentication and authorization to ensure only verified users can access system features. Login and registration are to be made seamless using JWT-based authentication. Role-based access control invokes permission boundaries between owners, collaborators, and viewers. This design not only prevents unauthorized access but also models access control expected in industry-level collaboration applications.

2. **Core File Management**  
   Deliver reliable and intuitive file management workflows that allow users to upload, browse, download, and delete files efficiently. The system provides responsive feedback and handles file operations in a way that maintains a smooth user experience even under concurrent usage. Each file action interacts directly with persistent storage and metadata tracking system, ensuring durability and data integrity is maintained.

3. **Comprehensive Version History**  
   Each uploaded file maintains a full **version history**, enabling users to:
   - **View** all previous versions of a file with metadata such as timestamp and file size.
   - **Upload** new versions to track document evolution over time.
   - **Roll back** safely to earlier snapshots without losing historical context.  
   This guarantees auditability and traceability, so teams can confidently iterate and restore historical versions when needed. Every rollback creates a new version entry rather than overwriting history, reinforcing system transparency.

4. **Lightweight Collaboration Features**  
   Support small-to-medium teams with minimal administrative complexity through:
   - **File-level sharing** - enabling users to invite others to collaborate on specific files.  
   - **Role-based permissions** - ensuring ownership, editing, and viewing rights are well-defined and enforced by the backend.  
   - **Version-scoped commenting** - allowing users to attach threaded comments to specific file versions, making feedback contextually relevant.  
   The design emphasizes real-time collaboration without heavy dependencies, using SSE for live updates to comments and activities.

5. **Dependable Cloud-Native Deployment**  
   Build the system around scalable, containerized components orchestrated by Docker Swarm. This structure supports modular development and ensures reproducibility of the product across environments. By isolating services (frontend, backend, and database), each can be scaled independently. The use of overlay networking allows communication and service discovery between manager and worker.

6. **Persistent Storage Decoupled from Compute**  
   Files and metadata are stored on persistent cloud volumes (e.g., DigitalOcean Block Storage), ensuring data durability across container restarts, redeployments, and even node migrations. This decoupling of stateful and stateless components was a key reliability goal in preventing data loss and enabling fault-tolerant deployments.

7. **Automated Delivery Pipeline (CI/CD)**  
   Implement a full GitHub Actions-based CI/CD workflow to minimize manual deployment. On every push to the main branch, the system automatically:
   - Builds and pushes container images for the backend and frontend.
   - Connects securely to the Swarm manager via SSH.
   - Pulls the latest images and redeploys the stack.  
   This ensures rapid iteration, consistent environments, and reduces downtime during updates. It also reinforces modern DevOps best practices by automating builds, testing, and deployment steps end-to-end.

8. **Extensible and Open-Source Foundation**  
   Design OpenCollab as an adaptable, community-driven platform. The codebase is modular and documented to allow future contributors to extend its features without fuss such as integrating advanced search, metadata indexing, or richer collaboration tools. The goal is to provide a foundation that other developers can build upon, demonstrating sustainable software design principles.

9. **Educational and Professional Value**  
   Beyond functionality, OpenCollab’s objectives include demonstrating the practical integration of backend APIs, frontend interfaces, cloud storage, orchestration, and CI/CD automation. This provides hands-on experience with industry-relevant technologies like Docker, PostgreSQL, DigitalOcean, and GitHub Actions - skills essential for careers in software engineering, DevOps, and cloud-native development.


---

## Technical Stack

### Orchestration & Infrastructure
- **Docker Swarm** for multi-service deployment and overlay networking.
- **DigitalOcean Droplets** for compute.
- **DigitalOcean Block Storage Volume** for persistent file data.
  - Mounted on production nodes at a shared path (e.g., `/mnt/volume_files`) and docker mounted onto backend container.

### Backend
- **Node.js + Express** with **TypeScript**.
- **PostgreSQL** for persistent metadata:
  - users,
  - files,
  - versions,
  - permissions,
  - comments.
- **JWT authentication**.
- **File upload middleware**.
- **Server-Sent Events (SSE)** for live refreshing of comments.

### Frontend
- **React + TypeScript + Vite**.
- API integration done via **Axios**.
- Document viewing:
  - PDF viewer integration.
  - DOCX preview support (e.g., `docx-preview`).
  - Text rendering/editing for simple formats.

### Reverse Proxy
- **Nginx** (frontend container):
  - serves the SPA,
  - proxies `/api` to the backend,
  - configured to support SSE w/o buffering.

### CI/CD
- **GitHub Actions**:
  - builds backend and frontend images,
  - pushes them to registry,
  - deploys the Swarm stack via SSH to the manager droplet.

---

## Architecture Overview

OpenCollab uses a **three-service architecture with cloud-backed persistence** to deliver a practical, scalable, and maintainable collaboration platform. The system is intentionally split into clear responsibility boundaries such that all components can be scaled and deployed independently.

### Core Services

- **Frontend**  
  A React single-page application (SPA) served by **Nginx**.  
  Responsibilities:
  - Provides the user interface for authentication, dashboard browsing, uploads, viewing, version navigation, comments, and sharing.
  - Serves static assets efficiently.
  - Proxies API traffic to the backend through a unified `/api` path.

- **Backend**  
  A **Node.js / Express API** written in **TypeScript**.  
  Responsibilities:
  - Enforces authentication and authorization.
  - Orchestrates file operations and versioning logic.
  - Manages comments, tags, search, and permission workflows.
  - Generates consistent metadata and audit-friendly history for user actions.

- **Database**  
  **PostgreSQL** is used for durable, structured metadata storage.  
  Responsibilities:
  - Stores users and hashed credentials.
  - Tracks files, ownership, tags, and sharing permissions.
  - Maintains version records and relationships.
  - Stores structured comment threads tied to specific file versions.

- **Persistent Files**  
  File binaries and version artifacts are stored on a mounted cloud volume.  
  Responsibilities:
  - Holds real file contents outside of container layers.
  - Ensures durability across redeployments and container restarts.
  - Supports scalable growth independent of application code.

---

### High-Level Data Flow

1. **Client → Frontend**  
   The browser loads the React SPA from the frontend service. Nginx serves the compiled frontend build and handles static content efficiently.

2. **Frontend → Backend (via Nginx proxy)**  
   The SPA sends API requests to `/api/*`.  
   Nginx forwards these requests to the backend service over the internal Swarm network.  
   This design:
   - Simplifies frontend configuration (single origin).
   - Avoids CORS complexity in production.
   - Centralizes routing and reduces exposure of internal service addresses.

3. **Backend Authentication & Authorization**  
   The backend validates user identity using **JWT middleware**:
   - Validates token authenticity and expiry.
   - Extracts user identity for all protected operations.
   - Applies **role-based checks** at the file level (Owner / Collaborator / Viewer).

4. **Metadata & Collaboration State → PostgreSQL**  
   The backend reads/writes structured state to PostgreSQL:
   - File entries link to ownership and permissions.
   - Version tables provide ordered history per file.
   - Comments are tied to `(fileId, version)` so feedback remains context-specific.
   - Tags support lightweight organization and filtering.

5. **File Content & Versions → Persistent Volume**  
   The backend stores the uploaded binary content to a mounted host path  
   (e.g., `/mnt/volume_files`).  
   A typical structure is:
   - One directory per file ID.
   - One subdirectory per version number.
   - Original filenames preserved for clarity and traceability.

---

### Deployment Topology (Swarm)

In Docker Swarm, the services communicate using an **overlay network**, enabling:
- Service discovery by name (e.g., `backend`, `db`).
- Consistent networking across multiple nodes.
- Portable stack deployment.

A simplified view:

- **Frontend container**  
  - Exposes HTTP to the public.
  - Routes `/api` to the backend through the overlay network.

- **Backend container**  
  - Connects to Postgres through the overlay network.
  - Mounts the persistent volume path for reading/writing file data.

- **Postgres container**  
  - Uses its own persistent volume for database durability.

---

### Why This Architecture Works Well

This structure provides a realistic production-aligned model:

- **Separation of concerns**  
  UI, business logic, and data persistence are cleanly isolated, improving maintainability and reducing coupling.

- **Independent scaling**  
  The frontend and backend can scale horizontally (as needed) without affecting database integrity or file durability.

- **Durability and reliability**  
  State is split into two persistent layers:
  - PostgreSQL for metadata and comments.
  - Mounted cloud storage for the file binaries and version content.

- **Safer iteration and upgrades**  
  Because **data is not stored inside containers**:
  - The compute layer can be redeployed without risking file loss.
  - CI/CD-driven updates are safer and more repeatable.

---

### Security and Access Model (Architectural View)

OpenCollab’s architecture supports secure collaboration by enforcing:

- **Identity-based access**  
  Only authenticated users can access protected operations.

- **Per-file permissions**  
  Authorization checks are enforced in the backend before:
  - downloading
  - uploading new versions
  - editing text-based files
  - deleting files
  - or sharing with others

- **Versioning**  
  Rollbacks do not erase history. Instead, they create a new "latest version" derived from an older snapshot.

---

### Collaboration Layer (Comments)

Comments are designed to be tightly contextual:

- Stored in PostgreSQL as structured entities tied to specific versions.
- Delivered to clients with near-real-time behavior using:
  - **Server-Sent Events (SSE)** for live refresh.
- This avoids the complexity of WebSocket infrastructure while still meeting real-time collaboration expectations to account for the scope of the course.

---

### Summary

OpenCollab’s architecture demonstrates a practical cloud-native design:
- A React/Nginx frontend for efficient UI delivery and API routing.
- A TypeScript/Express backend for secure business logic and collaboration workflows.
- PostgreSQL for durable metadata and permissions.
- Cloud-backed persistent storage for file binaries and version artifacts.

## Features

### Authentication & Role-Based Access Control
- **User registration and login** with secure credential handling.
- **JWT-protected API routes** to ensure all sensitive actions require verified identity.
- **Role-based permissions** applied at the file level:
  - **Owner**: full control over the file lifecycle, including delete and share.
  - **Collaborator**: can view, download, comment, and contribute updates/versions where permitted.
  - **Viewer**: read-only access for viewing and downloading shared content.
  
### File Upload & Management
- Upload files through the dashboard with clear UI feedback.
- Browse files you **own** and files **shared** with you.
- Download files based on permission level.
- Delete operations restricted to Owners to protect shared team resources.
- Designed to closely resemble familiar cloud-drive workflows while remaining lightweight and transparent.

### Version History & Recovery of Changes
- Every uploaded file maintains structured **version history**:
  - Initial upload creates **version 1**.
  - Subsequent updates create **version 2, 3, ...**.
- Users can inspect previous versions to understand the evolution of shared documents.
- **Rollback** is supported in an audit-friendly way:
  - Selecting an older version creates a **new latest version** derived from that snapshot rather than overwriting history.
- Preserves traceability and enables safe iteration during collaborative editing and review.

### Collaborative Commenting & Tagging
- Users can attach **threaded, version-scoped comments** to keep feedback tied to a specific document state.
- This improves review clarity and prevents confusion when files change over time.
- **Tagging** supports lightweight organization:
  - Add or update a tag/label on content.
  - Use tags to group related assets (e.g., “proposal”, “dataset”, “draft”, “final”).

### Search by Tags or Metadata
- The dashboard supports filtering and search by:
  - **File name**
  - **Tag**
  - **Basic metadata** surfaced in the UI
- This enables quick retrieval and supports real-world usage patterns for teams managing multiple assets over a project lifecycle.

### Metadata Persistence with Cloud-Backed Storage
- **PostgreSQL** stores durable structured data:
  - users and authentication state,
  - file metadata,
  - version records,
  - permissions and sharing relationships,
  - comments and tags.
- File binaries and version artifacts are stored on **DigitalOcean Volumes** mounted into the backend container.
- This separation ensures:
  - compute can be redeployed without data loss,
  - storage scales independently from application services,
  - the platform remains consistent under routine operational changes.

### Local Development with Docker Compose
- The backend is fully **dockerized** and supports local testing via **Docker Compose**.
- A typical local setup includes:
  - a Postgres service,
  - the Node.js backend,
  - and a local file storage path.
- This provides a reproducible environment for development, debugging, and feature validation before deploying to Swarm.

### Production Deployment with Docker Swarm
- OpenCollab is deployed on **DigitalOcean** using **Docker Swarm**.
- Swarm provides:
  - service orchestration
  - overlay networking
  - load distribution across nodes where applicable
- The architecture demonstrates production-style deployment patterns aligned with cloud-native best practices.

### Monitoring and Operational Visibility
- Basic monitoring is visisible through Digital Ocean's Addtional Insight Graphs on the manager and worker nodes.
- Additional monitoring in the form of email alerts was implemented for when the manager exceeds 70% cpu usage.

### CI/CD Automation with GitHub Actions
- A GitHub Actions pipeline automates:
  - building backend and frontend images,
  - pushing images to a registry,
  - deploying updates to the Swarm manager.
  
### Exportable Content Metadata
- OpenCollab is structured to support administrative/export workflows, including:
  - exporting file metadata in **JSON** or **CSV** formats for reporting, auditing, or offline analysis.

### Backup and Recovery Foundations
- The deployment approach supports safe recovery practices:
  - **database backup workflows** (e.g., scheduled dumps to cloud storage),
  - preservation of file binaries on persistent volumes.

### Course Requirements Alignment
OpenCollab demonstrates:
- A containerized full-stack architecture with clear service boundaries.
- Persistent cloud storage integrated with a relational metadata model.
- Security enhancements via JWT for authentication
- Local reproducibility through Docker Compose.
- Production orchestration via Docker Swarm.
- Automated delivery through CI/CD.
- A collaboration-focused feature set including role-based access control, versioning, tagging, and search.


## User Guide

### Access the Application
- **Live URL:** **http://68.183.200.95/dashboard** 
(If not working try:)
- **Backup URL:** **http://146.190.189.62/dashboard**  

### Register / Login
1. Open the live URL.
2. Click **Register** and create an account.
3. Log in with your credentials.

### Upload Files
1. Navigate to the dashboard.
2. Use the **Upload** button or drag-and-drop files into the upload area.
3. Wait for the success notification.
4. Your file appears in the dashboard with version 1.

### Browse, Search, and Sort
1. Use the search bar to filter by **name** or **tag**.
2. Use sorting controls to order by date, name, or size.
3. Switch between list/grid view if available.

### View Files
1. Click a file card/row.
2. The viewer adapts by type:
   - PDFs render inline.
   - DOCX files preview in-browser.
   - Text-based files display in an editor view.


### Edit Text-Based Files (If Enabled)
1. Open a supported text file (e.g., `.txt`, `.md`).
2. Toggle **Edit**.
3. Save changes.
4. A new version is created.

### Version History & Rollback
1. Open the file viewer.
2. Open the **Versions** panel or dropdown.
3. Select older versions to review.
4. Click **Rollback** to create a new latest version based on the chosen snapshot.

### Comments
1. In the viewer, open the comments panel.
2. Add a comment to the current version.
3. If multiple users are viewing a refresh might be necessary to view

### Share a File (Owner)
1. Open the file viewer.
2. Click **Share**.
3. Enter another user’s registered email.
4. Assign a role (Viewer or Collaborator).
5. Confirm to update permissions.

---

## Development Guide

### Prerequisites
- Node.js 20+
- npm
- Docker + Docker Compose
- PostgreSQL (local or containerized)

---

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd <your-repo>
```

---

### 2. Database Setup

Option A - Local Postgres via Docker:

```bash
cd database
docker compose up -d
```

Use credentials matching your compose configuration.

Option B - Your own Postgres:
- Create a database and user.
- Ensure your backend environment variables match.

---

### 3. Backend Setup (Local)

From the project root (or backend directory if your scripts are scoped there):

```bash
npm install
npm run dev
```

Create a `.env` (example):

```env
DB_HOST=localhost
DB_PORT= <<Your db port>>
DB_USER=<<Your db admin>>
DB_PASS=<<Your db pass>>
DB_NAME=<<Your db name>>

NODE_ENV=development
PORT=8080

JWT_SECRET=change-me
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173

# For local testing you may point these to a local folder
FILE_ROOT=./backend/data/files
UPLOAD_DIR=./backend/data/files
```

---

### 4. Frontend Setup (Local)

```bash
cd frontend
npm install
npm run dev
```

Frontend `.env` example:

```env
VITE_API_URL=http://localhost:8080
```

Open:

```text
http://localhost:5173
```

---

### 5. Local End-to-End Test Checklist

After starting DB, backend, and frontend:

- Register two users.
- Upload a file.
- Add a tag.
- Search by name and tag.
- Upload a second version.
- Roll back to an older version.
- Add comments from two browser windows to confirm live updates.
- Share the file with the second user and verify role behavior.

---

## Deployment Information

### Deployment Approach
- **Docker Swarm** with an overlay network.
- Services:
  - `frontend`
  - `backend`
  - `db`
- Persistent files stored on a mounted volume path and bind-mounted into the backend container.

### Storage
- Production file root configured to a mounted host path such as:

```text
/mnt/volume_files
```

### CI/CD
- GitHub Actions builds and pushes images.
- A deploy job SSHes into the Swarm manager and runs:

```bash
docker pull <backend-image>
docker pull <frontend-image>
docker stack deploy --with-registry-auth -c project-stack.yml <stack-name>
```

## Individual Contributions

### Wenhan Liang

- Designed the PostgreSQL schema and implemented all backend APIs for the system
- Responsible for backend API development of the search, tag, versioning, parts of the file, and comment modules, file sharing, and edit/save features
- Configured volume mounting for persistent cloud data storage and set up automated database backups
- Maintained database tables and the PostgreSQL instance, performing query optimization to improve performance and reliability

### Zifeng Liang

- Implemented the core backend system, including authentication, file management, version control, tags, search, and real-time comments in their initial functional form.
- Developed key APIs for uploading, downloading, editing, and saving files and versions.
- Set up initial frontend structure and completed a part of backend–frontend integration and testing.

### Vid Grujic
- Brought the project to the cloud by configuring Digital Ocean Droplets (and added additional insights plugins and email warning system for monitoring purposes), configured Docker swarm for orchestration with Stefan
- Congifured Docker Hub for image builds and deployment and the GitHub Action CI/CD Pipeline
- Fixed file data docker mounts, configured ntfs server for near-instant replication between droplets.
- Repaired UI text visibility issues, worked with Stefan to fix version rollback and file sharing issues

### Stefan Masic
- Completed a full front-end overhaul and delivered the finalized, production-ready user interface with improved usability and visual consistency.
- Worked with Vid to configure Docker Swarm orchestration, implement version rollback functionality, and resolve file-sharing issues across users.
- Implemented real-time live commenting using Server-Sent Events (SSE), allowing comments to appear instantly without requiring a page refresh during edit mode.
- Deployed database backup scripts for reliable data protection and recovery

## Lessons Learned and Concluding Remarks

Building OpenCollab gave us a realistic end-to-end view of what it takes to develop and deploy a cloud-native collaboration system that feels cohesive from both a user and infrastructure perspective. One of our biggest lessons was how tightly **application features, storage strategy, and orchestration** are connected. Implementing upload, metadata tracking, and versioning in isolation was straightforward, but ensuring that those behaviors remained reliable under a Docker Swarm deployment required careful attention to where state lives and how it is mounted and referenced across nodes. This reinforced the importance of designing persistence early rather than treating it as a final deployment detail.

We also gained a stronger appreciation for clean service boundaries. Keeping the frontend, backend, database, and file storage responsibilities clearly separated improved our ability to debug issues and iterate quickly. The Nginx + `/api` proxy approach helped simplify production routing and reduced configuration friction, while environment-based configuration kept local development aligned with deployment realities.

On the DevOps side, setting up a CI/CD pipeline changed how we worked. Once automated builds and deployments were stable, our iteration cycle became faster and more reliable, allowing us to focus on quality, edge cases, and user experience instead of manual release steps. This emphasized how automation reduces operational risk and helps maintain consistency across environments.

Overall, this project was a valuable blend of system design, implementation, and real deployment practice. We finish with a deeper understanding of cloud-native tradeoffs-especially around persistence, permissions, and operational consistency-and a solid foundation that could be extended with richer search, analytics, and administrative tooling.

## VIDEO DEMO:
- **Link:** **https://youtu.be/mX4Ewwx05m4** 
