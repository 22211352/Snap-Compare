# Snap-Compare

一个基于 Expo + FastAPI 的智能识物比价购物助手 MVP。

当前版本默认使用 MockProvider，本地无需真实 API Key 即可完整运行。

## 项目结构

```text
.
├── shopping-ai-backend/
└── shopping-ai-app/
```

- `shopping-ai-backend`：FastAPI 后端
- `shopping-ai-app`：Expo React Native 前端

## 后端启动

```bash
cd shopping-ai-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问：

```text
http://localhost:8000/docs
```

## 前端启动

```bash
cd shopping-ai-app
npm install
copy .env.example .env
npx expo start
```

## 数据库配置

项目使用 PostgreSQL。

```sql
CREATE DATABASE shopping_ai;
```

`.env` 示例：

```text
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/shopping_ai
```

## 当前功能

√ 商品图片上传
√ AI 商品识别
√ 商品比价
× 自然语言筛选
√ 商品详情
× 收藏
× 搜索历史
× Mock 数据演示

## 技术栈

前端：

- Expo
- React Native
- TypeScript

后端：

- FastAPI
- PostgreSQL
- SQLAlchemy

## License

MIT
