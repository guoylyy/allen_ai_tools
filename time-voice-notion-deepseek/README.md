# 语音一句话 → Notion 时间记录（DeepSeek 解析版 / FastAPI）

## 为什么换成 DeepSeek 来“识别+分解”
- 不再依赖本地硬编码规则（正则/分支），解析更灵活、容错更高；
- 通过 **Function Calling 严格模式** 输出结构化 JSON，字段稳定；
- 支持“到现在/昨晚/半/上午/跨日”等口语时间表达。

---

## 一、准备 Notion 数据库（一次性）

### 时间记录数据库
建表字段：**Activity(Title)**、**When(Date)**、**Category(Select)**、**Tags(Multi-select)**、**Notes(Rich text)**。
可选公式列 **Duration (h)**：
```
round(dateBetween(end(prop("When")), start(prop("When")), "minutes") / 60, 2)
```

### 花销记录数据库
建表字段：**Content(Title)**、**Amount(Number)**、**Date(Date)**、**Category(Select)**、**Tags(Multi-select)**、**Notes(Rich text)**。

---

## 二、运行服务

### Docker
```bash
docker build -t voice-notion .
docker run -it --rm -p 8000:8000   -e NOTION_TOKEN=secret_xxx   -e NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   -e DEFAULT_TZ=Asia/Shanghai   -e DEEPSEEK_API_KEY=sk_xxx   -e DEEPSEEK_BASE_URL=https://api.deepseek.com/beta   -e DEEPSEEK_MODEL=deepseek-chat   voice-notion
```

### 本地 Python
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export NOTION_TOKEN=secret_xxx
export NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export DEEPSEEK_API_KEY=sk_xxx
export DEEPSEEK_BASE_URL=https://api.deepseek.com/beta
export DEEPSEEK_MODEL=deepseek-chat
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

> 说明：`/beta` base_url 用于启用 **严格模式**（Strict）。

---

## 三、Android（小米）语音上送（Tasker）

### 时间记录任务：
1) **Input → Get Voice**（提示"9点到10点 写合同 #工作"），结果变量 `%VOICE`  
2) **Net → HTTP Request (POST)** 到 `http://服务器IP:8000/ingest`，Body：
```json
{"utterance":"%VOICE","source":"tasker"}
```
3) （可选）提示结果。小米需放开自启动、后台限制、麦克风权限。

### 花销记录任务：
1) **Input → Get Voice**（提示"午餐花了50元 #餐饮"），结果变量 `%VOICE`  
2) **Net → HTTP Request (POST)** 到 `http://服务器IP:8000/expense`，Body：
```json
{"utterance":"%VOICE","source":"tasker"}
```
3) （可选）提示结果。

---

## 四、接口
- `POST /ingest` → 时间记录主入口；返回解析后的字段与 Notion URL。
- `POST /expense` → 花销记录主入口；返回解析后的字段与 Notion URL。

---

## 五、可定制点
- `app/mapping.yml`：给模型看的“候选类别”集合（它会尽量归一）；
- `DEEPSEEK_MODEL` 可切换 `deepseek-reasoner`（更强的推理，成本略高）；
- 提示词中可加入你的行业词表/项目名，提升分类准确率。

---

## 参考
- DeepSeek JSON 输出与严格模式、函数调用：详见官方文档。
