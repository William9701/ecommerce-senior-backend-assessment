# Use an official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the entire project into the container
COPY . .

# Expose the port your NestJS app runs on (default is 3000)
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
