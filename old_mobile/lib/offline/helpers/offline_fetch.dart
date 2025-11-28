import 'dart:convert';
import 'package:http/http.dart' as http;
import '../storage/offline_store.dart';

typedef JsonList = List<Map<String, dynamic>>;

class OfflineFetch {
  static Future<JsonList> offlineFirstList({
    required String box,
    required Uri url,
    Map<String, String>? headers,
    String listKey = 'items',
    String idKey = 'id',
    int? limit,
  }) async {
    final local = OfflineStore.getAll(box, limit: limit);
    try {
      final res = await http.get(url, headers: headers);
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        final list = body is List
            ? body
            : (body[listKey] as List? ?? const []);
        final items = list.cast<Map>();
        await OfflineStore.upsertMany(box, items.cast<Map<String, dynamic>>(), idKey: idKey);
        return items.cast<Map<String, dynamic>>();
      }
    } catch (_) {}
    return local;
  }
}
