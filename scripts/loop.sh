#!/usr/bin/env bash
# Vòng quét: chạy notify.js mỗi 5 phút (vào phút :02, :07, ...) trong khoảng LOOP_MIN phút rồi thoát.
# Workflow tự gọi lại chính nó khi vòng kết thúc, nên không phụ thuộc vào lịch cron của GitHub (hay trễ/bỏ lượt).
LOOP_MIN="${LOOP_MIN:-340}"
END=$(( $(date +%s) + LOOP_MIN * 60 ))
n=0
while :; do
  n=$((n + 1))
  echo "::group::Lượt $n · $(date -u '+%Y-%m-%d %H:%M:%S') UTC"
  LOOP_N=$n node scripts/notify.js || echo "Lượt $n lỗi (mã $?), vẫn tiếp tục"
  echo "::endgroup::"
  # Chỉ lượt đầu mới dùng TEST/FORCE
  unset TEST FORCE
  now=$(date +%s)
  # đợi tới phút kế tiếp có phút % 5 == 2 (giây 10)
  m=$(date -u +%-M); s=$(date -u +%-S)
  wait=$(( ((2 - m) % 5 + 5) % 5 * 60 + 10 - s ))
  [ "$wait" -le 20 ] && wait=$((wait + 300))
  [ $((now + wait)) -ge "$END" ] && break
  sleep "$wait"
done
echo "Kết thúc vòng quét sau $n lượt."
