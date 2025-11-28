class QueuedRequestModel {
  final String id;
  final String method;
  final String url;
  final Map<String, String> headers;
  final Map<String, dynamic>? body;
  final DateTime createdAt;

  QueuedRequestModel({
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

  static QueuedRequestModel fromMap(Map<String, dynamic> m) => QueuedRequestModel(
        id: m['id'] as String,
        method: m['method'] as String,
        url: m['url'] as String,
        headers: Map<String, String>.from(m['headers'] ?? {}),
        body: m['body'] == null ? null : Map<String, dynamic>.from(m['body']),
        createdAt: DateTime.tryParse(m['createdAt'] ?? '') ?? DateTime.now(),
      );
}
