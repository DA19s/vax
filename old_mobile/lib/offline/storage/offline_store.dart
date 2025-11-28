import 'package:hive/hive.dart';

class OfflineStore {
  static Box<dynamic> _box(String name) => Hive.box<dynamic>(name);

  static Future<void> upsertMany(String boxName, List<Map<String, dynamic>> items, {String idKey = 'id'}) async {
    if (items.isEmpty) return;
    final box = _box(boxName);
    for (final item in items) {
      final key = (item[idKey] ?? item['_id'] ?? item['id']).toString();
      await box.put(key, item);
    }
  }

  static List<Map<String, dynamic>> getAll(String boxName, {int? limit}) {
    final box = _box(boxName);
    final values = box.values.cast<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    values.sort((a, b) => DateTime.tryParse(b['updatedAt']?.toString() ?? b['createdAt']?.toString() ?? '')
            ?.compareTo(DateTime.tryParse(a['updatedAt']?.toString() ?? a['createdAt']?.toString() ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0)) 
        ?? 0);
    if (limit != null && limit > 0 && values.length > limit) return values.sublist(0, limit);
    return values;
  }

  static Map<String, dynamic>? getById(String boxName, String id) {
    final box = _box(boxName);
    final data = box.get(id);
    if (data == null) return null;
    return Map<String, dynamic>.from(data);
  }

  static Future<void> put(String boxName, String id, Map<String, dynamic> value) async {
    await _box(boxName).put(id, value);
  }

  static Future<void> delete(String boxName, String id) async {
    await _box(boxName).delete(id);
  }

  static Future<void> clear(String boxName) async {
    await _box(boxName).clear();
  }

  static Future<void> setMeta(String key, String value) async {
    await _box('sync_meta').put(key, value);
  }

  static String? getMeta(String key) {
    return _box('sync_meta').get(key) as String?;
  }
}
