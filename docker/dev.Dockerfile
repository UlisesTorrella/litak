FROM eclipse-temurin:11-jdk-focal

ARG DEBIAN_FRONTEND=noninteractive
ARG SBT_VERSION=1.4.9

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash curl ca-certificates git nodejs npm netcat-openbsd \
    && npm install --global yarn@1.22.22 \
    && mkdir -p /opt/sbt \
    && curl --fail --location --retry 3 \
      "https://repo1.maven.org/maven2/org/scala-sbt/sbt-launch/${SBT_VERSION}/sbt-launch-${SBT_VERSION}.jar" \
      --output /opt/sbt/sbt-launch.jar \
    && printf '#!/usr/bin/env bash\nexec java -jar /opt/sbt/sbt-launch.jar "$@"\n' > /usr/local/bin/sbt \
    && chmod +x /usr/local/bin/sbt \
    && rm -rf /var/lib/apt/lists/* /root/.npm

WORKDIR /workspace
