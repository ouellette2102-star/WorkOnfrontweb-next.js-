/// Home page stats from GET /metrics/home-stats
class HomeStats {
  final int completedContracts;
  final int activeWorkers;
  final int openServiceCalls;

  const HomeStats({
    required this.completedContracts,
    required this.activeWorkers,
    required this.openServiceCalls,
  });

  factory HomeStats.fromJson(Map<String, dynamic> json) => HomeStats(
        completedContracts: json['completedContracts'] as int? ?? 0,
        activeWorkers: json['activeWorkers'] as int? ?? 0,
        openServiceCalls: json['openServiceCalls'] as int? ?? 0,
      );
}
