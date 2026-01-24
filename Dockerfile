# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:stable-alpine

# Copy the build output to Nginx's default directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx config if you have one, or use default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]