/**
 * autopush.js
 * index.html 저장 시 자동으로 git commit + push
 * 실행: node autopush.js
 * 종료: Ctrl+C
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FILE   = path.join(__dirname, 'index.html');
const DELAY  = 1500; // 저장 후 1.5초 대기 (연속 저장 방지)

let timer = null;

function timestamp() {
  return new Date().toLocaleString('ko-KR', { hour12: false });
}

function autoPush() {
  try {
    // 변경 사항 있는지 확인
    const status = execSync('git status --porcelain', { cwd: __dirname }).toString().trim();
    if (!status) {
      console.log(`[${timestamp()}] 변경 없음 — 스킵`);
      return;
    }

    console.log(`[${timestamp()}] 변경 감지 → 커밋 & 푸시 중...`);

    const msg = `Auto-update ${new Date().toLocaleString('ko-KR', { hour12: false })}`;
    execSync(`git add index.html`,            { cwd: __dirname, stdio: 'inherit' });
    execSync(`git commit -m "${msg}"`,        { cwd: __dirname, stdio: 'inherit' });
    execSync(`git push`,                      { cwd: __dirname, stdio: 'inherit' });

    console.log(`[${timestamp()}] ✓ 배포 완료 → https://wsjryan.github.io/proj1-flipclock/\n`);
  } catch (err) {
    console.error(`[${timestamp()}] ✗ 오류:`, err.message);
  }
}

// index.html 감시 시작
fs.watch(FILE, (event) => {
  if (event !== 'change') return;
  clearTimeout(timer);
  timer = setTimeout(autoPush, DELAY);
});

console.log(`====================================`);
console.log(` autopush 실행 중`);
console.log(` 감시 파일: index.html`);
console.log(` 종료: Ctrl+C`);
console.log(`====================================\n`);
