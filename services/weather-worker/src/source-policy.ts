export type SourceCommercialUseStatus = 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN';
export type SourceRedistributionStatus =
  | 'ALLOWED'
  | 'ATTRIBUTION_REQUIRED'
  | 'RESTRICTED'
  | 'UNKNOWN';
export type RawPayloadRetentionPolicy =
  | 'ALLOWED'
  | 'ALLOWED_WITH_ATTRIBUTION'
  | 'REFERENCE_ONLY'
  | 'APPROVAL_REQUIRED'
  | 'UNKNOWN';
export type SourceDeploymentUse = 'COMMERCIAL' | 'NON_COMMERCIAL';

export type SourcePolicyRejectionCode =
  | 'COMMERCIAL_USE_BLOCKED'
  | 'REDISTRIBUTION_BLOCKED'
  | 'RAW_RETENTION_BLOCKED';

export interface SourceUsePolicy {
  readonly commercialUseStatus: SourceCommercialUseStatus;
  readonly redistributionStatus: SourceRedistributionStatus;
  readonly rawPayloadRetention: RawPayloadRetentionPolicy;
}

export interface SourcePolicyEvaluation {
  readonly deploymentAllowed: boolean;
  readonly rawRedistributionAllowed: boolean;
  readonly rejectionCodes: readonly SourcePolicyRejectionCode[];
}

export function isDeploymentAllowed(
  policy: Pick<SourceUsePolicy, 'commercialUseStatus'>,
  deploymentUse: SourceDeploymentUse,
): boolean {
  return deploymentUse !== 'COMMERCIAL' || policy.commercialUseStatus === 'ALLOWED';
}

export function canRedistributeRaw(
  policy: Pick<SourceUsePolicy, 'redistributionStatus' | 'rawPayloadRetention'>,
): boolean {
  const redistributionAllowed =
    policy.redistributionStatus === 'ALLOWED' ||
    policy.redistributionStatus === 'ATTRIBUTION_REQUIRED';
  const retentionAllowed =
    policy.rawPayloadRetention === 'ALLOWED' ||
    policy.rawPayloadRetention === 'ALLOWED_WITH_ATTRIBUTION';
  return redistributionAllowed && retentionAllowed;
}

export function evaluateSourcePolicy(
  policy: SourceUsePolicy,
  deploymentUse: SourceDeploymentUse,
): SourcePolicyEvaluation {
  const rejectionCodes: SourcePolicyRejectionCode[] = [];

  if (!isDeploymentAllowed(policy, deploymentUse)) {
    rejectionCodes.push('COMMERCIAL_USE_BLOCKED');
  }
  if (
    policy.redistributionStatus !== 'ALLOWED' &&
    policy.redistributionStatus !== 'ATTRIBUTION_REQUIRED'
  ) {
    rejectionCodes.push('REDISTRIBUTION_BLOCKED');
  }
  if (
    policy.rawPayloadRetention !== 'ALLOWED' &&
    policy.rawPayloadRetention !== 'ALLOWED_WITH_ATTRIBUTION'
  ) {
    rejectionCodes.push('RAW_RETENTION_BLOCKED');
  }

  return {
    deploymentAllowed: isDeploymentAllowed(policy, deploymentUse),
    rawRedistributionAllowed: canRedistributeRaw(policy),
    rejectionCodes,
  };
}
