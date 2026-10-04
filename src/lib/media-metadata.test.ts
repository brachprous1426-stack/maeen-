import { test } from 'node:test';
import assert from 'node:assert/strict';
import { youtubeDuration } from './media-metadata';
test('duration belongs to the linked video, never recommended videos', () => {
  const html = '"lengthSeconds":"9999"; var player = {"videoDetails":' + JSON.stringify({ videoId: 'abcdefghijk', title: 'Title { "quoted" }', thumbnail: { items: [] }, lengthSeconds: '125' }) + '};';
  assert.equal(youtubeDuration(html, 'abcdefghijk'), 125);
  assert.throws(() => youtubeDuration(html, 'other-video'));
});
test('unavailable and live videos are not counted as completed durations', () => {
  assert.throws(() => youtubeDuration('"videoDetails":{"videoId":"a","lengthSeconds":"0"}', 'a'));
  assert.throws(() => youtubeDuration('"videoDetails":{"videoId":"a","lengthSeconds":"120","isLive":true}', 'a'));
  assert.throws(() => youtubeDuration('sign in required', 'a'));
});
