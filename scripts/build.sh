vite build --ssr src/App.page.tsx --outDir dist/server --config vite-server.config.ts; 
mkdir -p dist/cache
cp -r dist/server/App.page.js dist/cache/App.page.js
vite build --ssr src/Test.page.tsx --outDir dist/server --config vite-server.config.ts
cp -r dist/server/Test.page.js dist/cache/Test.page.js
mv dist/cache dist/server
