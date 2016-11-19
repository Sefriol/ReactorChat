FROM mongo:latest

ADD run.sh /run.sh
ADD config_mongo.sh /config_mongo.sh

EXPOSE 27017

CMD ["/bin/bash", "run.sh"]