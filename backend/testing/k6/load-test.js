import http from 'k6/http';
import { check, sleep } from 'k6';

/*export const options = {
  vus: 500,          // 100 virtual users (concurrent)
  duration: '30s',   // durasi test 30 detik
};
*/

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // longgarkan dulu ke 1 detik
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://ticket.biz.id');

  check(res, {
    'status 200': (r) => r.status === 200,
    'response < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // jeda 1 detik antar request per user
}