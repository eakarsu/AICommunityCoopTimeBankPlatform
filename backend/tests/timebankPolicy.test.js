'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeHours, scoreMatch, assertDisputeTransition } = require('../domain/timebankPolicy');
const { validateRuntime } = require('../config/runtime');

test('time credits use bounded quarter-hour units', () => {
  assert.equal(normalizeHours(1.25), 1.25);
  assert.throws(() => normalizeHours(1.1), /quarter-hour/);
});
test('matching stays within community and excludes self matches', () => {
  assert.equal(scoreMatch({ id: 1, communityId: 1, memberId: 7, skills: ['Tutoring'] }, { id: 2, communityId: 1, memberId: 8, skills: ['tutoring'] }).score, 1);
  assert.equal(scoreMatch({ communityId: 1, memberId: 7, skills: ['x'] }, { communityId: 2, memberId: 8, skills: ['x'] }), null);
});
test('resolved disputes cannot silently reopen', () => assert.throws(() => assertDisputeTransition('resolved', 'open'), /Cannot transition/));
test('runtime rejects weak signing secrets', () => assert.throws(() => validateRuntime({ JWT_SECRET: 'short', DB_NAME: 'test' }), /at least 32/));
