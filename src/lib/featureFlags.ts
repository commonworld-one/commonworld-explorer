export function isAuthDisabled(): boolean {
  return process.env.DISABLE_AUTH === "true";
}

// Validator votes mutate consensus state. Require both an explicit opt-in and
// authenticated sessions so DISABLE_AUTH can never expose voting publicly.
export function isValidatorVotingEnabled(): boolean {
  return process.env.BE_VALIDATOR_VOTING_ENABLED === "true" && !isAuthDisabled();
}
