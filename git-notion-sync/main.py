import os
import sys
import json
import yaml
import fnmatch
from pathlib import Path
from datetime import datetime, timedelta
from dateutil import tz, parser as dateparser
from typing import Dict, Any, List, Tuple
from subprocess import check_output, CalledProcessError, STDOUT
from notion_client import Client as NotionClient
from tenacity import retry, stop_after_attempt, wait_exponential
from utils import ensure_repo, iter_commits_in_window, numstat_for_commit, short_sha, repo_cache_dir
from utils import parse_time_window_local, classify_file

STATE_FILE = Path("state.json")

def load_state() -> Dict[str, Any]:
    if STATE_FILE.exists():
        state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        print(f"Loaded state with {len(state.get('inserted', {}))} repos tracked")
        return state
    print("No existing state file found, starting fresh")
    return {"inserted": {}}

def save_state(state: Dict[str, Any]):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

def notion_upsert_commit(notion: NotionClient, database_id: str, repo_key: str, commit_payload: Dict[str, Any], state: Dict[str, Any]):
    # Ensure inserted is always a set for deduplication
    if repo_key not in state["inserted"]:
        state["inserted"][repo_key] = set()
    
    inserted = state["inserted"][repo_key]
    
    # Handle case where inserted might be a list (from JSON)
    if isinstance(inserted, list):
        inserted = set(inserted)
        state["inserted"][repo_key] = inserted

    unique_key = commit_payload["commit_sha"]
    if unique_key in inserted:
        print(f"Skipping duplicate commit: {unique_key}")
        return

    title = f'{commit_payload["repo"]}:{commit_payload["short_sha"]} — {commit_payload["subject"][:70]}'

    props = {
        "Name": {"title": [{"text": {"content": title}}]},
        "Repo": {"select": {"name": commit_payload["repo"]}},
        "Platform": {"select": {"name": commit_payload["platform"]}},
        "Commit SHA": {"rich_text": [{"text": {"content": commit_payload["commit_sha"]}}]},
        "Author Name": {"rich_text": [{"text": {"content": commit_payload["author_name"]}}]},
        "Author Email": {"rich_text": [{"text": {"content": commit_payload["author_email"]}}]},
        "Commit Time": {"date": {"start": commit_payload["commit_time_iso"]}},
        "Message": {"rich_text": [{"text": {"content": commit_payload["message"][:1990]}}]},
        "Files Changed": {"number": commit_payload["files_changed"]},
        "Lines Added": {"number": commit_payload["lines_added"]},
        "Lines Deleted": {"number": commit_payload["lines_deleted"]},
        "Lines Modified": {"number": commit_payload["lines_modified"]},
        "FE Files": {"number": commit_payload["fe_files"]},
        "FE Added": {"number": commit_payload["fe_added"]},
        "FE Deleted": {"number": commit_payload["fe_deleted"]},
        "FE Modified": {"number": commit_payload["fe_modified"]},
        "BE Files": {"number": commit_payload["be_files"]},
        "BE Added": {"number": commit_payload["be_added"]},
        "BE Deleted": {"number": commit_payload["be_deleted"]},
        "BE Modified": {"number": commit_payload["be_modified"]},
    }

    notion.pages.create(parent={"database_id": database_id}, properties=props)
    inserted.add(unique_key)

def load_config():
    with open("config.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def main():
    cfg = load_config()
    tzname = cfg.get("timezone", "Europe/Berlin")
    include_merges = cfg.get("time", {}).get("include_merges", False)
    diff_base = cfg.get("time", {}).get("diff_base", "first-parent")
    window = parse_time_window_local(cfg.get("time", {}).get("daily_window_local", {}), tzname)

    notion_token = os.environ.get("NOTION_TOKEN")
    if not notion_token:
        print("ERROR: NOTION_TOKEN env is required", file=sys.stderr)
        sys.exit(2)

    database_id = cfg.get("notion", {}).get("database_id", "")
    if not database_id:
        print("ERROR: notion.database_id is empty. You can run scripts/create_notion_db.py first.", file=sys.stderr)
        sys.exit(2)

    notion = NotionClient(auth=notion_token)

    state = load_state()

    for repo_cfg in cfg.get("repos", []):
        platform = repo_cfg["platform"]
        name = f'{repo_cfg.get("owner","")}/{repo_cfg.get("repo","")}' if not repo_cfg.get("url") else repo_cfg["url"]
        repo_path = ensure_repo(repo_cfg)
        repo_key = f'{platform}:{name}'

        print(f"Processing {repo_key} at {repo_path}")

        for c in iter_commits_in_window(repo_path, repo_cfg.get("branch","main"), window, include_merges=include_merges):
            # compute per-file numstat
            files = numstat_for_commit(repo_path, c, diff_base=diff_base)

            fe_files = fe_added = fe_deleted = fe_modified = 0
            be_files = be_added = be_deleted = be_modified = 0
            files_changed = len(files)
            lines_added = lines_deleted = lines_modified = 0

            for added, deleted, path in files:
                modified = min(added, deleted)
                lines_added += added
                lines_deleted += deleted
                lines_modified += modified

                kind = classify_file(path, cfg.get("classify", {}))
                if kind == "frontend":
                    fe_files += 1
                    fe_added += added
                    fe_deleted += deleted
                    fe_modified += modified
                elif kind == "backend":
                    be_files += 1
                    be_added += added
                    be_deleted += deleted
                    be_modified += modified
                else:
                    # 未分类的就不计入 FE/BE
                    pass

            payload = {
                "platform": platform.capitalize(),
                "repo": name if repo_cfg.get("url") else f'{repo_cfg["owner"]}/{repo_cfg["repo"]}',
                "commit_sha": c["sha"],
                "short_sha": short_sha(c["sha"]),
                "subject": c["subject"],
                "message": c["message"],
                "author_name": c["author_name"],
                "author_email": c["author_email"],
                "commit_time_iso": c["time"].isoformat(),
                "files_changed": files_changed,
                "lines_added": lines_added,
                "lines_deleted": lines_deleted,
                "lines_modified": lines_modified,
                "fe_files": fe_files,
                "fe_added": fe_added,
                "fe_deleted": fe_deleted,
                "fe_modified": fe_modified,
                "be_files": be_files,
                "be_added": be_added,
                "be_deleted": be_deleted,
                "be_modified": be_modified,
            }

            # upsert to notion (idempotent via local state)
            notion_upsert_commit(notion, database_id, repo_key, payload, state)

    # convert sets to lists for json
    state["inserted"] = {k: sorted(list(v)) for k, v in state.get("inserted", {}).items()}
    save_state(state)

if __name__ == "__main__":
    main()
