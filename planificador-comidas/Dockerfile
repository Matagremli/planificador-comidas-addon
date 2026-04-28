ARG BUILD_FROM

FROM ${BUILD_FROM} AS builder

WORKDIR /app

COPY app/package.json app/package-lock.json ./

RUN npm ci

COPY app ./

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run db:generate
RUN npm run build
RUN npm prune --omit=dev

FROM ${BUILD_FROM}

WORKDIR /app

COPY --from=builder /app /app
COPY run.sh /run.sh

RUN chmod a+x /run.sh

EXPOSE 8099

CMD ["/run.sh"]
