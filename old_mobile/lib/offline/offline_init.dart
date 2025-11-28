import 'package:hive_flutter/hive_flutter.dart';

class OfflineInit {
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;
    await Hive.initFlutter();
    await Future.wait([
      Hive.openBox('children'),
      Hive.openBox('vaccinations'),
      Hive.openBox('appointments'),
      Hive.openBox('notifications'),
      Hive.openBox('pending_requests'),
      Hive.openBox('sync_meta'),
    ]);
    _initialized = true;
  }
}
