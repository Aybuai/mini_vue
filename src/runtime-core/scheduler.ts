// 存放更新视图任务的队列
const queue: any[] = [];

// 更新视图的开关，只需调用一次即可，避免生成过多 promise
let isFlushPending = false;

// 提取公用部分，减少 promise 的创建
const p = Promise.resolve();

export function nextTick(fn) {
  // 1、当fn存在时，就是把当前的fn插入到微任务中
  // 2、不存在时，就是创建一个微任务
  return fn ? p.then(fn) : p;
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
}
function queueFlush() {
  if (isFlushPending) return;
  // 执行一次后就关闭
  isFlushPending = true;

  nextTick(flushJobs);
}
function flushJobs() {
  // reset
  isFlushPending = false;
  let job: any;

  while ((job = queue.shift())) {
    job && job();
  }
}
