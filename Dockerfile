FROM    ubuntu:16.04

# Install Node.js and other dependencies
RUN apt-get update && \
    apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup | bash - && \
    apt-get -y install python build-essential nodejs npm

# Install nodemon
RUN npm install -g nodemon

# Provides cached layer for node_modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install

# Define working directory
WORKDIR /
COPY . /

# Expose port
EXPOSE  3000

# Run app using nodemon
CMD ["nodemon", "/index.js"]