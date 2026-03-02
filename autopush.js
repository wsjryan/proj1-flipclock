/**
 * autopush.js
 * 폴더 내 파일 변경/추가 시 자동으로 git commit + push
 * 실행: node autopush.js
 * 종료: Ctrl+C
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR   = __dirname;
const DELAY = 1500; // 저장 후 1.5초 대기 (연속 저장 방지)

let timer = null;
const watchers = new Map(); // 파일별 watcher 관리

function timestamp() {
  return new Date().toLocaleString('ko-KR', { hour12: false });
}

function scheduleAutoPush() {
  clearTimeout(timer);
  timer = setTimeout(autoPush, DELAY);
}

function autoPush() {
  try {
    const status = execSync('git status --porcelain', { cwd: DIR }).toString().trim();
    if (!status) return; // 변경 없으면 조용히 스킵

    // 변경된 파일 목록 출력
    const changed = status.split('\n').map(l => l.slice(3).trim()).join(', ');
    console.log(`[${timestamp()}] 변경: ${changed}`);
    console.log(`[${timestamp()}] 커밋 & 푸시 중...`);

    const msg = `Auto-update ${new Date().toLocaleString('ko-KR', { hour12: false })}`;
    execSync('git add -A',             { cwd: DIR, stdio: 'inherit' });
    execSync(`git commit -m "${msg}"`, { cwd: DIR, stdio: 'inherit' });
    execSync('git push',               { cwd: DIR, stdio: 'inherit' });

    console.log(`[${timestamp()}] ✓ 완료 → https://wsjryan.github.io/proj1-flipclock/\n`);
  } catch (err) {
    console.error(`[${timestamp()}] ✗ 오류:`, err.message);
  }
}

function startWatchingFile(filepath) {
  if (watchers.has(filepath)) return; // 이미 감시 중
  const name = path.basename(filepath);
  try {
    const w = fs.watch(filepath, (event) => {
      if (event === 'change') scheduleAutoPush();
    });
    watchers.set(filepath, w);
    console.log(`[감시 추가] ${name}`);
  } catch (_) {}
}

function stopWatchingFile(filepath) {
  if (!watchers.has(filepath)) return;
  watchers.get(filepath).close();
  watchers.delete(filepath);
  console.log(`[감시 제거] ${path.basename(filepath)}`);
}

// ── 폴더 감시: 새 파일 추가/삭제 감지 ──
fs.watch(DIR, (event, filename) => {
  if (!filename || filename.startsWith('.')) return; // .git 등 숨김 무시
  const filepath = path.join(DIR, filename);

  if (fs.existsSync(filepath) && fs.statSync(filepath).isFile()) {
    startWatchingFile(filepath); // 새 파일 → 감시 시작
    scheduleAutoPush();
  } else {
    stopWatchingFile(filepath);  // 삭제된 파일 → 감시 종료
    scheduleAutoPush();
  }
});

// ── 기존 파일 감시 시작 ──
fs.readdirSync(DIR)
  .filter(f => !f.startsWith('.') && fs.statSync(path.join(DIR, f)).isFile())
  .forEach(f => startWatchingFile(path.join(DIR, f)));

console.log(`====================================`);
console.log(` autopush 실행 중`);
console.log(` 감시 대상: 폴더 전체 (새 파일 자동 감지)`);
console.log(` 종료: Ctrl+C`);
console.log(`====================================\n`);
