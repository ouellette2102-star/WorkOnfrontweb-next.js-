import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../config/workon_colors.dart';
import '../../services/earnings/earnings_api.dart';
import '../../services/earnings/earnings_models.dart';

/// Historique des gains pour les travailleurs.
/// GET /earnings/summary + GET /earnings/history
class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  EarningsSummary? _summary;
  EarningsHistoryResponse? _history;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final results = await Future.wait([
        EarningsApi().fetchSummary(),
        EarningsApi().fetchHistory(limit: 20),
      ]);
      if (mounted) {
        setState(() {
          _summary = results[0] as EarningsSummary;
          _history = results[1] as EarningsHistoryResponse;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Impossible de charger vos gains.';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WkColors.bgPrimary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: WkColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Mes gains',
          style: TextStyle(
            fontFamily: 'General Sans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: WkColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: WkColors.brandRed))
          : _error != null
              ? _ErrorView(error: _error!, onRetry: _load)
              : RefreshIndicator(
                  color: WkColors.brandRed,
                  onRefresh: _load,
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            children: [
                              _SummaryCard(summary: _summary!),
                              const SizedBox(height: 20),
                              const Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  'Historique',
                                  style: TextStyle(
                                    fontFamily: 'General Sans',
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                    color: WkColors.textPrimary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (_history != null && _history!.transactions.isEmpty)
                        const SliverFillRemaining(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.payments_outlined, color: WkColors.textTertiary, size: 48),
                                SizedBox(height: 12),
                                Text(
                                  'Aucune transaction pour l\'instant',
                                  style: TextStyle(color: WkColors.textSecondary, fontSize: 15),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (_, i) {
                              final tx = _history!.transactions[i];
                              return _TransactionTile(transaction: tx);
                            },
                            childCount: _history?.transactions.length ?? 0,
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.summary});
  final EarningsSummary summary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFB71C1C), Color(0xFFE53935)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Gains totaux nets',
            style: TextStyle(color: Colors.white70, fontSize: 13),
          ),
          const SizedBox(height: 4),
          Text(
            '${summary.totalLifetimeNet.toStringAsFixed(2)} \$ CAD',
            style: const TextStyle(
              fontFamily: 'General Sans',
              fontSize: 32,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _MiniStat(label: 'Disponible', value: '${summary.totalAvailable.toInt()} \$', color: Colors.white),
              _vDivider(),
              _MiniStat(label: 'En attente', value: '${summary.totalPending.toInt()} \$', color: Colors.white70),
              _vDivider(),
              _MiniStat(label: 'Missions', value: '${summary.completedMissionsCount}', color: Colors.white),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white12,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Commission WorkOn : ${(summary.commissionRate * 100).toInt()}%',
              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _vDivider() => Container(width: 1, height: 30, color: Colors.white30);
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value, required this.color});
  final String label;
  final String value;
  final Color color;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 16, fontFamily: 'General Sans')),
        Text(label, style: TextStyle(color: color.withOpacity(0.7), fontSize: 11)),
      ],
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.transaction});
  final EarningTransaction transaction;

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.netAmount > 0;
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: WkColors.bgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: WkColors.glassBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isCredit ? WkColors.successSoft : WkColors.errorSoft,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: isCredit ? WkColors.success : WkColors.error,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Mission #${transaction.missionId}',
                  style: const TextStyle(
                    fontFamily: 'General Sans',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: WkColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  transaction.status.displayName,
                  style: const TextStyle(fontSize: 12, color: WkColors.textSecondary),
                ),
              ],
            ),
          ),
          Text(
            '${isCredit ? '+' : ''}${transaction.netAmount.toStringAsFixed(2)} \$',
            style: TextStyle(
              fontFamily: 'General Sans',
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: isCredit ? WkColors.success : WkColors.error,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: WkColors.error, size: 48),
          const SizedBox(height: 12),
          Text(error, style: const TextStyle(color: WkColors.textSecondary)),
          const SizedBox(height: 16),
          TextButton(onPressed: onRetry, child: const Text('Réessayer', style: TextStyle(color: WkColors.brandRed))),
        ],
      ),
    );
  }
}
