/// Metrics service for WorkOn.
///
/// Provides platform statistics (ratio workers/employers, regions) for dashboard.
///
/// **Phase 14:** Initial implementation.
library;

import 'package:flutter/foundation.dart';

import 'metrics_api.dart';
import 'metrics_models.dart';

/// Service for platform metrics.
class MetricsService {
  MetricsService({MetricsApi? api}) : _api = api ?? const MetricsApi();

  final MetricsApi _api;

  /// Fetches worker/employer ratio.
  ///
  /// Use [region] to filter by city (e.g. 'Montréal').
  Future<RatioMetrics> getRatio({String? region}) async {
    return _api.getRatio(region: region);
  }

  /// Fetches list of regions with active users.
  Future<List<String>> getRegions() async {
    return _api.getRegions();
  }

  /// Convenience: fetches ratio and regions for a dashboard.
  Future<({
    RatioMetrics ratio,
    List<String> regions,
  })> getDashboardData({String? region}) async {
    final results = await Future.wait([
      _api.getRatio(region: region),
      _api.getRegions(),
    ]);
    return (ratio: results[0] as RatioMetrics, regions: results[1] as List<String>);
  }
}
