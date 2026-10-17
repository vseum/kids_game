FROM nginx:1.27-alpine

# Конфиг nginx (gzip, кэш статики, правильные типы файлов)
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Игра
COPY index.html /usr/share/nginx/html/
COPY css   /usr/share/nginx/html/css
COPY js    /usr/share/nginx/html/js
COPY voice /usr/share/nginx/html/voice

EXPOSE 80
