# Use the official Playwright image with all dependencies pre-installed
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ../
COPY client/package*.json ../client/
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port (adjust based on your backend configuration)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]