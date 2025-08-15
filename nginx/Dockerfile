FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Create static and media directories
RUN mkdir -p /var/www/static /var/www/media

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
