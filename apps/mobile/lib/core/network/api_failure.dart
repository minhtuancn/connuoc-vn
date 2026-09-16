import 'package:connuoc_viet/core/network/json_readers.dart';

class ProblemDetails {
  const ProblemDetails({
    required this.type,
    required this.title,
    required this.status,
    required this.detail,
    required this.instance,
  });

  factory ProblemDetails.fromJson(Map<String, Object?> json) {
    return ProblemDetails(
      type: readString(json, 'type', r'$'),
      title: readString(json, 'title', r'$'),
      status: readInt(json, 'status', r'$'),
      detail: readString(json, 'detail', r'$'),
      instance: readString(json, 'instance', r'$'),
    );
  }

  final String type;
  final String title;
  final int status;
  final String detail;
  final String instance;
}

enum ApiFailureKind {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  unprocessable,
  unavailable,
  server,
  http,
  network,
  timeout,
  cancelled,
  malformedResponse;

  static ApiFailureKind fromStatusCode(int statusCode) {
    return switch (statusCode) {
      400 => ApiFailureKind.badRequest,
      401 => ApiFailureKind.unauthorized,
      403 => ApiFailureKind.forbidden,
      404 => ApiFailureKind.notFound,
      422 => ApiFailureKind.unprocessable,
      503 => ApiFailureKind.unavailable,
      >= 500 && <= 599 => ApiFailureKind.server,
      _ => ApiFailureKind.http,
    };
  }
}

class ApiFailure implements Exception {
  const ApiFailure({
    required this.kind,
    this.statusCode,
    this.problem,
    this.cause,
  });

  final ApiFailureKind kind;
  final int? statusCode;
  final ProblemDetails? problem;
  final Object? cause;

  @override
  String toString() {
    final detail = problem?.detail;
    return detail == null
        ? 'ApiFailure($kind${statusCode == null ? '' : ', $statusCode'})'
        : 'ApiFailure($kind, $detail)';
  }
}
