import 'package:flutter_test/flutter_test.dart';

import 'package:workon_app/main.dart';

void main() {
  testWidgets('WorkOn app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const WorkOnApp());

    expect(find.text('WorkOn'), findsAtLeastNWidgets(1));
  });
}
