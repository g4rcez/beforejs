vite build --ssr src/_root.view.tsx --outDir dist/server --config vite-server.config.ts; 
mkdir -p dist/cache
cp -r dist/server/_root.view.js dist/cache/_root.view.js
vite build --ssr src/deep-test/deep-test.view.tsx --outDir dist/server --config vite-server.config.ts
cp -r dist/server/deep-test.view.js dist/cache/deep-test.view.js
mv dist/cache/* dist/server/
