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

# Zeabur 需要监听 0.0.0.0 和 PORT 环境变量
ENV PORT=3000
EXPOSE 3000

# -L 参数监听所有接口，使用环境变量 PORT
CMD serve -s dist -l tcp://0.0.0.0:$PORT --single
