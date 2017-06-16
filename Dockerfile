FROM nginx:1.13.0-alpine

# install console and node
RUN apk update && apk add --no-cache fontconfig &&\
    apk add --no-cache curl &&\
    apk add --no-cache bash=4.3.46-r5 &&\
    apk add --no-cache openssl=1.0.2k-r0 &&\
    apk add --no-cache nodejs &&\
    apk add --no-cache build-base &&\
    apk add --no-cache chrpath &&\
    apk add --no-cache openssl-dev &&\
    apk add --no-cache libxft-dev &&\
    apk add --no-cache freetype &&\
    apk add --no-cache freetype-dev &&\
    apk add --no-cache fontconfig-dev

# Install nodemon
RUN npm install -g nodemon

COPY . /usr/share/nginx/html
WORKDIR /usr/share/nginx/html

RUN npm install
RUN npm rebuild

# Expose port
EXPOSE  3000

# Run app using nodemon
CMD ["nodemon", "/usr/share/nginx/html/index.js"]