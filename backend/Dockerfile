FROM denoland/deno:2.0.3

EXPOSE 8000

USER deno

COPY . .
RUN deno cache --allow-import src/index.ts

CMD ["task", "start"]
