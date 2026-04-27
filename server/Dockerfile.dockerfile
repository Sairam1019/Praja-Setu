FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port your backend listens on (default 5000)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]