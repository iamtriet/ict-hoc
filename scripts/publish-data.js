/* Đăng file dữ liệu nhỏ (ví dụ lịch tin) lên nhánh "data" của chính kho này để trang web đọc qua raw.githubusercontent.com (có CORS).
   Chỉ chạy trong GitHub Actions (cần GITHUB_TOKEN có quyền contents: write và GITHUB_REPOSITORY). Mỗi lần ghi đè nhánh bằng một commit duy nhất. */
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
module.exports = function publish(files) {
  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) return false;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ictdata-')), clean = (m) => String(m).split(token).join('***');
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], env: Object.assign({}, process.env, { GIT_TERMINAL_PROMPT: '0' }) });
  try {
    git('init', '-q'); git('checkout', '-q', '-b', 'data');
    Object.keys(files).forEach((f) => fs.writeFileSync(path.join(dir, f), files[f]));
    git('add', '-A'); git('-c', 'user.name=ict-bot', '-c', 'user.email=ict-bot@users.noreply.github.com', 'commit', '-q', '-m', 'data ' + new Date().toISOString());
    git('push', '-q', '-f', 'https://x-access-token:' + token + '@github.com/' + repo + '.git', 'data:data');
    return true;
  } catch (e) { throw new Error('đăng nhánh data lỗi: ' + clean(e.stderr || e.message).trim().slice(0, 200)); } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* bỏ qua */ } }
};
