FROM node:20-slim

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 使用 serve 来提供静态文件
RUN npm install -g serve

EXPOSE 3000

# --single 参数支持 SPA 路由
CMD ["serve", "-s", "dist", "-l", "3000", "--single"]
