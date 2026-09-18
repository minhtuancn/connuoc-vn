import {
  StageForecastPointSchema,
  evaluateRatingCurve,
  type RiverRiseDirection,
  type StageEvidenceStatus,
  type StageForecastPoint,
} from '@connuoc/shared-types';

import type {
  HydrologyService,
  RiverForecastResponse,
} from '../hydrology/hydrology.service.js';
import type { HydrologyRepository } from '../hydrology/hydrology.repository.js';
import type {
  ActiveRatingCurveEvidence,
  CalibrationRepository,
} from './calibration.repository.js';
import type { StageForecastRepository } from './stage-forecast.repository.js';

export interface StageForecastResponse {
  readonly reachId: string;
  readonly discharge: RiverForecastResponse;
  readonly stage: {
    readonly status: StageEvidenceStatus;
    readonly stationId: string | null;
    readonly datumId: string | null;
    readonly unit: 'm';
    readonly direction: RiverRiseDirection;
    readonly baseline: {
      readonly kind: 'OBSERVED' | 'FIRST_FORECAST';
      readonly stageM: number;
      readonly validAt: string;
      readonly datumId: string;
    } | null;
    readonly deltaToLastM: number | null;
    readonly deltas: readonly {
      readonly validAt: string;
      readonly leadSeconds: number;
      readonly deltaM: number;
    }[];
    readonly peak: {
      readonly stageM: number;
      readonly validAt: string;
    } | null;
    readonly curve: {
      readonly id: string;
      readonly version: string;
      readonly method: 'PIECEWISE_LINEAR';
      readonly validDischargeMinCms: number;
      readonly validDischargeMaxCms: number;
      readonly extrapolationPolicy: 'REJECT';
    } | null;
    readonly calibration: {
      readonly id: string;
      readonly version: string;
      readonly modelKind: string;
      readonly modelVersion: string;
      readonly featureVersion: string;
      readonly sourceIds: readonly string[];
      readonly testPeriod: {
        readonly start: string;
        readonly end: string;
      } | null;
      readonly testMetrics: {
        readonly maeM: number;
        readonly rmseM: number;
        readonly sampleCount: number;
      } | null;
      readonly acceptedTestRmseM: number | null;
    } | null;
    readonly uncertainty: {
      readonly basis: 'HELD_OUT_TEST';
      readonly maeM: number;
      readonly rmseM: number;
      readonly sampleCount: number;
    } | null;
    readonly points: readonly StageForecastPoint[];
    readonly limitations: readonly string[];
  };
}

export interface StationCalibrationResponse {
  readonly stationId: string;
  readonly status: 'ACTIVE' | 'INSUFFICIENT_DATA';
  readonly reachId: string | null;
  readonly datumId: string | null;
  readonly curve: StageForecastResponse['stage']['curve'];
  readonly calibration: StageForecastResponse['stage']['calibration'];
  readonly limitations: readonly string[];
}

interface HydrologyServicePort {
  getForecast(
    riverReachId: string,
    days: number,
  ): ReturnType<HydrologyService['getForecast']>;
}

interface HydrologyRepositoryPort {
  findForecastRunIdForRecord:
    HydrologyRepository['findForecastRunIdForRecord'];
}

interface CalibrationRepositoryPort {
  findActiveCurveForReach:
    CalibrationRepository['findActiveCurveForReach'];
  findActiveCurveForStation:
    CalibrationRepository['findActiveCurveForStation'];
  findLatestObservedStage:
    CalibrationRepository['findLatestObservedStage'];
}

interface StageForecastRepositoryPort {
  save: StageForecastRepository['save'];
}

function publicCurve(active: ActiveRatingCurveEvidence) {
  return {
    id: active.curve.id,
    version: active.curve.version,
    method: active.curve.method,
    validDischargeMinCms: active.curve.validDischargeMinCms,
    validDischargeMaxCms: active.curve.validDischargeMaxCms,
    extrapolationPolicy: active.curve.extrapolationPolicy,
  };
}

function publicCalibration(active: ActiveRatingCurveEvidence) {
  return {
    id: active.calibration.id,
    version: active.calibration.version,
    modelKind: active.calibration.modelKind,
    modelVersion: active.calibration.modelVersion,
    featureVersion: active.calibration.featureVersion,
    sourceIds: active.calibration.sourceIds,
    testPeriod: active.calibration.testPeriod,
    testMetrics: active.calibration.testMetrics,
    acceptedTestRmseM: active.calibration.acceptedTestRmseM,
  };
}

function direction(
  baselineStageM: number,
  lastStageM: number,
): RiverRiseDirection {
  if (lastStageM > baselineStageM) return 'RISING';
  if (lastStageM < baselineStageM) return 'FALLING';
  return 'STABLE';
}

export class StageForecastService {
  constructor(
    private readonly hydrologyService: HydrologyServicePort,
    private readonly hydrologyRepository: HydrologyRepositoryPort,
    private readonly calibrationRepository: CalibrationRepositoryPort,
    private readonly stageRepository: StageForecastRepositoryPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getForecast(
    riverReachId: string,
    days: number,
  ): Promise<StageForecastResponse> {
    const now = this.now();
    if (!Number.isFinite(now.getTime())) {
      throw new RangeError('now must be a valid Date');
    }
    const generatedAt = now.toISOString();
    const discharge =
      await this.hydrologyService.getForecast(riverReachId, days);
    const active =
      await this.calibrationRepository.findActiveCurveForReach(
        riverReachId,
        generatedAt,
      );

    if (!active) {
      return this.insufficient(
        riverReachId,
        discharge,
        ['NO_ACTIVE_VALIDATED_CALIBRATION'],
      );
    }

    const testMetrics = active.calibration.testMetrics;
    if (
      testMetrics === null ||
      active.calibration.testPeriod === null ||
      active.calibration.acceptedTestRmseM === null
    ) {
      return this.insufficient(
        riverReachId,
        discharge,
        ['CALIBRATION_HELD_OUT_EVIDENCE_UNAVAILABLE'],
        active,
      );
    }

    const meanRecords = discharge.records
      .filter(
        (record) =>
          record.productKind === 'FORECAST_MEAN' &&
          record.leadSeconds !== null,
      )
      .sort(
        (left, right) =>
          Date.parse(left.validAt) - Date.parse(right.validAt),
      );
    if (meanRecords.length === 0) {
      return this.insufficient(
        riverReachId,
        discharge,
        ['DISCHARGE_FORECAST_MEAN_UNAVAILABLE'],
        active,
      );
    }

    const firstMean = meanRecords[0]!;
    const inputHydrologyRunId =
      await this.hydrologyRepository.findForecastRunIdForRecord({
        riverReachPublicId: riverReachId,
        externalRecordId: firstMean.id,
        sourceId: firstMean.source.sourceId,
        productId: firstMean.source.productId,
        productVersion: firstMean.source.productVersion,
        fetchedAt: firstMean.source.fetchedAt,
      });
    if (!inputHydrologyRunId) {
      return this.insufficient(
        riverReachId,
        discharge,
        ['HYDROLOGY_RUN_LINEAGE_UNAVAILABLE'],
        active,
      );
    }

    const points = meanRecords.map((record) => {
      if (record.leadSeconds === null) {
        throw new Error('forecast mean unexpectedly has null lead time');
      }
      const derived = evaluateRatingCurve(active.curve, {
        dischargeCms: record.dischargeCms,
        expectedDatumId: active.stationDatumId,
      });
      return StageForecastPointSchema.parse({
        status: derived.status,
        sourceDischargeRecordId: record.id,
        validAt: record.validAt,
        leadSeconds: record.leadSeconds,
        dischargeCms: record.dischargeCms,
        stageM: derived.stageM,
        unit: 'm',
        datumId: derived.datumId,
        curveId: derived.curveId,
        curveVersion: derived.curveVersion,
        calibrationRunId: derived.calibrationRunId,
        testRmseM: testMetrics.rmseM,
        extrapolated: derived.extrapolated,
      });
    });

    const available = points.filter(
      (
        point,
      ): point is Extract<
        StageForecastPoint,
        { status: 'AVAILABLE' }
      > => point.status === 'AVAILABLE',
    );
    if (available.length === 0) {
      return {
        reachId: riverReachId,
        discharge,
        stage: {
          status: 'INSUFFICIENT_DATA',
          stationId: active.curve.stationId,
          datumId: active.stationDatumId,
          unit: 'm',
          direction: 'UNKNOWN',
          baseline: null,
          deltaToLastM: null,
          deltas: [],
          peak: null,
          curve: publicCurve(active),
          calibration: publicCalibration(active),
          uncertainty: {
            basis: 'HELD_OUT_TEST',
            ...testMetrics,
          },
          points,
          limitations: [
            'ALL_FORECAST_DISCHARGE_OUTSIDE_CALIBRATED_DOMAIN',
          ],
        },
      };
    }

    const unavailableCount = points.length - available.length;
    const observed =
      await this.calibrationRepository.findLatestObservedStage({
        stationPublicId: active.curve.stationId,
        datumId: active.stationDatumId,
        atUtc: generatedAt,
      });
    const baseline =
      observed === null
        ? {
            kind: 'FIRST_FORECAST' as const,
            stageM: available[0]!.stageM,
            validAt: available[0]!.validAt,
            datumId: active.stationDatumId,
          }
        : {
            kind: 'OBSERVED' as const,
            stageM: observed.stageM,
            validAt: observed.observedAt,
            datumId: observed.datumId,
          };

    const last = available[available.length - 1]!;
    const peak = available.reduce((current, point) =>
      point.stageM > current.stageM ? point : current,
    );
    const evidenceStatus: 'AVAILABLE' | 'PARTIAL' =
      unavailableCount === 0 ? 'AVAILABLE' : 'PARTIAL';
    const limitations = [
      ...(observed === null
        ? ['OBSERVED_STAGE_BASELINE_UNAVAILABLE']
        : []),
      ...(unavailableCount > 0
        ? ['SOME_DISCHARGE_OUTSIDE_CALIBRATED_DOMAIN']
        : []),
    ];

    await this.stageRepository.save({
      riverReachId,
      stationId: active.curve.stationId,
      calibrationRunId: active.calibration.id,
      curveId: active.curve.id,
      inputHydrologyRunId,
      generatedAt,
      datumId: active.stationDatumId,
      evidenceStatus,
      testMaeM: testMetrics.maeM,
      testRmseM: testMetrics.rmseM,
      limitations,
      points,
      metadata: {
        baselineKind: baseline.kind,
        baselineStageM: baseline.stageM,
        baselineValidAt: baseline.validAt,
      },
    });

    return {
      reachId: riverReachId,
      discharge,
      stage: {
        status: evidenceStatus,
        stationId: active.curve.stationId,
        datumId: active.stationDatumId,
        unit: 'm',
        direction: direction(baseline.stageM, last.stageM),
        baseline,
        deltaToLastM: last.stageM - baseline.stageM,
        deltas: available.map((point) => ({
          validAt: point.validAt,
          leadSeconds: point.leadSeconds,
          deltaM: point.stageM - baseline.stageM,
        })),
        peak: {
          stageM: peak.stageM,
          validAt: peak.validAt,
        },
        curve: publicCurve(active),
        calibration: publicCalibration(active),
        uncertainty: {
          basis: 'HELD_OUT_TEST',
          ...testMetrics,
        },
        points,
        limitations,
      },
    };
  }

  async getStationCalibration(
    stationId: string,
  ): Promise<StationCalibrationResponse> {
    const now = this.now();
    if (!Number.isFinite(now.getTime())) {
      throw new RangeError('now must be a valid Date');
    }
    const active =
      await this.calibrationRepository.findActiveCurveForStation(
        stationId,
        now.toISOString(),
      );
    if (!active) {
      return {
        stationId,
        status: 'INSUFFICIENT_DATA',
        reachId: null,
        datumId: null,
        curve: null,
        calibration: null,
        limitations: ['NO_ACTIVE_VALIDATED_CALIBRATION'],
      };
    }

    return {
      stationId,
      status: 'ACTIVE',
      reachId: active.curve.riverReachId,
      datumId: active.stationDatumId,
      curve: publicCurve(active),
      calibration: publicCalibration(active),
      limitations: [],
    };
  }

  private insufficient(
    riverReachId: string,
    discharge: RiverForecastResponse,
    limitations: readonly string[],
    active?: ActiveRatingCurveEvidence,
  ): StageForecastResponse {
    return {
      reachId: riverReachId,
      discharge,
      stage: {
        status: 'INSUFFICIENT_DATA',
        stationId: active?.curve.stationId ?? null,
        datumId: active?.stationDatumId ?? null,
        unit: 'm',
        direction: 'UNKNOWN',
        baseline: null,
        deltaToLastM: null,
        deltas: [],
        peak: null,
        curve: active ? publicCurve(active) : null,
        calibration: active ? publicCalibration(active) : null,
        uncertainty:
          active?.calibration.testMetrics === null ||
          active?.calibration.testMetrics === undefined
            ? null
            : {
                basis: 'HELD_OUT_TEST',
                ...active.calibration.testMetrics,
              },
        points: [],
        limitations,
      },
    };
  }
}
