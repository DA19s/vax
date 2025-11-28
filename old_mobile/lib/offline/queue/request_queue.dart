import 'dart:convert';
import 'package:hive/hive.dart';

class QueuedRequest {
  final String id;
  final String method;
  final String url;
  final Map<String, String> headers;
  final Map<String, dynamic>? body;
  final DateTime createdAt;

  QueuedRequest({
    required this.id,
    required this.method,
    required this.url,
    required this.headers,
    required this.body,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'method': method,
        'url': url,
        'headers': headers,
        'body': body,
        'createdAt': createdAt.toIso8601String(),
      };

  static QueuedRequest fromMap(Map<String, dynamic> m) => QueuedRequest(
        id: m['id'] as String,
        method: m['method'] as String,
        url: m['url'] as String,
        headers: Map<String, String>.from(m['headers'] ?? {}),
        body: m['body'] == null ? null : Map<String, dynamic>.from(m['body']),
        createdAt: DateTime.tryParse(m['createdAt'] ?? '') ?? DateTime.now(),
      );
}

class RequestQueue {
  static Box<dynamic> get _box => Hive.box<dynamic>('pending_requests');

  static Future<void> enqueue(QueuedRequest req) async {
    await _box.put(req.id, req.toMap());
  }

  static List<QueuedRequest> list() {
    return _box.values
        .cast<Map>()
        .map((e) => QueuedRequest.fromMap(Map<String, dynamic>.from(e)))
        .toList()
      ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
  }

  static Future<void> remove(String id) async {
    await _box.delete(id);
  }

  static String newId() => base64Url.encode(utf8.encode('${DateTime.now().microsecondsSinceEpoch}-${_box.length + 1}'));
}
