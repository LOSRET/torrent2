# Torrent Parser

纯前端 BitTorrent `.torrent` / 磁力链接解析器。所有解析在浏览器本地完成,不上传到任何服务器。

功能:解析 `.torrent` 文件(支持 BitTorrent v1 / v2 / hybrid)、Bencode 解码、Info Hash 计算(SHA-1 / SHA-256)、Tracker / Web Seed / DHT 节点提取、文件列表与分片信息、磁力链接解析与生成、JSON 导出。

技术栈:Vue 3 + TypeScript + Vite + Tailwind v4。

## 开发

```bash
npm install
npm run dev        # 本地开发
npm run build      # 类型检查 + 生产构建(唯一的验证步骤)
```

## 部署

部署到 Cloudflare Pages(通过 Wrangler):

```bash
npm run build && npx wrangler deploy
```

> Wrangler 不在 devDependencies 中,需通过 `npx` 调用。
