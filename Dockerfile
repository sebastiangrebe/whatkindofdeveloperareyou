FROM nginx

ENV DEBIAN_FRONTEND noninteractive

# update repos
RUN apt-get update
# install console, node and phantomjs depedencies
RUN apt-get install curl gnupg wget -y &&\
    curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh &&\
    bash nodesource_setup.sh &&\
    apt-get install nodejs &&\
    apt-get install build-essential chrpath libssl-dev libxft-dev -y &&\
    apt-get install libfreetype6 libfreetype6-dev -y &&\
    apt-get install libfontconfig1 libfontconfig1-dev -y

# install phantomjs
RUN cd ~ &&\
    export PHANTOM_JS="phantomjs-2.1.1-linux-x86_64" &&\
    wget https://github.com/Medium/phantomjs/releases/download/v2.1.1/$PHANTOM_JS.tar.bz2 &&\
    tar xvjf $PHANTOM_JS.tar.bz2 &&\
    mv $PHANTOM_JS /usr/local/share &&\
    ln -sf /usr/local/share/$PHANTOM_JS/bin/phantomjs /usr/local/bin

# Install nodemon
RUN npm install -g nodemon
# Install gulp
RUN npm install -g gulp

# copy to nginx
COPY . /usr/share/nginx/html
WORKDIR /usr/share/nginx/html

# install node packages
RUN npm install
# run build with gulp
RUN npm run build
# rebuild in order to get phantomjs working
RUN npm rebuild

# Expose port
EXPOSE 80

# Run app using nodemon
CMD ["nodemon", "/usr/share/nginx/html/index.js"]