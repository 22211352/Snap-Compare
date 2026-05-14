# 智能识物比价购物 AI APP 助手 MVP 设计文档

## 一、项目概述

### 项目背景

用户在日常购物中经常遇到“看到一个商品但不知道具体型号、品牌或在哪里买更划算”的场景。传统搜索依赖关键词，用户需要手动描述商品，搜索结果容易不准确。本项目通过手机拍照或相册选图，将商品图片上传到服务端，由服务端调用视觉 AI 识别商品类别、品牌、颜色、款式等属性，再通过合规商品开放平台 API 查询相似商品，展示跨平台商品卡片与价格信息。

项目定位是一个真实可上线的 MVP，不做爬虫、不自建支付、不声称全网最低价，而是通过合规开放平台返回的商品数据和联盟推广链接完成商品发现、比价和跳转购买。

### MVP 目标

1. 用户可以通过拍照或相册选择商品图片。
2. App 将图片上传到 FastAPI 服务端。
3. 服务端完成视觉 AI 识图，识别商品类别、品牌、颜色、款式、关键词等属性。
4. 服务端通过 Provider 抽象层调用京东联盟 API、拼多多多多进宝 API 等合规商品开放平台。
5. 前端展示相似商品列表，包括平台、标题、价格、店铺、图片、购买链接等。
6. 用户可以用自然语言追加筛选条件，例如“便宜点”“只看旗舰店”“预算500以内”。
7. 服务端调用 LLM API 或规则降级逻辑解析筛选条件，并返回过滤排序后的商品结果。
8. 商品详情页展示商品信息和服务端记录的历史价格趋势。
9. 用户可以查看搜索历史。
10. 本地开发默认使用 MockProvider，保证没有真实第三方 API Key 时也可以完整跑通流程。

### 用户核心流程

1. 用户打开 App 首页。
2. 用户选择“拍照识物”或“从相册选择”。
3. App 上传图片到服务端。
4. 服务端保存图片并返回 upload_id。
5. App 请求服务端识别图片。
6. 服务端返回识别结果，并基于识别结果查询相似商品。
7. App 展示识别摘要和跨平台商品卡片。
8. 用户输入自然语言筛选条件。
9. 服务端解析筛选条件，过滤和排序商品。
10. 用户点击商品卡片进入详情页。
11. 用户查看价格趋势，点击官方购买页或联盟推广链接跳转购买。
12. 用户可以进入历史页查看过往识图与搜索记录。

### MVP 边界

MVP 聚焦“识图、找相似商品、比价展示、自然语言筛选、详情与价格趋势、历史记录”六个核心能力。

MVP 不做自建支付、不做真实全网爬虫、不承诺全网最低价、不做复杂用户体系、不做端侧 AI 推理、不做商品评论情感分析、不做大规模推荐系统。淘宝联盟作为二期扩展，MVP 阶段只预留 Provider。

## 二、系统总体架构

### 系统架构图

```text
+-----------------------------+
|      Expo React Native App   |
|  Expo Router / Zustand       |
|  Camera / Image Picker       |
+--------------+--------------+
               |
               | HTTPS REST API
               v
+-----------------------------+
|          FastAPI Backend     |
|  Routers / Services /        |
|  Providers / SQLAlchemy      |
+------+----------+-----------+
       |          |           
       |          |           
       v          v
+-------------+  +----------------+
| PostgreSQL  |  | Redis Reserved |
| sessions    |  | cache/session  |
| products    |  | future use     |
| price logs  |  +----------------+
+-------------+
       |
       | service/provider calls
       v
+-----------------------------+
| External Provider Layer      |
| - Vision AI API              |
| - JD Union API               |
| - PDD DuoDuoJinBao API       |
| - LLM API                    |
| - MockProvider for local dev |
+-----------------------------+
```

### 组件关系说明

Expo App 负责移动端用户交互，包括拍照、选图、上传图片、展示识别结果、商品列表、自然语言筛选、详情页、价格趋势和搜索历史。App 不运行端侧 AI SDK，所有识图和筛选解析都通过服务端接口完成。

FastAPI 是核心业务服务，负责接收图片、调用视觉 AI、聚合商品开放平台数据、解析筛选条件、记录搜索会话、保存价格历史、提供 REST API。

PostgreSQL 存储用户、搜索会话、识别结果、商品快照、价格历史和收藏数据。价格趋势来自服务端记录的历史价格，不声称全网最低价。

Redis 在架构中预留，用于二期缓存热门识别结果、商品搜索结果、限流令牌和短期会话数据。MVP 可以先不启用 Redis。

视觉 AI API 由后端 Provider 调用，输入图片 URL 或图片二进制，输出商品结构化识别结果。

京东联盟 API、拼多多多多进宝 API 由后端 Provider 调用，基于识别出的关键词、类目、品牌和属性搜索相似商品。淘宝联盟作为二期扩展。

LLM API 由后端 Provider 调用，用于将用户自然语言筛选条件解析成结构化过滤规则。若 LLM 不可用，服务端可降级到简单规则解析。

## 三、核心业务流程

### 1. 拍照上传流程

1. 用户在首页点击拍照或相册选择。
2. Expo App 使用 `expo-camera` 或 `expo-image-picker` 获取图片。
3. 前端将图片以 `multipart/form-data` 上传到 `POST /api/upload`。
4. FastAPI 校验文件类型、大小和 MIME 类型。
5. 服务端将图片保存到本地开发目录或对象存储，并生成 `upload_id`。
6. 服务端创建一条 `search_sessions` 记录，状态为 `uploaded`。
7. 接口返回 `upload_id`、`image_url`、`session_id`。

### 2. 图像识别流程

1. 前端携带 `upload_id` 或 `image_url` 请求 `POST /api/recognize`。
2. 后端 `recognize` router 调用 `vision_service`。
3. `vision_service` 根据配置选择真实 VisionProvider 或 MockProvider。
4. Provider 返回商品类别、品牌、颜色、款式、材质、关键词、置信度等结构化结果。
5. 后端将识别结果写入 `recognized_items`。
6. 后端更新 `search_sessions` 状态为 `recognized`。
7. 接口返回识别结果 JSON。

### 3. 商品搜索与比价流程

1. 前端基于 `session_id` 和识别结果请求 `POST /api/search`。
2. 后端 `product_search_service` 将识别结果转换为搜索关键词。
3. 服务端并行调用 JDProvider 和 PDDProvider。
4. Provider 将不同平台返回结果转换成统一商品结构。
5. 服务端合并、去重、归一化价格、计算排序分。
6. 商品快照写入 `products` 表。
7. 当前价格写入 `price_history` 表。
8. 接口返回商品卡片列表。

### 4. 自然语言筛选流程

1. 用户在结果页输入“便宜点”“只看旗舰店”“预算500以内”等条件。
2. 前端请求 `POST /api/filter`，传入 `session_id`、原商品列表或商品 ID 列表、自然语言文本。
3. 后端 `filter_service` 调用 LLMProvider 解析文本。
4. LLMProvider 返回结构化筛选条件，例如最大价格、平台、店铺类型、排序方式。
5. 若 LLM 调用失败，服务端使用规则解析兜底，如识别“预算”“以内”“旗舰店”“便宜”等关键词。
6. 服务端从数据库读取当前 session 商品并过滤排序。
7. 接口返回结构化筛选条件和过滤后的商品列表。

### 5. 商品详情与价格趋势流程

1. 用户点击商品卡片进入 `app/detail/[id].tsx`。
2. 前端请求 `GET /api/products/{id}` 获取商品详情。
3. 前端请求 `GET /api/products/{id}/price-history` 获取价格历史。
4. 后端返回服务端记录的历史价格点。
5. 前端使用图表库展示价格趋势。
6. 用户点击购买按钮跳转到官方购买页或联盟推广链接。

### 6. 搜索历史流程

1. 每次上传图片时，后端创建 `search_sessions`。
2. 每次识别、搜索和筛选时，后端更新 session 状态和摘要字段。
3. 用户进入历史页，前端请求 `GET /api/history`。
4. 后端按时间倒序返回搜索会话列表，包括缩略图、识别摘要、商品数量、创建时间。
5. 用户点击某条历史记录可回到结果页查看历史商品。

## 四、前端架构设计

### 技术栈

1. React Native
2. Expo
3. Expo Router
4. Zustand
5. Axios
6. React Native Chart Kit 或其他 React Native 图表库
7. expo-camera
8. expo-image-picker
9. expo-linking

### 前端目录结构

```text
shopping-ai-app/
  app/
    index.tsx
    camera.tsx
    result.tsx
    detail/
      [id].tsx
    history.tsx
  components/
    ProductCard.tsx
    PriceChart.tsx
    SearchFilterBar.tsx
  services/
    api.ts
  store/
    productStore.ts
  types/
    product.ts
  package.json
  app.json
  tsconfig.json
  .env.example
```

### 页面和模块职责

`app/index.tsx` 是首页，展示项目主操作入口，包括拍照识物、相册选择和搜索历史入口。首页不做营销落地页，直接进入可用功能。

`app/camera.tsx` 负责拍照和相册选图。它调用 Expo Camera 或 ImagePicker，拿到图片后上传到后端，并触发识别和搜索流程。完成后跳转到结果页。

`app/result.tsx` 展示识别结果摘要、自然语言筛选输入框和商品比价列表。页面从 Zustand store 读取当前 session、识别结果和商品列表。

`app/detail/[id].tsx` 展示单个商品详情，包括商品图、标题、平台、价格、店铺、属性、购买按钮和价格趋势图。

`app/history.tsx` 展示搜索历史列表。用户点击历史记录可恢复对应 session 的商品结果。

`components/ProductCard.tsx` 是商品卡片组件，展示商品图、标题、平台、价格、店铺、促销信息、旗舰店标识和进入详情按钮。

`components/PriceChart.tsx` 是价格趋势图组件，接收价格历史数据并渲染折线图。文案明确为“历史记录价格趋势”，不声称全网最低。

`components/SearchFilterBar.tsx` 是自然语言筛选输入组件，支持输入筛选文本、提交、清空和展示当前筛选条件摘要。

`services/api.ts` 封装 Axios 实例和所有后端 API 调用，统一处理 baseURL、超时和错误响应。

`store/productStore.ts` 使用 Zustand 管理当前图片、session、识别结果、商品列表、筛选结果、加载状态和错误信息。

`types/product.ts` 定义识别结果、商品卡片、商品详情、筛选条件、价格历史、历史记录和错误响应的 TypeScript 类型。

## 五、后端架构设计

### 技术栈

1. FastAPI
2. SQLAlchemy
3. PostgreSQL
4. Pydantic
5. Uvicorn
6. python-dotenv
7. httpx
8. psycopg2-binary 或 asyncpg
9. python-multipart

### 后端目录结构

```text
shopping-ai-backend/
  main.py
  config.py
  database.py
  routers/
    upload.py
    recognize.py
    products.py
    filter.py
    history.py
  services/
    vision_service.py
    product_search_service.py
    filter_service.py
    price_history_service.py
  providers/
    vision_provider.py
    jd_provider.py
    pdd_provider.py
    llm_provider.py
    mock_provider.py
  models/
    product.py
    history.py
    user.py
  schemas/
    product.py
    recognize.py
    filter.py
    history.py
  uploads/
  requirements.txt
  .env.example
```

### 分层职责

`routers` 负责 HTTP 接口层。它们解析请求参数、调用 service、返回 Pydantic schema，不直接写复杂业务逻辑。

`services` 负责业务编排。它们组合数据库操作和 Provider 调用，例如识图服务、商品搜索服务、筛选服务、价格历史服务。

`providers` 负责外部 API 适配。每个 Provider 将某个第三方平台的请求、鉴权、响应解析封装起来，并输出系统内部统一结构。MockProvider 用于本地开发和测试。

`models` 负责 SQLAlchemy ORM 数据模型，定义数据库表结构、字段类型、关系和索引。

`schemas` 负责 Pydantic 请求与响应模型，定义 API 输入输出数据结构，与数据库模型解耦。

## 六、Provider 抽象设计

### 1. VisionProvider

VisionProvider 负责调用视觉 AI 服务。输入为图片 URL 或图片文件路径，输出统一识别结果。

主要方法：

```text
recognize(image_url: str) -> RecognizedItem
```

输出字段包括 category、brand、color、style、material、keywords、confidence、raw_result。

### 2. JDProvider

JDProvider 负责调用京东联盟 API。输入为关键词、类目、价格区间、分页参数，输出统一商品列表。

主要方法：

```text
search_products(query: ProductSearchQuery) -> list[ProductCard]
```

上线时需要替换真实京东联盟 API 鉴权、签名、商品搜索和推广链接生成逻辑。

### 3. PDDProvider

PDDProvider 负责调用拼多多多多进宝 API。输入为关键词、类目、价格区间、分页参数，输出统一商品列表。

主要方法：

```text
search_products(query: ProductSearchQuery) -> list[ProductCard]
```

上线时需要替换真实多多进宝 API 鉴权、签名、商品搜索和推广链接生成逻辑。

### 4. LLMProvider

LLMProvider 负责将自然语言筛选条件解析为结构化 JSON。

主要方法：

```text
parse_filter(text: str) -> FilterCondition
```

示例输入：“预算500以内，只看旗舰店，便宜点”

示例输出：max_price=500、shop_type=official、sort_by=price_asc。

### 5. MockProvider

MockProvider 用于本地开发，模拟 Vision、JD、PDD、LLM 的结果。它保证开发者不配置任何真实 API Key 时，也能跑通完整流程。

### 为什么需要 Provider 抽象层

Provider 抽象层将业务逻辑与第三方 API 解耦。服务层只依赖统一接口，不关心京东、拼多多、视觉模型或 LLM 的鉴权方式、字段名称和错误格式。这样可以降低二期扩展淘宝联盟或替换视觉模型的成本。

### 本地开发如何用 MockProvider

`.env` 中配置 `USE_MOCK_PROVIDER=true`。后端启动时根据配置选择 MockProvider。MockProvider 返回固定但足够真实的数据，包括识别结果、商品列表、筛选解析结果和价格历史。

### 上线时如何替换真实 API

上线时配置真实 API Key 和 `USE_MOCK_PROVIDER=false`。Provider 内部读取 `.env` 中的 JD、PDD、Vision、LLM 配置，完成签名、请求和响应映射。业务 service 不需要修改。

### API 调用失败时如何降级

1. 视觉 AI 调用失败：返回明确错误，提示用户重试或更换图片。
2. 单个商品平台失败：保留其他平台结果，同时在日志中记录失败平台。
3. 所有商品平台失败：返回空列表和可展示错误信息。
4. LLM 调用失败：使用规则解析降级。
5. 价格历史查询失败：详情页仍展示商品信息，价格趋势显示为空状态。

## 七、数据库设计

### 1. users

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | UUID / BIGSERIAL | 是 | 用户主键 |
| device_id | VARCHAR(128) | 否 | MVP 使用设备标识作为轻量用户标识 |
| nickname | VARCHAR(64) | 否 | 用户昵称，MVP 可为空 |
| created_at | TIMESTAMP | 是 | 创建时间 |
| updated_at | TIMESTAMP | 是 | 更新时间 |

### 2. search_sessions

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | UUID / BIGSERIAL | 是 | 搜索会话主键 |
| user_id | UUID / BIGINT | 否 | 关联 users |
| upload_id | VARCHAR(128) | 是 | 图片上传 ID |
| image_url | TEXT | 是 | 图片访问地址或本地静态地址 |
| status | VARCHAR(32) | 是 | uploaded、recognized、searched、failed |
| recognized_summary | TEXT | 否 | 识别摘要 |
| product_count | INTEGER | 是 | 商品数量 |
| created_at | TIMESTAMP | 是 | 创建时间 |
| updated_at | TIMESTAMP | 是 | 更新时间 |

### 3. recognized_items

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | UUID / BIGSERIAL | 是 | 识别结果主键 |
| session_id | UUID / BIGINT | 是 | 关联 search_sessions |
| category | VARCHAR(128) | 是 | 商品类别 |
| brand | VARCHAR(128) | 否 | 品牌 |
| color | VARCHAR(64) | 否 | 颜色 |
| style | VARCHAR(128) | 否 | 款式 |
| material | VARCHAR(128) | 否 | 材质 |
| keywords | JSONB | 是 | 搜索关键词数组 |
| confidence | NUMERIC(5,4) | 是 | 识别置信度 |
| raw_result | JSONB | 否 | 原始识别结果 |
| created_at | TIMESTAMP | 是 | 创建时间 |

### 4. products

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | UUID / BIGSERIAL | 是 | 商品主键 |
| session_id | UUID / BIGINT | 是 | 关联 search_sessions |
| platform | VARCHAR(32) | 是 | jd、pdd、taobao_future、mock |
| external_product_id | VARCHAR(128) | 是 | 第三方平台商品 ID |
| title | TEXT | 是 | 商品标题 |
| image_url | TEXT | 是 | 商品图片 |
| price | NUMERIC(12,2) | 是 | 当前价格 |
| original_price | NUMERIC(12,2) | 否 | 原价 |
| shop_name | VARCHAR(256) | 否 | 店铺名称 |
| shop_type | VARCHAR(64) | 否 | official、authorized、normal |
| sales_count | INTEGER | 否 | 销量或平台返回的近似销量 |
| coupon_info | TEXT | 否 | 优惠券信息 |
| product_url | TEXT | 是 | 官方购买页或联盟推广链接 |
| attributes | JSONB | 否 | 颜色、尺码、材质等扩展属性 |
| score | NUMERIC(8,4) | 否 | 内部排序分 |
| created_at | TIMESTAMP | 是 | 创建时间 |
| updated_at | TIMESTAMP | 是 | 更新时间 |

### 5. price_history

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | UUID / BIGSERIAL | 是 | 价格历史主键 |
| product_id | UUID / BIGINT | 是 | 关联 products |
| platform | VARCHAR(32) | 是 | 商品平台 |
| external_product_id | VARCHAR(128) | 是 | 第三方商品 ID |
| price | NUMERIC(12,2) | 是 | 记录价格 |
| currency | VARCHAR(16) | 是 | 默认 CNY |
| recorded_at | TIMESTAMP | 是 | 记录时间 |

### 6. user_favorites

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | UUID / BIGSERIAL | 是 | 收藏主键 |
| user_id | UUID / BIGINT | 否 | MVP 可为空，使用 device_id 时可后续补充 |
| product_id | UUID / BIGINT | 是 | 关联 products |
| created_at | TIMESTAMP | 是 | 收藏时间 |

## 八、REST API 设计

### 1. POST /api/upload

用途：上传用户拍摄或选择的商品图片。

请求参数：

```text
Content-Type: multipart/form-data
file: image/jpeg | image/png | image/webp
device_id?: string
```

返回 JSON：

```json
{
  "upload_id": "upl_123",
  "session_id": "sess_123",
  "image_url": "http://localhost:8000/uploads/upl_123.jpg"
}
```

主要处理逻辑：

1. 校验文件类型和大小。
2. 保存图片。
3. 创建或关联轻量用户。
4. 创建 search_session。
5. 返回 upload_id、session_id、image_url。

错误情况：

1. 文件为空。
2. 文件格式不支持。
3. 文件过大。
4. 图片保存失败。

### 2. POST /api/recognize

用途：基于上传图片进行服务端视觉识别。

请求参数：

```json
{
  "session_id": "sess_123",
  "upload_id": "upl_123",
  "image_url": "http://localhost:8000/uploads/upl_123.jpg"
}
```

返回 JSON：

```json
{
  "session_id": "sess_123",
  "recognized_item": {
    "category": "运动鞋",
    "brand": "Nike",
    "color": "白色",
    "style": "低帮休闲运动鞋",
    "material": "皮革/织物",
    "keywords": ["Nike 白色 低帮 运动鞋", "白色休闲鞋"],
    "confidence": 0.92
  }
}
```

主要处理逻辑：

1. 查询 session。
2. 调用 vision_service。
3. 保存 recognized_items。
4. 更新 session 状态。

错误情况：

1. session 不存在。
2. 图片不存在。
3. 视觉 API 调用失败。
4. 识别置信度过低。

### 3. POST /api/search

用途：根据识别结果搜索相似商品并比价。

请求参数：

```json
{
  "session_id": "sess_123",
  "keywords": ["Nike 白色 低帮 运动鞋"],
  "page": 1,
  "page_size": 20
}
```

返回 JSON：

```json
{
  "session_id": "sess_123",
  "products": []
}
```

主要处理逻辑：

1. 读取识别结果。
2. 构造搜索 query。
3. 调用 JDProvider 和 PDDProvider。
4. 合并去重和排序。
5. 保存商品快照和价格历史。
6. 返回商品卡片。

错误情况：

1. session 不存在。
2. 没有识别结果。
3. 商品开放平台全部失败。
4. 第三方 API 限流。

### 4. POST /api/filter

用途：根据用户自然语言筛选商品结果。

请求参数：

```json
{
  "session_id": "sess_123",
  "text": "预算500以内，只看旗舰店，便宜点"
}
```

返回 JSON：

```json
{
  "condition": {
    "max_price": 500,
    "shop_type": "official",
    "sort_by": "price_asc",
    "platforms": []
  },
  "products": []
}
```

主要处理逻辑：

1. 调用 LLMProvider 解析自然语言。
2. 失败时使用规则解析。
3. 从数据库读取 session 商品。
4. 应用过滤和排序。
5. 返回筛选条件和结果。

错误情况：

1. session 不存在。
2. 筛选文本为空。
3. 当前 session 没有商品。

### 5. GET /api/products/{id}

用途：获取商品详情。

请求参数：

```text
path: id
```

返回 JSON：

```json
{
  "id": "prod_123",
  "platform": "jd",
  "title": "Nike 白色低帮运动鞋",
  "image_url": "https://example.com/item.jpg",
  "price": 399,
  "shop_name": "品牌旗舰店",
  "shop_type": "official",
  "product_url": "https://example.com/buy",
  "attributes": {
    "color": "白色",
    "style": "低帮"
  }
}
```

主要处理逻辑：

1. 查询 products。
2. 返回统一商品详情。

错误情况：

1. 商品不存在。

### 6. GET /api/products/{id}/price-history

用途：获取商品的服务端记录价格趋势。

请求参数：

```text
path: id
```

返回 JSON：

```json
{
  "product_id": "prod_123",
  "currency": "CNY",
  "points": [
    {
      "recorded_at": "2026-05-11T10:00:00Z",
      "price": 399
    }
  ]
}
```

主要处理逻辑：

1. 查询 price_history。
2. 按 recorded_at 升序返回。

错误情况：

1. 商品不存在。
2. 暂无价格历史。

### 7. GET /api/history

用途：获取搜索历史。

请求参数：

```text
query: device_id?: string
query: limit?: number
```

返回 JSON：

```json
{
  "items": [
    {
      "session_id": "sess_123",
      "image_url": "http://localhost:8000/uploads/upl_123.jpg",
      "recognized_summary": "Nike 白色低帮运动鞋",
      "product_count": 12,
      "created_at": "2026-05-11T10:00:00Z"
    }
  ]
}
```

主要处理逻辑：

1. 根据 device_id 或默认用户上下文查询历史。
2. 按创建时间倒序返回。

错误情况：

1. 参数非法。

### 8. POST /api/favorites

用途：收藏商品。

请求参数：

```json
{
  "product_id": "prod_123",
  "device_id": "device_123"
}
```

返回 JSON：

```json
{
  "favorite_id": "fav_123",
  "product_id": "prod_123",
  "created_at": "2026-05-11T10:00:00Z"
}
```

主要处理逻辑：

1. 校验商品存在。
2. 创建收藏记录。
3. 返回收藏结果。

错误情况：

1. 商品不存在。
2. 重复收藏。

## 九、数据结构设计

### 1. 识别结果 JSON

```json
{
  "category": "运动鞋",
  "brand": "Nike",
  "color": "白色",
  "style": "低帮休闲运动鞋",
  "material": "皮革/织物",
  "keywords": ["Nike 白色 低帮 运动鞋", "白色休闲鞋"],
  "confidence": 0.92,
  "raw_result": {}
}
```

### 2. 商品卡片 JSON

```json
{
  "id": "prod_123",
  "platform": "jd",
  "external_product_id": "100012345",
  "title": "Nike 白色低帮休闲运动鞋",
  "image_url": "https://example.com/item.jpg",
  "price": 399,
  "original_price": 499,
  "shop_name": "Nike官方旗舰店",
  "shop_type": "official",
  "sales_count": 12000,
  "coupon_info": "满399减30",
  "product_url": "https://example.com/buy",
  "attributes": {
    "color": "白色",
    "style": "低帮"
  },
  "score": 0.91
}
```

### 3. 自然语言筛选条件 JSON

```json
{
  "min_price": null,
  "max_price": 500,
  "platforms": ["jd", "pdd"],
  "shop_type": "official",
  "sort_by": "price_asc",
  "keywords_include": ["白色"],
  "keywords_exclude": []
}
```

### 4. 价格趋势 JSON

```json
{
  "product_id": "prod_123",
  "currency": "CNY",
  "points": [
    {
      "recorded_at": "2026-05-09T10:00:00Z",
      "price": 429
    },
    {
      "recorded_at": "2026-05-10T10:00:00Z",
      "price": 409
    },
    {
      "recorded_at": "2026-05-11T10:00:00Z",
      "price": 399
    }
  ]
}
```

### 5. 统一错误返回 JSON

```json
{
  "error": {
    "code": "VISION_PROVIDER_FAILED",
    "message": "图像识别服务暂时不可用，请稍后重试",
    "details": {
      "provider": "vision"
    }
  }
}
```

## 十、上线部署方案

### Expo App 如何打包

使用 Expo EAS Build 进行 Android 和 iOS 打包。开发阶段使用 Expo Go 或 development build，生产阶段通过 EAS Build 生成 APK/AAB 和 iOS 构建包。生产环境 API 地址通过 Expo 环境变量配置，不硬编码在代码中。

### FastAPI 如何部署

FastAPI 使用 Uvicorn 或 Gunicorn + Uvicorn Worker 部署。推荐容器化部署到云服务器、Render、Fly.io、Railway、阿里云、腾讯云或 Kubernetes。生产环境开启 HTTPS，配置 CORS 白名单，限制上传文件大小。

### PostgreSQL 如何部署

MVP 可使用云数据库 PostgreSQL 或 Docker Compose 部署。生产环境需要开启自动备份、慢查询日志、连接池和基础监控。

### 图片如何存储

本地开发将图片保存到后端 `uploads/` 目录，并通过 FastAPI StaticFiles 提供访问。生产环境建议使用对象存储，例如 AWS S3、阿里云 OSS、腾讯云 COS，再将对象 URL 写入数据库。

### .env 如何管理

所有 API Key 和环境配置都通过 `.env` 管理，不允许硬编码。仓库只提交 `.env.example`。生产环境通过云平台 Secrets、环境变量或密钥管理服务注入配置。

关键环境变量包括：

```text
DATABASE_URL=
USE_MOCK_PROVIDER=true
VISION_API_KEY=
VISION_API_BASE_URL=
JD_APP_KEY=
JD_APP_SECRET=
PDD_CLIENT_ID=
PDD_CLIENT_SECRET=
LLM_API_KEY=
LLM_API_BASE_URL=
UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://localhost:8000
```

### 日志如何记录

后端使用结构化日志记录请求 ID、session_id、provider、接口耗时、错误码和第三方 API 调用状态。日志不记录完整 API Key，不记录敏感用户信息。生产环境日志输出到 stdout，由平台采集。

### 错误如何监控

MVP 可先使用服务端日志和云平台告警。上线后建议接入 Sentry 或 OpenTelemetry，监控接口错误率、第三方 Provider 失败率、图片上传失败率、平均识别耗时和搜索耗时。

## 十一、3 周开发计划

### 第 1 周：拍照上传 + 识别闭环

1. 搭建 Expo + Expo Router 前端项目。
2. 搭建 FastAPI 后端项目。
3. 配置 PostgreSQL、SQLAlchemy 和基础表结构。
4. 实现图片上传接口。
5. 实现 Mock VisionProvider。
6. 实现识别接口和识别结果存储。
7. 前端完成首页、拍照/选图页、上传和识别结果展示。

### 第 2 周：商品搜索 + 比价卡片 + 详情页

1. 实现 Product Provider 抽象。
2. 实现 Mock JDProvider 和 Mock PDDProvider。
3. 实现商品搜索、合并、去重、排序和入库。
4. 实现商品列表卡片。
5. 实现商品详情接口和详情页。
6. 实现购买链接跳转。
7. 初步完善错误状态、加载状态和空状态。

### 第 3 周：自然语言筛选 + 价格趋势 + 部署上线

1. 实现 LLMProvider 抽象和 Mock/规则筛选。
2. 实现自然语言筛选接口。
3. 前端实现筛选输入和实时结果刷新。
4. 实现价格历史记录和价格趋势接口。
5. 前端实现价格趋势图。
6. 实现搜索历史接口和历史页。
7. 编写 README、`.env.example` 和部署说明。
8. 完成本地端到端测试和生产环境部署准备。

## 十二、MVP 不做的功能

MVP 阶段明确暂不做以下功能：

1. 自建支付。
2. 真实全网爬虫。
3. 完整淘宝接入。
4. 复杂用户体系。
5. 端侧 AI 推理。
6. 商品评论情感分析。
7. 大规模推荐系统。

淘宝联盟、复杂用户账号体系、多模态对话式导购、商品评论分析、个性化推荐和 Redis 缓存优化可以作为二期或三期功能推进。
