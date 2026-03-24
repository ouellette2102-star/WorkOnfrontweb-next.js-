import 'package:flutter/material.dart';

import '../models/home_stats.dart';

/// Displays home stats (completed contracts, active workers, open service calls)
class HomeStatsCard extends StatelessWidget {
  final HomeStats stats;

  const HomeStatsCard({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _StatItem(
              label: 'Contrats complétés',
              value: stats.completedContracts,
              icon: Icons.check_circle_outline,
            ),
            _StatItem(
              label: 'Travailleurs actifs',
              value: stats.activeWorkers,
              icon: Icons.people_outline,
            ),
            _StatItem(
              label: 'Appels ouverts',
              value: stats.openServiceCalls,
              icon: Icons.assignment_outlined,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final int value;
  final IconData icon;

  const _StatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 28, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 8),
        Text(
          '$value',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
