FROM eclipse-temurin:11-jdk-focal AS builder
ARG DEBIAN_FRONTEND=noninteractive
ARG SBT_VERSION=1.4.9
RUN apt-get update \
    && apt-get install -y --no-install-recommends bash curl ca-certificates git \
    && mkdir -p /opt/sbt \
    && curl --fail --location --retry 3 \
      "https://repo1.maven.org/maven2/org/scala-sbt/sbt-launch/${SBT_VERSION}/sbt-launch-${SBT_VERSION}.jar" \
      --output /opt/sbt/sbt-launch.jar \
    && printf '#!/usr/bin/env bash\nexec java -jar /opt/sbt/sbt-launch.jar "$@"\n' > /usr/local/bin/sbt \
    && chmod +x /usr/local/bin/sbt \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /src/litak-ws
COPY litak-ws/ ./
RUN sbt clean stage

FROM eclipse-temurin:11-jre-focal AS runtime
RUN groupadd --system litak \
    && useradd --system --gid litak --home-dir /opt/litak-ws litak \
    && mkdir -p /opt/litak-ws \
    && chown -R litak:litak /opt/litak-ws
COPY --from=builder --chown=litak:litak /src/litak-ws/target/universal/stage/ /opt/litak-ws/
COPY --chown=litak:litak litak/docker/litak-ws-production.conf /etc/litak-ws/production.conf
USER litak
WORKDIR /opt/litak-ws
EXPOSE 9664
ENTRYPOINT ["/opt/litak-ws/bin/lila-ws"]
CMD ["-Dconfig.file=/etc/litak-ws/production.conf", "-J-Xms64M", "-J-Xmx384M", "-J-XX:ActiveProcessorCount=2", "-J-server"]
