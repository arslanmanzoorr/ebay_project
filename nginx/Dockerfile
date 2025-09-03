FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

# Copy error pages
COPY html/404.html /usr/share/nginx/html/404.html
COPY html/50x.html /usr/share/nginx/html/50x.html

# Create necessary directories
RUN mkdir -p /var/log/nginx /var/www /etc/nginx/ssl

# Set proper permissions
RUN chown -R nginx:nginx /var/log/nginx /var/www /usr/share/nginx/html

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
