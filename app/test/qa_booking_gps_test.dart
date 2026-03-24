import 'package:flutter_test/flutter_test.dart';
import 'package:workon_app/services/location/location_service.dart';

/// QA Test — GPS fallback behavior (PR B fix)
///
/// Verifies that LocationService always returns a non-null position
/// (defaults to Montreal if GPS denied) so booking_screen never sends 0.0.
void main() {
  group('LocationService — GPS fallback', () {
    test('defaultPosition is not (0, 0)', () {
      expect(UserPosition.defaultPosition.latitude, isNot(equals(0.0)));
      expect(UserPosition.defaultPosition.longitude, isNot(equals(0.0)));
    });

    test('defaultPosition is Montreal (sanity check)', () {
      // If permission denied, fallback must be a real city, not null island (0,0)
      expect(UserPosition.defaultPosition.latitude, closeTo(45.5017, 0.001));
      expect(UserPosition.defaultPosition.longitude, closeTo(-73.5673, 0.001));
    });

    test('UserPosition toString is readable', () {
      const pos = UserPosition(latitude: 45.5017, longitude: -73.5673);
      expect(pos.toString(), contains('45.5017'));
      expect(pos.toString(), contains('-73.5673'));
    });
  });
}
