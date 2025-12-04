# Use a lightweight Node.js base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (leverage layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Ensure runtime data directory exists (created at runtime too)
RUN mkdir -p ./data/finance

# Expose the port the app listens on
EXPOSE 3045

# Use non-root user for security (node user exists in official image)
USER node

# Start the app
CMD ["npm", "start"]
