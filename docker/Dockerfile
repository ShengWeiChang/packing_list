# The digest identifies the multi-platform Playwright 1.58.2 Ubuntu 24.04 image.
FROM mcr.microsoft.com/playwright:v1.58.2-noble@sha256:6446946a1d9fd62d9ae501312a2d76a43ee688542b21622056a372959b65d63d

ENV CI=true HUSKY=0 PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /workspace
COPY --chmod=755 docker/test-entrypoint.sh /usr/local/bin/packing-list-test
ENTRYPOINT ["/usr/local/bin/packing-list-test"]
