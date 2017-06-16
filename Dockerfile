FROM nginx:1.13.0-alpine

# install console and node
RUN apk add --no-cache bash=4.3.46-r5 &&\
    apk add --no-cache openssl=1.0.2k-r0 &&\
    apk add --no-cache nodejs &&\
    apk add --no-cache build-essential &&\
    apk add --no-cache chrpath &&\
    apk add --no-cache libssl-dev &&\
    apk add --no-cache libxft-dev &&\
    apk add --no-cache libfreetype6 &&\
    apk add --no-cache libfreetype6-dev &&\
    apk add --no-cache libfontconfig1 &&\
    apk add --no-cache libfontconfig1-dev

RUN wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
RUN tar xvjf phantomjs-2.1.1-linux-x86_64.tar.bz2 -C /usr/local/share/
RUN ln -sf /usr/local/share/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin

# Install nodemon
RUN npm install -g nodemon
RUN npm install -g phantomjs

# Define working directory
WORKDIR /
COPY . /
RUN npm install

# Expose port
EXPOSE  3000

# Run app using nodemon
CMD ["nodemon", "/index.js"]