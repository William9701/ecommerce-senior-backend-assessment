# E-commerce Senior Backend Assessment

## Overview
This project demonstrates the implementation of a scalable microservice-based system for a simple e-commerce application. The system includes user management, product listings, and order management services. The project is developed using Docker and Kubernetes for deployment, ensuring scalability, fault tolerance, and efficient handling of concurrent requests.

## Submission Guidelines
- Provide all code in a GitHub repository or a compressed file.
- Include this README file explaining how to set up and run the solution.
- Document any assumptions or decisions made during the process.
- Reply to the assessment email with the link to your GitHub repository.

## Tasks

### Task 1: System Design
1. **Objective**: Design a scalable microservice-based system for a simple e-commerce application.
2. **Requirements**:
   - Create a system design document outlining the architecture.
   - Include diagrams (e.g., component, sequence, deployment diagrams).
   - Describe the following components:
     - User service (manages user accounts and authentication).
     - Product service (manages product listings).
     - Order service (manages orders and transactions).
   - Discuss how services will communicate (e.g., REST, gRPC, messaging).
   - Explain how to handle data consistency, fault tolerance, and scaling.

### Task 2: Implement the User Service
1. **Objective**: Implement the User service based on the system design.
2. **Requirements**:
   - Use a modern backend framework (NestJS framework for NodeJS).
   - Implement the following endpoints:
     - `POST /register`: Register a new user.
     - `POST /login`: Authenticate a user and return a JWT.
     - `GET /users/:id`: Retrieve user details.
   - Use a relational database (MySQL) for storing user data.
   - Implement JWT-based authentication and authorization.
   - Ensure the service can handle concurrent requests efficiently.

### Task 3: Integrate with an External Service
1. **Objective**: Integrate the User service with an external email service for sending welcome emails upon user registration.
2. **Requirements**:
   - Use a third-party email service (Nodemailer).
   - Implement asynchronous email sending using a message queue (RabbitMQ).
   - Ensure that email sending is resilient to failures.

### Task 4: Testing and Documentation
1. **Objective**: Write tests and document the User service.
2. **Requirements**:
   - Use a testing framework (Jest for Node.js).
   - Write unit tests for individual functions or methods.
   - Write integration tests for the API endpoints.
   - Document the API using Swagger or a similar tool.
   - Ensure the documentation is clear and detailed, including setup instructions.

### Bonus Tasks
1. **Observability**: Implement logging, monitoring, and alerting for the User service.
   - Use a logging framework (Winston for Node.js).
   - Set up monitoring and alerting with Prometheus and Grafana or a similar stack.
2. **Security**: Implement additional security measures, such as rate limiting, input sanitization, and secure configuration management.
3. **CI/CD**: Set up a CI/CD pipeline for the User service using GitHub Actions.
4. **Docker and Kubernetes**: Provide Dockerfiles and Kubernetes manifests for deploying the User service.

## Setup Instructions

### Prerequisites
- Docker
- Kubernetes (Minikube or Docker Desktop)
- Node.js
- MySQL
- RabbitMQ

### Clone the Repository
```bash
git clone git@github.com:William9701/ecommerce-senior-backend-assessment.git
cd ecommerce-senior-backend-assessment/user-service
```

### Create and Fill the .env File
Create a `.env` file in the root directory of the project "ecommerce-senior-backend-assessment/user-service" and fill it with the following environment variables:

```env
DB_HOST=mysql_db
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=user_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=1h
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=smtp_password
SMTP_SENDER=your_email
```

### Docker Setup
1. **Build and Run Docker Container**:
   ```bash
   docker-compose up --build
   ```


### Kubernetes Setup
1. **Apply Kubernetes Manifests**:
   ```bash
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   kubectl apply -f mysql-deployment.yaml
   kubectl apply -f rabbitmq-deployment.yaml
   kubectl apply -f redis-deployment.yaml
   ```

### API Endpoints
- **Register a new user**:
  ```bash
  curl -X POST http://localhost:3005/api/register -H "Content-Type: application/json" -d '{"email": "test@example.com", "password": "Password123!"}'
  ```

- **Login a user**:
  ```bash
  curl -X POST http://localhost:3005/api/login -H "Content-Type: application/json" -c cookies.txt -d '{"email": "test@example.com", "password": "Password123!"}'
  ```


---

- **Retrieve User Details**  

This endpoint retrieves details of a specific user by their ID.  

```bash
curl -X GET -b cookies.txt http://localhost:3005/api/users/1
```

**Note:** This request requires authentication. To access user details, you must first **register** and **log in** to obtain valid session credentials (e.g., cookies or tokens). This security measure ensures that user data remains protected and follows best practices for API security.  

---

This version makes it clearer and more professional. Let me know if you need any tweaks! 🚀
- **Logout a user**:
  ```bash
  curl -X GET -b cookies.txt http://localhost:3005/api/users/logout
  ```

### Using Postman
1. **Register a new user**:
   - Method: POST
   - URL: `http://localhost:3005/api/register`
   - Body: 
     ```json
     {
       "email": "test@example.com",
       "password": "Password123!"
     }
     ```

2. **Login a user**:
   - Method: POST
   - URL: `http://localhost:3005/api/login`
   - Body: 
     ```json
     {
       "email": "test@example.com",
       "password": "Password123!"
     }
     ```

3. **Retrieve user details**:
   - Method: GET
   - URL: `http://localhost:3005/api/users/1`
   - Headers: 
     ```json
     {
       "Cookie": "session_id=<session_id>"
     }
     ```

4. **Logout a user**:
   - Method: GET
   - URL: `http://localhost:3005/api/users/logout`
   - Headers: 
     ```json
     {
       "Cookie": "session_id=<session_id>"
     }
     ```

### Logging
- Logging is implemented using Winston.

### CI/CD
- CI/CD pipeline is set up using GitHub Actions.

### Assumptions and Decisions
- The project uses NestJS framework for NodeJS.
- MySQL as the relational database.
- Nodemailer is used for sending emails.
- RabbitMQ is used for asynchronous email sending.
- Winston is used for logging.
- GitHub Actions is used for CI/CD.
- Docker and Kubernetes for contanization and orchestration.

## Conclusion
This project demonstrates the implementation of a scalable microservice-based system for a simple e-commerce application. The system includes user management, product listings, and order management services. The project is developed using Docker and Kubernetes for deployment, ensuring scalability, fault tolerance, and efficient handling of concurrent requests for the user-service.

For any questions or further assistance, feel free to reach out.

