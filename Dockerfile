FROM nginx:1.13.0-alpine

# install console and node
RUN apk add --no-cache bash=4.3.46-r5 &&\
    apk add --no-cache openssl=1.0.2k-r0 &&\
    apk add --no-cache nodejs

# Install nodemon
RUN npm install -g nodemon

# Define working directory
WORKDIR /
COPY . /
RUN npm install

# Expose port
EXPOSE  3000

# Run app using nodemon
CMD ["nodemon", "/index.js"]