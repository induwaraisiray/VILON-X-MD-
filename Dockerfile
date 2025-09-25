# Use the LTS version of Node.js (Debian bookworm)
FROM node:lts-bookworm

# Install necessary packages: ffmpeg, imagemagick, libwebp-dev
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    libwebp-dev && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies including PM2
RUN npm install && npm install pm2 -g

# Copy all local files to the working directory
COPY . .

# Expose port 9090 (to match your Node.js code)
EXPOSE 9090

# Start the application using PM2 in runtime mode
CMD ["pm2-runtime", "index.js", "--", "--server"]
