# Fase de Construcción
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pasamos la URL de la API como argumento de construcción
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Fase de Producción (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copiamos una configuración simple de Nginx para manejar rutas de React (SPA)
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
