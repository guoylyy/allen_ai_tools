import os
import fnmatch
from pathlib import Path
from datetime import datetime, timedelta
from dateutil import tz
from subprocess import check_output, CalledProcessError, STDOUT
from typing import Dict, Any, List, Tuple

def repo_cache_dir(repo_cfg: Dict[str,Any]) -> Path:
    if repo_cfg.get("local_cache_dir"):
        return Path(repo_cfg["local_cache_dir"])
    platform = repo_cfg["platform"]
    if repo_cfg.get("url"):
        safe = repo_cfg["url"].replace("https://", "").replace("/", "__")
    else:
        safe = f'{repo_cfg["owner"]}__{repo_cfg["repo"]}'
    return Path("repos") / platform / safe

def ensure_repo(repo_cfg: Dict[str,Any]) -> Path:
    """Clone or fetch repo, return local path."""
    path = repo_cache_dir(repo_cfg)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        url = repo_cfg.get("url")
        if not url:
            owner = repo_cfg["owner"]
            repo = repo_cfg["repo"]
            if repo_cfg["platform"] == "github":
                token = os.environ.get("GITHUB_TOKEN", "")
                if token:
                    url = f"https://{token}@github.com/{owner}/{repo}.git"
                else:
                    url = f"https://github.com/{owner}/{repo}.git"
            elif repo_cfg["platform"] == "gitee":
                token = os.environ.get("GITEE_TOKEN", "")
                if token:
                    url = f"https://{token}@gitee.com/{owner}/{repo}.git"
                else:
                    url = f"https://gitee.com/{owner}/{repo}.git"
            else:
                raise ValueError("Unsupported platform: " + repo_cfg["platform"])
        cmd = ["git", "clone", "--no-tags", "--filter=tree:0", url, str(path)]
        run(cmd, cwd=".")
    # fetch
    run(["git", "fetch", "--all", "--prune"], cwd=path)
    return path

def run(cmd, cwd=".") -> str:
    try:
        out = check_output(cmd, cwd=cwd, stderr=STDOUT, text=True)
        return out
    except CalledProcessError as e:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{e.output}")

def iter_commits_in_window(repo_path: Path, branch: str, window: Dict[str,Any], include_merges: bool=False):
    """Yield commits with metadata that fall into [start,end] (aware datetimes in local tz)."""
    # First, get commits on branch with ISO dates
    # Format placeholders: %H sha, %an author name, %ae author email, %cI committer date iso, %s subject, %B body
    fmt = "%H%x1f%an%x1f%ae%x1f%cI%x1f%s%x1f%B%x1e"
    out = run(["git", "log", "--first-parent", f"--format={fmt}", branch], cwd=repo_path)
    records = out.strip("\n").split("\x1e")
    start = window["start_local"]
    end = window["end_local"]

    for rec in records:
        if not rec.strip():
            continue
        parts = rec.split("\x1f")
        sha, an, ae, ciso, subject, body = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
        t = datetime.fromisoformat(ciso.replace("Z","+00:00")).astimezone(start.tzinfo)
        if t < start or t > end:
            continue

        if not include_merges:
            # skip merges (more than one parent)
            parents = run(["git", "rev-list", "--parents", "-n", "1", sha], cwd=repo_path).strip().split()
            if len(parents) > 2:
                continue

        yield {
            "sha": sha,
            "author_name": an,
            "author_email": ae,
            "time": t,
            "subject": subject,
            "message": (subject + "\n\n" + body).strip()
        }

def numstat_for_commit(repo_path: Path, commit: Dict[str,Any], diff_base: str="first-parent") -> List[Tuple[int,int,str]]:
    """Return list of (added, deleted, path) for files in this commit, ignoring binary."""
    sha = commit["sha"]
    # find parent
    parents_line = run(["git", "rev-list", "--parents", "-n", "1", sha], cwd=repo_path).strip()
    parts = parents_line.split()
    if len(parts) == 1:
        parent = None
    else:
        parent = parts[1] if diff_base == "first-parent" else None  # let range handle all-parents

    args = ["git", "diff", "--numstat"]
    if parent:
        args.append(f"{parent}..{sha}")
    else:
        # root commit or all-parents: compare to empty tree
        args.extend(["--root", sha])

    out = run(args, cwd=repo_path)
    results = []
    for line in out.strip().splitlines():
        if not line:
            continue
        a, d, path = line.split("\t", 2)
        if a == "-" or d == "-":
            # binary file; skip
            continue
        results.append((int(a), int(d), path))
    return results

def short_sha(s: str) -> str:
    return s[:8]

def parse_time_window_local(cfg: Dict[str,Any], tzname: str):
    # Defaults: yesterday 00:00:00 to yesterday 23:59:59
    zone = tz.gettz(tzname)
    now = datetime.now(tz=zone)
    if not cfg:
        start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        end = (now - timedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)
        return {"start_local": start, "end_local": end}

    def parse_point(s: str) -> datetime:
        s = s.strip().lower()
        if s.startswith("yesterday"):
            base = now - timedelta(days=1)
            time_part = s.replace("yesterday","").strip()
            if time_part:
                hh, mm, ss = time_part.split(":")
                base = base.replace(hour=int(hh), minute=int(mm), second=int(ss))
            else:
                base = base.replace(hour=0, minute=0, second=0, microsecond=0)
            return base
        elif s.startswith("today"):
            base = now
            time_part = s.replace("today","").strip()
            if time_part:
                hh, mm, ss = time_part.split(":")
                base = base.replace(hour=int(hh), minute=int(mm), second=int(ss))
            else:
                base = base.replace(hour=0, minute=0, second=0, microsecond=0)
            return base
        else:
            # try absolute
            return datetime.fromisoformat(s).replace(tzinfo=zone)

    start = parse_point(cfg.get("from","yesterday 00:00:00"))
    end = parse_point(cfg.get("to","yesterday 23:59:59"))
    return {"start_local": start, "end_local": end}

def classify_file(path: str, classify_cfg: Dict[str,Any]) -> str:
    fe = classify_cfg.get("frontend_globs", [])
    be = classify_cfg.get("backend_globs", [])
    for g in fe:
        if fnmatch.fnmatch(path, g):
            return "frontend"
    for g in be:
        if fnmatch.fnmatch(path, g):
            return "backend"
    return "other"
