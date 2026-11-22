import test from "node:test";
import assert from "node:assert/strict";
import { loadTypeScript } from "./helpers/load-typescript.mjs";

const { isAuthDisabled, isValidatorVotingEnabled } = loadTypeScript("src/lib/featureFlags.ts");

test("validator voting is off by default", () => {
  const previousVoting = process.env.BE_VALIDATOR_VOTING_ENABLED;
  const previousAuth = process.env.DISABLE_AUTH;
  try {
    delete process.env.BE_VALIDATOR_VOTING_ENABLED;
    process.env.DISABLE_AUTH = "false";
    assert.equal(isValidatorVotingEnabled(), false);
  } finally {
    if (previousVoting === undefined) delete process.env.BE_VALIDATOR_VOTING_ENABLED;
    else process.env.BE_VALIDATOR_VOTING_ENABLED = previousVoting;
    if (previousAuth === undefined) delete process.env.DISABLE_AUTH;
    else process.env.DISABLE_AUTH = previousAuth;
  }
});

test("validator voting cannot be enabled while authentication is disabled", () => {
  const previousVoting = process.env.BE_VALIDATOR_VOTING_ENABLED;
  const previousAuth = process.env.DISABLE_AUTH;
  try {
    process.env.BE_VALIDATOR_VOTING_ENABLED = "true";
    process.env.DISABLE_AUTH = "true";
    assert.equal(isAuthDisabled(), true);
    assert.equal(isValidatorVotingEnabled(), false);
  } finally {
    if (previousVoting === undefined) delete process.env.BE_VALIDATOR_VOTING_ENABLED;
    else process.env.BE_VALIDATOR_VOTING_ENABLED = previousVoting;
    if (previousAuth === undefined) delete process.env.DISABLE_AUTH;
    else process.env.DISABLE_AUTH = previousAuth;
  }
});

test("validator voting requires an explicit opt-in and active authentication", () => {
  const previousVoting = process.env.BE_VALIDATOR_VOTING_ENABLED;
  const previousAuth = process.env.DISABLE_AUTH;
  try {
    process.env.BE_VALIDATOR_VOTING_ENABLED = "true";
    process.env.DISABLE_AUTH = "false";
    assert.equal(isValidatorVotingEnabled(), true);
  } finally {
    if (previousVoting === undefined) delete process.env.BE_VALIDATOR_VOTING_ENABLED;
    else process.env.BE_VALIDATOR_VOTING_ENABLED = previousVoting;
    if (previousAuth === undefined) delete process.env.DISABLE_AUTH;
    else process.env.DISABLE_AUTH = previousAuth;
  }
});
