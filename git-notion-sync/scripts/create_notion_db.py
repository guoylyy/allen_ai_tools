"""
创建 Notion 数据库（放在某个父页面下），并把生成的 database_id 写回 config.yaml。
"""

import os, sys, yaml
from notion_client import Client

SCHEMA = {
  "Name": {"title": {}},
  "Repo": {"select": {}},
  "Platform": {"select": {}},
  "Commit SHA": {"rich_text": {}},
  "Author Name": {"rich_text": {}},
  "Author Email": {"rich_text": {}},
  "Commit Time": {"date": {}},
  "Message": {"rich_text": {}},
  "Files Changed": {"number": {}},
  "Lines Added": {"number": {}},
  "Lines Deleted": {"number": {}},
  "Lines Modified": {"number": {}},
  "FE Files": {"number": {}},
  "FE Added": {"number": {}},
  "FE Deleted": {"number": {}},
  "FE Modified": {"number": {}},
  "BE Files": {"number": {}},
  "BE Added": {"number": {}},
  "BE Deleted": {"number": {}},
  "BE Modified": {"number": {}},
}

def main():
    token = os.environ.get("NOTION_TOKEN")
    if not token:
        print("ERROR: NOTION_TOKEN env required", file=sys.stderr)
        sys.exit(2)

    with open("config.yaml","r",encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    parent_page_id = cfg.get("notion",{}).get("parent_page_id","")
    if not parent_page_id:
        print("ERROR: notion.parent_page_id is empty in config.yaml", file=sys.stderr)
        sys.exit(2)

    notion = Client(auth=token)
    title = [{"text": {"content": "Git Commits"}}]

    db = notion.databases.create(
        parent={"type":"page_id", "page_id": parent_page_id},
        title=title,
        properties=SCHEMA
    )

    dbid = db["id"]
    cfg["notion"]["database_id"] = dbid
    with open("config.yaml","w",encoding="utf-8") as f:
        yaml.safe_dump(cfg, f, allow_unicode=True, sort_keys=False)

    print("Created database:", dbid)

if __name__ == "__main__":
    main()
