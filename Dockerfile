# ===== STAGE 1: Build =====
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_GOOGLE_MAPS_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY

RUN npm run build

# ===== STAGE 2: Serve with Nginx =====
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA routing: redirige todo a index.html
RUN echo 'server { \
  listen 80; \
  location / { \
  root /usr/share/nginx/html; \
  index index.html; \
  try_files $uri $uri/ /index.html; \
  } \
  }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
