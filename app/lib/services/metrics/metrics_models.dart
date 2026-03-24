/// Metrics models for WorkOn.
///
/// Data structures for platform metrics (ratio, regions) from the backend.
///
/// **Phase 14:** Initial implementation.
library;

/// Worker/employer ratio metrics for a region or globally.
class RatioMetrics {
  const RatioMetrics({
    required this.workers,
    required this.employers,
    required this.residentialClients,
    required this.workerToEmployerRatio,
    this.region,
  });

  /// Creates [RatioMetrics] from JSON.
  factory RatioMetrics.fromJson(Map<String, dynamic> json) {
    return RatioMetrics(
      region: json['region'] as String?,
      workers: (json['workers'] as num?)?.toInt() ?? 0,
      employers: (json['employers'] as num?)?.toInt() ?? 0,
      residentialClients: (json['residentialClients'] as num?)?.toInt() ?? 0,
      workerToEmployerRatio: (json['workerToEmployerRatio'] as num?)?.toDouble() ?? 0.0,
    );
  }

  /// Region name (null if global).
  final String? region;

  /// Number of workers.
  final int workers;

  /// Number of employers.
  final int employers;

  /// Number of residential clients.
  final int residentialClients;

  /// Worker to employer ratio.
  final double workerToEmployerRatio;
}

/// Home page stats from GET /metrics/home-stats (public).
/// Used for landing page: contrats complétés, travailleurs actifs, appels ouverts.
class HomeStats {
  const HomeStats({
    required this.completedContracts,
    required this.activeWorkers,
    required this.openServiceCalls,
  });

  factory HomeStats.fromJson(Map<String, dynamic> json) => HomeStats(
        completedContracts: (json['completedContracts'] as num?)?.toInt() ?? 0,
        activeWorkers: (json['activeWorkers'] as num?)?.toInt() ?? 0,
        openServiceCalls: (json['openServiceCalls'] as num?)?.toInt() ?? 0,
      );

  final int completedContracts;
  final int activeWorkers;
  final int openServiceCalls;
}
