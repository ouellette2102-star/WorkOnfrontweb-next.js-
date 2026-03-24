/// Models for earnings API responses.
///
/// PR-EARNINGS: Earnings module implementation.
library;

import 'package:flutter/foundation.dart';

/// Status of an earning transaction.
enum EarningStatus {
  pending,
  available,
  paid;

  static EarningStatus fromString(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return EarningStatus.pending;
      case 'available':
        return EarningStatus.available;
      case 'paid':
        return EarningStatus.paid;
      default:
        debugPrint('[EarningStatus] Unknown status: $value, defaulting to pending');
        return EarningStatus.pending;
    }
  }

  String get displayName {
    switch (this) {
      case EarningStatus.pending:
        return 'En attente';
      case EarningStatus.available:
        return 'Disponible';
      case EarningStatus.paid:
        return 'Payé';
    }
  }
}

/// Earnings summary response.
class EarningsSummary {
  final double totalLifetimeGross;
  final double totalLifetimeNet;
  final double totalPaid;
  final double totalPending;
  final double totalAvailable;
  final int completedMissionsCount;
  final int paidMissionsCount;
  final double commissionRate;
  final String currency;

  const EarningsSummary({
    required this.totalLifetimeGross,
    required this.totalLifetimeNet,
    required this.totalPaid,
    required this.totalPending,
    required this.totalAvailable,
    required this.completedMissionsCount,
    required this.paidMissionsCount,
    required this.commissionRate,
    required this.currency,
  });

  factory EarningsSummary.fromJson(Map<String, dynamic> json) {
    return EarningsSummary(
      totalLifetimeGross: (json['totalLifetimeGross'] as num?)?.toDouble() ?? 0.0,
      totalLifetimeNet: (json['totalLifetimeNet'] as num?)?.toDouble() ?? 0.0,
      totalPaid: (json['totalPaid'] as num?)?.toDouble() ?? 0.0,
      totalPending: (json['totalPending'] as num?)?.toDouble() ?? 0.0,
      totalAvailable: (json['totalAvailable'] as num?)?.toDouble() ?? 0.0,
      completedMissionsCount: (json['completedMissionsCount'] as num?)?.toInt() ?? 0,
      paidMissionsCount: (json['paidMissionsCount'] as num?)?.toInt() ?? 0,
      commissionRate: (json['commissionRate'] as num?)?.toDouble() ?? 0.15,
      currency: json['currency'] as String? ?? 'CAD',
    );
  }

  /// Empty/default summary (for loading state).
  factory EarningsSummary.empty() {
    return const EarningsSummary(
      totalLifetimeGross: 0,
      totalLifetimeNet: 0,
      totalPaid: 0,
      totalPending: 0,
      totalAvailable: 0,
      completedMissionsCount: 0,
      paidMissionsCount: 0,
      commissionRate: 0.15,
      currency: 'CAD',
    );
  }

  /// Commission percentage as integer (15 instead of 0.15).
  int get commissionPercent => (commissionRate * 100).round();
}

/// Single earning transaction.
class EarningTransaction {
  final String id;
  final String missionId;
  final String missionTitle;
  final String clientName;
  final DateTime date;
  final double grossAmount;
  final double commissionAmount;
  final double netAmount;
  final EarningStatus status;
  final DateTime? paidAt;
  final String currency;

  const EarningTransaction({
    required this.id,
    required this.missionId,
    required this.missionTitle,
    required this.clientName,
    required this.date,
    required this.grossAmount,
    required this.commissionAmount,
    required this.netAmount,
    required this.status,
    this.paidAt,
    required this.currency,
  });

  factory EarningTransaction.fromJson(Map<String, dynamic> json) {
    return EarningTransaction(
      id: json['id'] as String? ?? '',
      missionId: json['missionId'] as String? ?? '',
      missionTitle: json['missionTitle'] as String? ?? 'Mission',
      clientName: json['clientName'] as String? ?? 'Client',
      date: DateTime.tryParse(json['date'] as String? ?? '') ?? DateTime.now(),
      grossAmount: (json['grossAmount'] as num?)?.toDouble() ?? 0.0,
      commissionAmount: (json['commissionAmount'] as num?)?.toDouble() ?? 0.0,
      netAmount: (json['netAmount'] as num?)?.toDouble() ?? 0.0,
      status: EarningStatus.fromString(json['status'] as String? ?? 'pending'),
      paidAt: json['paidAt'] != null
          ? DateTime.tryParse(json['paidAt'] as String)
          : null,
      currency: json['currency'] as String? ?? 'CAD',
    );
  }
}

/// Paginated earnings history response.
class EarningsHistoryResponse {
  final List<EarningTransaction> transactions;
  final String? nextCursor;
  final int totalCount;

  const EarningsHistoryResponse({
    required this.transactions,
    this.nextCursor,
    required this.totalCount,
  });

  factory EarningsHistoryResponse.fromJson(Map<String, dynamic> json) {
    final transactionsList = json['transactions'] as List<dynamic>? ?? [];
    return EarningsHistoryResponse(
      transactions: transactionsList
          .map((item) => EarningTransaction.fromJson(item as Map<String, dynamic>))
          .toList(),
      nextCursor: json['nextCursor'] as String?,
      totalCount: (json['totalCount'] as num?)?.toInt() ?? 0,
    );
  }

  /// Empty response for initial/error state.
  factory EarningsHistoryResponse.empty() {
    return const EarningsHistoryResponse(
      transactions: [],
      nextCursor: null,
      totalCount: 0,
    );
  }
}


