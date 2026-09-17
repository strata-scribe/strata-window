#!/usr/bin/env python3
import json
import os
import sys
import time
import urllib.request
import urllib.error

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CORPUS_PATH = os.path.join(BASE_DIR, 'data', 'comments_corpus.json')

def main():
    if not os.path.exists(CORPUS_PATH):
        print(f'Error: {CORPUS_PATH} not found', file=sys.stderr)
        sys.exit(1)

    with open(CORPUS_PATH, 'r', encoding='utf-8') as f:
        corpus = json.load(f)

    existing_cids = {c[0] for c in corpus.get('comments', [])}
    existing_pids = {p[0] for p in corpus.get('posts', [])}
    citizens = corpus.get('citizens', {})

    last_ts = corpus['comments'][-1][4] if corpus.get('comments') else 1785955200000
    print(f'Current corpus has {len(corpus["comments"]):,} comments and {len(corpus["posts"]):,} posts.')
    print(f'Starting fetch from timestamp: {last_ts} ({time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime(last_ts / 1000))})')

    since_ts = last_ts
    added_comments = 0
    added_posts = 0
    page = 0

    while True:
        page += 1
        url = f'https://1f916.ai/api/changes?since={since_ts}'
        req = urllib.request.Request(url, headers={'User-Agent': 'strata-window/1.0'})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.load(resp)
        except Exception as e:
            print(f'Page {page} fetch error: {e}', file=sys.stderr)
            time.sleep(2)
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = json.load(resp)
            except Exception as e2:
                print(f'Page {page} retry failed: {e2}. Stopping batch.', file=sys.stderr)
                break

        posts = data.get('posts', [])
        comments = data.get('comments', [])

        for p in posts:
            pid = p.get('id')
            if pid and pid not in existing_pids:
                author = p.get('author') or 'unknown'
                created = p.get('created_at') or since_ts
                title = p.get('title') or ''
                karma = p.get('karma') or 0
                corpus['posts'].append([pid, author, created, title, '', karma])
                existing_pids.add(pid)
                added_posts += 1
                if author not in citizens:
                    citizens[author] = {'m': p.get('author_model') or 'unknown'}

        for c in comments:
            cid = c.get('id')
            if cid and cid not in existing_cids:
                pid = c.get('post_id') or 0
                parent_id = c.get('parent_id') or 0
                author = c.get('author') or 'unknown'
                created = c.get('created_at') or since_ts
                karma = c.get('karma') or 0
                corpus['comments'].append([cid, pid, parent_id, author, created, 0, karma, ''])
                existing_cids.add(cid)
                added_comments += 1
                if author not in citizens:
                    citizens[author] = {'m': c.get('author_model') or 'unknown'}

        if comments:
            new_last_ts = comments[-1]['created_at']
            if new_last_ts > since_ts:
                since_ts = new_last_ts
            else:
                since_ts += 1
        elif posts:
            new_last_ts = posts[-1]['created_at']
            if new_last_ts > since_ts:
                since_ts = new_last_ts
            else:
                since_ts += 1
        else:
            break

        print(f'Page {page:2d}: +{len(comments)} comments, +{len(posts)} posts (Total added: {added_comments:,} c, {added_posts:,} p). Current date: {time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime(since_ts / 1000))}')

        if not data.get('has_more') or (len(comments) == 0 and len(posts) == 0):
            break

        time.sleep(0.2)

    corpus['max_comment_id'] = max(existing_cids) if existing_cids else 0
    corpus['max_post_id'] = max(existing_pids) if existing_pids else 0
    corpus['built_at'] = int(time.time() * 1000)

    print(f'Final corpus: {len(corpus["comments"]):,} comments (+{added_comments:,}), {len(corpus["posts"]):,} posts (+{added_posts:,}).')
    with open(CORPUS_PATH, 'w', encoding='utf-8') as f:
        json.dump(corpus, f)
    print(f'Saved updated corpus to {CORPUS_PATH}.')

if __name__ == '__main__':
    main()
