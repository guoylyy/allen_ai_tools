# git-notion-sync

一个可运行的小项目：每天从 **GitHub / Gitee** 的多个仓库拉取最近的提交，统计每次 commit 的：

- 提交信息（subject + body）
- 修改文件数
- 新增 / 修改 / 删除代码行数（见“统计口径说明”）
- 前端 / 后端分类统计
- 提交人（姓名 & 邮箱）
- 提交时间（本地化为 Europe/Berlin）

并 **逐条写入 Notion 数据库**（一条记录 = 一个 commit）。

> 你可以把 Notion 视图按“日期 = 当天”分组、再按“提交人”分组，即可得到“按人、按日”的统计视图。

---

## 快速开始

### 1) 准备 Notion 集成
1. 在 Notion 新建一个集成（Integration），保存 **Internal Integration Token**，并把你用于存放数据库的页面“Share”给该集成。
2. 记下 **Parent Page ID**（如果你想用脚本自动创建数据库），或者提前手工创建数据库并记下 **Database ID**。

### 2) 安装依赖（本地或服务器）
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3) 配置
复制一份 `config.example.yaml` 为 `config.yaml` 并按需修改：
- `repos`: 你的仓库列表（支持 GitHub / Gitee）。私有仓库通过 token 访问。
- `classify.frontend_globs` / `classify.backend_globs`: 前后端文件匹配规则（glob）。
- `notion.database_id`: 目标数据库 ID（若为空且提供了 `notion.parent_page_id`，可先运行 `python scripts/create_notion_db.py` 自动创建数据库）。
- `time.daily_window_local`: 每天统计哪个时间窗口的提交（默认统计“昨天 00:00 ~ 昨天 23:59”，欧洲/柏林时区）。

### 4) 首次（可选）创建 Notion 数据库
```bash
export NOTION_TOKEN="你的 notion internal token"
python scripts/create_notion_db.py
```
运行后会把创建出的 `database_id` 写回 `config.yaml`。

### 5) 每日运行
**方式 A：GitHub Actions（推荐）**  
把本仓库推到 GitHub，设置仓库 Secrets：
- `NOTION_TOKEN`：Notion 集成 token
- `GITHUB_TOKEN`：GitHub Personal Access Token（如果要拉私有仓库或跨组织仓库）
- `GITEE_TOKEN`：Gitee 私有 token（如需要）

然后工作流 `.github/workflows/daily.yml` 会每天在 **Europe/Berlin 08:05** 自动跑：
```yaml
on:
  schedule:
    - cron: "5 6 * * *"
```
> 注意：cron 使用 **UTC**，等于柏林时间 08:05（冬令时可能有差异，可按需调整）。

**方式 B：本地/服务器定时任务**
```bash
export NOTION_TOKEN="你的 notion token"
export GITHUB_TOKEN="(可选)"
export GITEE_TOKEN="(可选)"
python main.py  # 或写入 crontab
```

---

## 统计口径说明

- 通过 `git diff --numstat parent..commit` 逐文件统计新增/删除行，
- **修改行数 (modified)** 定义为 `min(added, deleted)`（即两边同时变化的那部分），
- 因此：
  - 纯新增 ≈ `added - modified`
  - 纯删除 ≈ `deleted - modified`
- 合并提交（多个父节点）默认**跳过**，避免重复统计；如需纳入，可在 `config.yaml` 中开启 `include_merges: true`。

---

## Notion 数据库结构（自动创建脚本所用）

- **Name**（Title）：`{repo}:{short_sha} — {subject}`
- **Repo**（Select）
- **Platform**（Select: GitHub / Gitee）
- **Commit SHA**（Rich text）
- **Author Name**（Rich text）
- **Author Email**（Rich text）
- **Commit Time**（Date）
- **Message**（Rich text, 全文）
- **Files Changed**（Number）
- **Lines Added / Deleted / Modified**（Number）
- **FE Files / FE Added / FE Deleted / FE Modified**（Number）
- **BE Files / BE Added / BE Deleted / BE Modified**（Number）

> 之后你可以在 Notion 里新建不同视图，例如：
> - “每日”视图：筛选 `Commit Time` 的日期 = 今天 / 昨天；
> - “作者看板”视图：按 `Author Name` 分组；
> - “前后端”统计：显示 FE/BE 指标列并做合计。

---

## 配置多个仓库的示例

见 `config.example.yaml`。支持：
- `github`：`owner` + `repo`，或 `url`
- `gitee`：`owner` + `repo`，或 `url`
- `branch`：默认 `main`，可改
- `since_days`：仅当没有 `daily_window_local` 时，近 N 天提交
- `local_cache_dir`：仓库本地缓存目录（默认 `./repos/<platform>/<owner>__<repo>`）

---

## 常见问题

**Q: 我只想生成“日报（按人聚合）”而不是每条 commit？**  
A: 建议仍将“每条 commit”写入 Notion，后续在 Notion 建立汇总视图即可。如果确实需要脚本端聚合，可把 `aggregate_daily: true` 打开，脚本会同时在数据库中写入“Daily Summary”类型页面（作为普通 Page 放在一个汇总页面下），示例代码已留好钩子（默认关闭）。

**Q: 统计不准/合并提交遗漏？**  
A: 打开 `include_merges: true` 或者把 `diff_base: "first-parent"` 改为 `"all-parents"`（会更慢）。

**Q: 前后端分类不准确？**  
A: 修改 `config.yaml` 中的 `classify.frontend_globs`/`backend_globs`，支持任意 glob。

---

## 许可
MIT
