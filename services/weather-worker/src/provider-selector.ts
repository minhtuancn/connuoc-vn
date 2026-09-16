import type {
  CommercialUseStatus,
  ProviderCapability,
  ProviderHealthState,
  ProviderSelectionRequest,
} from '@connuoc/shared-types';

export type ProviderRejectionCode =
  | 'DISABLED'
  | 'CAPABILITY_UNSUPPORTED'
  | 'OUTSIDE_COVERAGE'
  | 'LICENCE_BLOCKED'
  | 'HEALTH_BLOCKED'
  | 'QUOTA_BLOCKED'
  | 'BUDGET_BLOCKED'
  | 'NOT_EFFECTIVE';

export interface SelectableProviderConfig {
  readonly providerId: string;
  readonly providerKey: string;
  readonly enabled: boolean;
  readonly priority: number;
  readonly weight: number;
  readonly capabilities: readonly ProviderCapability[];
  /** Result of the repository/spatial layer for the request point. */
  readonly coversLocation: boolean;
  readonly commercialUseStatus: CommercialUseStatus;
  readonly healthState: ProviderHealthState;
  readonly healthBlocksSelection: boolean;
  readonly quotaAvailable: boolean;
  readonly budgetAvailable: boolean;
  /** Inclusive UTC instant. Null means no lower bound. */
  readonly effectiveFromUtc: string | null;
  /** Exclusive UTC instant. Null means no upper bound. */
  readonly effectiveToUtc: string | null;
}

export interface ProviderCandidateDecision {
  readonly providerId: string;
  readonly accepted: boolean;
  readonly rejectionCodes: readonly ProviderRejectionCode[];
}

export interface ProviderSelectionResult {
  readonly selectedProviderId: string | null;
  readonly candidates: readonly ProviderCandidateDecision[];
}

function isEffective(config: SelectableProviderConfig, atUtc: string): boolean {
  const at = Date.parse(atUtc);
  if (config.effectiveFromUtc !== null && at < Date.parse(config.effectiveFromUtc)) return false;
  if (config.effectiveToUtc !== null && at >= Date.parse(config.effectiveToUtc)) return false;
  return true;
}

function rejectionCodes(
  config: SelectableProviderConfig,
  request: ProviderSelectionRequest,
): ProviderRejectionCode[] {
  const reasons: ProviderRejectionCode[] = [];

  if (!config.enabled) reasons.push('DISABLED');
  if (!config.capabilities.includes(request.capability)) reasons.push('CAPABILITY_UNSUPPORTED');
  if (!config.coversLocation) reasons.push('OUTSIDE_COVERAGE');
  if (
    request.deploymentUse === 'COMMERCIAL' &&
    config.commercialUseStatus !== 'ALLOWED'
  ) {
    reasons.push('LICENCE_BLOCKED');
  }
  if (config.healthBlocksSelection && config.healthState !== 'HEALTHY') {
    reasons.push('HEALTH_BLOCKED');
  }
  if (!config.quotaAvailable) reasons.push('QUOTA_BLOCKED');
  if (!config.budgetAvailable) reasons.push('BUDGET_BLOCKED');
  if (!isEffective(config, request.atUtc)) reasons.push('NOT_EFFECTIVE');

  return reasons;
}

function rankProviders(
  left: SelectableProviderConfig,
  right: SelectableProviderConfig,
): number {
  if (left.priority !== right.priority) return right.priority - left.priority;
  if (left.weight !== right.weight) return right.weight - left.weight;
  return left.providerKey.localeCompare(right.providerKey, 'en');
}

export function selectProvider(
  configs: readonly SelectableProviderConfig[],
  request: ProviderSelectionRequest,
): ProviderSelectionResult {
  const ranked = [...configs].sort(rankProviders);
  const candidates = ranked.map<ProviderCandidateDecision>((config) => {
    const reasons = rejectionCodes(config, request);
    return {
      providerId: config.providerId,
      accepted: reasons.length === 0,
      rejectionCodes: reasons,
    };
  });

  return {
    selectedProviderId: candidates.find((candidate) => candidate.accepted)?.providerId ?? null,
    candidates,
  };
}
