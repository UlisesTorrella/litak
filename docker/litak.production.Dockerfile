FROM node:22-bookworm AS assets
ARG GIT_REVISION=unknown
ENV LITAK_GIT_REVISION=${GIT_REVISION}
WORKDIR /src/litak
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
COPY litak/package.json litak/yarn.lock ./
COPY litak/ui ./ui
COPY litak/public ./public
RUN git init && yarn install --frozen-lockfile && ./ui/build prod

FROM eclipse-temurin:11-jdk-focal AS builder
ARG DEBIAN_FRONTEND=noninteractive
ARG SBT_VERSION=1.4.7
RUN apt-get update \
    && apt-get install -y --no-install-recommends bash curl ca-certificates git \
    && mkdir -p /opt/sbt \
    && curl --fail --location --retry 3 \
      "https://repo1.maven.org/maven2/org/scala-sbt/sbt-launch/${SBT_VERSION}/sbt-launch-${SBT_VERSION}.jar" \
      --output /opt/sbt/sbt-launch.jar \
    && printf '#!/usr/bin/env bash\nexec java -jar /opt/sbt/sbt-launch.jar "$@"\n' > /usr/local/bin/sbt \
    && chmod +x /usr/local/bin/sbt \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /src/litak
COPY litak/ ./
COPY --from=assets /src/litak/public/ ./public/
RUN cp -n conf/application.conf.default conf/application.conf \
    && cp -n .sbtopts.default .sbtopts \
    && ./lila -Depoll=false stage

FROM eclipse-temurin:11-jre-focal AS runtime
RUN groupadd --system litak \
    && useradd --system --gid litak --home-dir /opt/litak litak \
    && mkdir -p /opt/litak /var/log/lichess \
    && chown -R litak:litak /opt/litak /var/log/lichess
COPY --from=builder --chown=litak:litak /src/litak/target/universal/stage/ /opt/litak/
COPY --chown=litak:litak litak/docker/litak-production.conf /etc/litak/production.conf
USER litak
WORKDIR /opt/litak
EXPOSE 9663
ENTRYPOINT ["/opt/litak/bin/lila"]
CMD ["-Dconfig.file=/etc/litak/production.conf", "-Dlogger.resource=logback.xml", "-J-Xms128M", "-J-Xmx1G", "-J-XX:ActiveProcessorCount=2", "-J-server"]
