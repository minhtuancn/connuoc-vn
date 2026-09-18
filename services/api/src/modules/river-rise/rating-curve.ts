import {
  RatingCurveDefinitionSchema,
  StageDerivationResultSchema,
  type RatingCurveDefinition,
  type StageDerivationResult,
} from '@connuoc/shared-types';

export interface RatingCurveEvaluationInput {
  readonly dischargeCms: number;
  readonly requiredDatumId: string;
}

function insufficient(
  curve: RatingCurveDefinition | null,
  input: RatingCurveEvaluationInput,
  reason:
    | 'DATUM_MISMATCH'
    | 'BELOW_CALIBRATED_DOMAIN'
    | 'ABOVE_CALIBRATED_DOMAIN'
    | 'INVALID_CURVE',
  limitation: string,
): StageDerivationResult {
  return StageDerivationResultSchema.parse({
    state: 'INSUFFICIENT_DATA',
    reason,
    dischargeCms:
      Number.isFinite(input.dischargeCms) && input.dischargeCms >= 0
        ? input.dischargeCms
        : null,
    requiredDatumId:
      input.requiredDatumId.trim().length > 0
        ? input.requiredDatumId
        : null,
    availableDatumId: curve?.datumId ?? null,
    calibrationId: curve?.id ?? null,
    limitations: [limitation],
  });
}

export function deriveStageFromRatingCurve(
  rawCurve: RatingCurveDefinition,
  input: RatingCurveEvaluationInput,
): StageDerivationResult {
  const parsed = RatingCurveDefinitionSchema.safeParse(rawCurve);
  if (!parsed.success) {
    return insufficient(
      null,
      input,
      'INVALID_CURVE',
      'Rating curve failed structural validation.',
    );
  }

  const curve = parsed.data;
  if (
    curve.status !== 'ACTIVE' ||
    curve.validation === null ||
    curve.calibrationRunId === null
  ) {
    return insufficient(
      curve,
      input,
      'INVALID_CURVE',
      'Rating curve is not an active validated calibration.',
    );
  }

  if (
    !Number.isFinite(input.dischargeCms) ||
    input.dischargeCms < 0 ||
    input.requiredDatumId.trim().length === 0
  ) {
    return insufficient(
      curve,
      input,
      'INVALID_CURVE',
      'Rating-curve input is invalid.',
    );
  }

  if (input.requiredDatumId !== curve.datumId) {
    return insufficient(
      curve,
      input,
      'DATUM_MISMATCH',
      'Stage datum is incompatible with the requested vertical reference.',
    );
  }

  const first = curve.points[0]!;
  const last = curve.points[curve.points.length - 1]!;

  if (input.dischargeCms < first.dischargeCms) {
    return insufficient(
      curve,
      input,
      'BELOW_CALIBRATED_DOMAIN',
      'No extrapolation below the calibrated discharge domain.',
    );
  }

  if (input.dischargeCms > last.dischargeCms) {
    return insufficient(
      curve,
      input,
      'ABOVE_CALIBRATED_DOMAIN',
      'No extrapolation above the calibrated discharge domain.',
    );
  }

  const exact = curve.points.find(
    (point) => point.dischargeCms === input.dischargeCms,
  );
  if (exact) {
    return StageDerivationResultSchema.parse({
      state: 'AVAILABLE',
      dischargeCms: input.dischargeCms,
      stageM: exact.stageM,
      stageUnit: 'm',
      datumId: curve.datumId,
      calibrationId: curve.id,
      calibrationVersion: curve.version,
      domainStatus: 'BOUNDARY',
      uncertaintyM: curve.validation.rmseM,
      limitations: [],
    });
  }

  for (let index = 1; index < curve.points.length; index += 1) {
    const lower = curve.points[index - 1]!;
    const upper = curve.points[index]!;
    if (
      input.dischargeCms > lower.dischargeCms &&
      input.dischargeCms < upper.dischargeCms
    ) {
      const fraction =
        (input.dischargeCms - lower.dischargeCms) /
        (upper.dischargeCms - lower.dischargeCms);
      const stageM =
        lower.stageM + fraction * (upper.stageM - lower.stageM);

      return StageDerivationResultSchema.parse({
        state: 'AVAILABLE',
        dischargeCms: input.dischargeCms,
        stageM: Number(stageM.toFixed(12)),
        stageUnit: 'm',
        datumId: curve.datumId,
        calibrationId: curve.id,
        calibrationVersion: curve.version,
        domainStatus: 'INTERPOLATED',
        uncertaintyM: curve.validation.rmseM,
        limitations: [],
      });
    }
  }

  return insufficient(
    curve,
    input,
    'INVALID_CURVE',
    'No calibrated rating-curve segment contains this discharge.',
  );
}
