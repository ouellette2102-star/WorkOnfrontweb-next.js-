import 'package:flutter_test/flutter_test.dart';
import 'package:workon_app/services/missions/mission_models.dart';

/// QA Test — MissionStatus serialization (PR A fix)
///
/// Verifies that MissionStatus.backendValue produces snake_case strings
/// matching what the backend /api/v1/missions-local expects.
///
/// Before the fix, status.name produced camelCase (e.g. 'inProgress'),
/// causing silent 400 errors on state transitions.
void main() {
  group('MissionStatus.backendValue — snake_case serialization', () {
    test('open → "open"', () {
      expect(MissionStatus.open.backendValue, equals('open'));
    });

    test('assigned → "assigned"', () {
      expect(MissionStatus.assigned.backendValue, equals('assigned'));
    });

    test('inProgress → "in_progress" (not "inProgress")', () {
      // This was the critical bug: status.name returned 'inProgress'
      // which the backend rejects. backendValue must return 'in_progress'.
      expect(MissionStatus.inProgress.backendValue, equals('in_progress'));
      expect(MissionStatus.inProgress.backendValue, isNot(equals('inProgress')));
    });

    test('completed → "completed"', () {
      expect(MissionStatus.completed.backendValue, equals('completed'));
    });

    test('paid → "paid"', () {
      expect(MissionStatus.paid.backendValue, equals('paid'));
    });

    test('cancelled → "cancelled"', () {
      expect(MissionStatus.cancelled.backendValue, equals('cancelled'));
    });

    test('Mission.toJson() uses backendValue (not .name)', () {
      final mission = Mission(
        id: 'test-id',
        title: 'Test Mission',
        description: 'Desc',
        category: 'cleaning',
        status: MissionStatus.inProgress,
        price: 100.0,
        latitude: 45.5017,
        longitude: -73.5673,
        city: 'Montréal',
        createdByUserId: 'user-1',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final json = mission.toJson();
      expect(json['status'], equals('in_progress'));
      expect(json['status'], isNot(equals('inProgress')));
    });

    test('roundtrip: fromString → backendValue is lossless', () {
      const backendStatuses = [
        'open',
        'assigned',
        'in_progress',
        'completed',
        'paid',
        'cancelled',
      ];

      for (final s in backendStatuses) {
        final status = MissionStatus.fromString(s);
        expect(
          status.backendValue,
          equals(s),
          reason: 'roundtrip failed for "$s"',
        );
      }
    });
  });
}
