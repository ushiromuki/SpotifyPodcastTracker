import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { log } from './vite'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
const app = new Hono()

log("Hello World")

app.use('*', logger())

// 静的ファイル配信
app.use('/assets/*', serveStatic({ root: './dist/public' }))

// Reactアプリケーションのルート
app.get('*', (c) => c.html(`
  <!DOCTYPE html>
  <html>
    <head>
      ${import.meta.env.PROD ? 
        '<script type="module" src="/assets/main.js"></script>' :
        '<script type="module" src="/src/main.tsx"></script>'}
    </head>
    <body>
      <div id="root"></div>
    </body>
  </html>
`))
// Error handling
app.onError((err, c) => {
	log(`Error: ${err}`);
	return c.json({ message: err.message }, 500);
});
  
  // Start server
  const port = process.env.PORT || 5000;
  
// サーバー起動処理を追加
serve({
	fetch: app.fetch,
	port: Number(port)
  }, () => {
	log(`Server is running on port ${port}`);
})