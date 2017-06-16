FROM nginx

# install console and node
RUN apt-get update && apt-get install curl -y && curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh &&\
    bash nodesource_setup.sh &&\
    apt-get install nodejs -y &&\
    apt-get install build-essential chrpath libssl-dev libxft-dev -y &&\
    apt-get install libfreetype6 libfreetype6-dev -y &&\
    apt-get install libfontconfig1 libfontconfig1-dev -y

RUN cd ~ &&\
    export PHANTOM_JS="phantomjs-2.1.1-linux-x86_64" &&\
    wget https://github.com/Medium/phantomjs/releases/download/v2.1.1/$PHANTOM_JS.tar.bz2 &&\
    sudo tar xvjf $PHANTOM_JS.tar.bz2 &&\
    sudo mv $PHANTOM_JS /usr/local/share &&\
    sudo ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin

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