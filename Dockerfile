FROM node:18

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm install

# Copy frontend package.json first and install dependencies
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the project
WORKDIR /app
COPY . .

# Build Angular frontend
WORKDIR /app/frontend
RUN npm run build

# Go back to root for server
WORKDIR /app

EXPOSE 8080
CMD ["node", "server.js"]