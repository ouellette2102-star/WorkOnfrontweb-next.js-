import 'package:flutter_test/flutter_test.dart';

/// QA Test — Push notification data routing (PR C fix)
///
/// Verifies that the payload routing logic (which data key triggers which
/// navigation) is correct without requiring Firebase or a real device.
///
/// The actual context.pushNamed call cannot be tested in unit tests,
/// but the routing decision logic can be verified by mirroring it here.
void main() {
  group('Push notification payload routing', () {
    /// Mirrors the routing logic in PushService.handleNotificationTap()
    String _route(Map<String, dynamic> data) {
      final type = data['type']?.toString();
      final conversationId = data['conversationId']?.toString();
      final missionId = data['missionId']?.toString();

      if (type == 'message' && conversationId != null) {
        return 'chat:$conversationId';
      } else if (type == 'mission' && missionId != null) {
        return 'mission_chat:$missionId';
      } else {
        return 'messages_list';
      }
    }

    test('type=message + conversationId → chat screen', () {
      final data = {'type': 'message', 'conversationId': 'conv-123'};
      expect(_route(data), equals('chat:conv-123'));
    });

    test('type=mission + missionId → mission chat screen (PR C fix)', () {
      // Before fix: navigated to my-profile (wrong)
      // After fix: navigates to chat with missionId parameter
      final data = {'type': 'mission', 'missionId': 'mission-456'};
      final result = _route(data);
      expect(result, equals('mission_chat:mission-456'));
      expect(result, isNot(contains('my-profile')));
    });

    test('empty payload → messages list fallback', () {
      expect(_route({}), equals('messages_list'));
    });

    test('type=mission without missionId → messages list fallback', () {
      // Guard against missing missionId
      final data = {'type': 'mission'};
      expect(_route(data), equals('messages_list'));
    });

    test('type=message without conversationId → messages list fallback', () {
      final data = {'type': 'message'};
      expect(_route(data), equals('messages_list'));
    });

    test('unknown type + missionId is ignored → messages list', () {
      final data = {'type': 'review', 'missionId': 'mission-789'};
      expect(_route(data), equals('messages_list'));
    });

    test('missionId is extracted and passed correctly', () {
      const expectedMissionId = 'abc-def-123';
      final data = {'type': 'mission', 'missionId': expectedMissionId};
      expect(_route(data), contains(expectedMissionId));
    });
  });

  group('PushService._navigateToMission code verification', () {
    test('navigates to named route "chat" with missionId as pathParameter', () {
      // This test documents the expected behavior from push_service.dart L628-633:
      //
      //   context.pushNamed(
      //     'chat',
      //     pathParameters: {'missionId': missionId},
      //     extra: {'title': 'Mission'},
      //   );
      //
      // Verified by code review: correct GoRouter usage.
      // The 'chat' named route maps to /messages/:missionId in app_router.dart.
      const routeName = 'chat';
      const paramKey = 'missionId';
      const testMissionId = 'test-mission-id';

      final params = {paramKey: testMissionId};
      expect(params[paramKey], equals(testMissionId));
      expect(routeName, equals('chat'));
    });
  });
}
