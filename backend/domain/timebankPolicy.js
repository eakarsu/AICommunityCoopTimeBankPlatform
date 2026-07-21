'use strict';

const MEMBER_ROLES = new Set(['member', 'steward', 'admin']);
const DISPUTE_TRANSITIONS = Object.freeze({ open: ['mediation', 'withdrawn'], mediation: ['resolved', 'open'], resolved: [], withdrawn: [] });

function requireRole(actual, allowed) {
  if (!MEMBER_ROLES.has(actual) || !allowed.includes(actual)) throw Object.assign(new Error('Role is not permitted'), { statusCode: 403 });
}

function normalizeHours(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24 || Math.round(hours * 4) !== hours * 4) {
    throw Object.assign(new Error('Hours must be 0.25 to 24 in quarter-hour increments'), { statusCode: 400 });
  }
  return hours;
}

function scoreMatch(offer, request) {
  if (offer.communityId !== request.communityId || offer.memberId === request.memberId) return null;
  const offered = new Set((offer.skills || []).map((v) => String(v).toLowerCase()));
  const requested = (request.skills || []).map((v) => String(v).toLowerCase());
  const overlap = requested.filter((v) => offered.has(v));
  if (!overlap.length) return null;
  return { offerId: offer.id, requestId: request.id, overlap, score: overlap.length / Math.max(requested.length, 1) };
}

function assertDisputeTransition(from, to) {
  if (!(DISPUTE_TRANSITIONS[from] || []).includes(to)) throw Object.assign(new Error(`Cannot transition dispute from ${from} to ${to}`), { statusCode: 409 });
}

module.exports = { requireRole, normalizeHours, scoreMatch, assertDisputeTransition };
