import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class NotificationStore {
  static const _storage = FlutterSecureStorage();

  // ✅ CLÉ UNIQUE CENTRALISÉE POUR TOUS LES ENFANTS DU PARENT
  static String globalKey(String parentPhone) => 'cached_notifications_global_$parentPhone';
  
  // Ancienne clé par enfant (conservée pour migration)
  static String childKey(String childId) => 'cached_notifications_$childId';
  static String campaignKey(String parentKey) => 'cached_notifications_campaigns_$parentKey';

  static Future<List<Map<String, dynamic>>> _readList(String key) async {
    final raw = await _storage.read(key: key);
    if (raw == null || raw.isEmpty) return [];
    final List decoded = jsonDecode(raw);
    return List<Map<String, dynamic>>.from(decoded);
  }

  static Future<void> _writeList(String key, List<Map<String, dynamic>> list) async {
    await _storage.write(key: key, value: jsonEncode(list));
  }

  static List<Map<String, dynamic>> mergeUnique(
    List<Map<String, dynamic>> base,
    List<Map<String, dynamic>> incoming,
  ) {
    final existing = List<Map<String, dynamic>>.from(base);
    final seen = existing.map((n) => (n['serverId'] ?? n['id'] ?? '${n['title']}|${n['message']}|${n['date']}')).toSet();
    for (final n in incoming) {
      final key = n['serverId'] ?? n['id'] ?? '${n['title']}|${n['message']}|${n['date']}';
      if (!seen.contains(key)) {
        existing.insert(0, n); // ✅ Plus récent en premier
        seen.add(key);
      }
    }
    return existing;
  }
  
  // ✅ Trier par date (plus récent en premier)
  static List<Map<String, dynamic>> sortByDate(List<Map<String, dynamic>> list) {
    final sorted = List<Map<String, dynamic>>.from(list);
    sorted.sort((a, b) {
      final dateA = _parseDate(a['date'] ?? a['createdAt'] ?? '');
      final dateB = _parseDate(b['date'] ?? b['createdAt'] ?? '');
      return dateB.compareTo(dateA); // Plus récent en premier
    });
    return sorted;
  }
  
  static DateTime _parseDate(String dateStr) {
    try {
      return DateTime.parse(dateStr);
    } catch (_) {
      return DateTime.now();
    }
  }

  // ✅ NOUVELLES MÉTHODES CENTRALISÉES
  static Future<List<Map<String, dynamic>>> loadGlobal(String parentPhone) async {
    return _readList(globalKey(parentPhone));
  }

  static Future<void> saveGlobal(String parentPhone, List<Map<String, dynamic>> list) async {
    final sorted = sortByDate(list); // ✅ Toujours trier avant de sauvegarder
    await _writeList(globalKey(parentPhone), sorted);
  }
  
  // ✅ Ajouter une notification centralisée (évite duplication)
  static Future<void> addNotificationGlobal(String parentPhone, Map<String, dynamic> notification) async {
    final existing = await loadGlobal(parentPhone);
    final merged = mergeUnique(existing, [notification]);
    await saveGlobal(parentPhone, merged);
  }

  // ——— Vaccins/notifications par enfant (DEPRECATED - Migration) ———
  static Future<List<Map<String, dynamic>>> loadForChild(String childId) async {
    return _readList(childKey(childId));
  }

  static Future<void> saveForChild(String childId, List<Map<String, dynamic>> list) async {
    await _writeList(childKey(childId), list);
  }

  // ——— Campagnes globales côté parent (DEPRECATED - Migré vers global) ———
  static Future<List<Map<String, dynamic>>> loadCampaigns(String parentKey) async {
    return _readList(campaignKey(parentKey));
  }

  static Future<void> saveCampaigns(String parentKey, List<Map<String, dynamic>> list) async {
    await _writeList(campaignKey(parentKey), list);
  }

  // ——— Non-lus ———
  static int unreadCount(List<Map<String, dynamic>> items) {
    return items.where((n) => (n['read'] == false)).length;
  }

  static Future<void> markAllRead(String parentPhone) async {
    final notifications = await loadGlobal(parentPhone);
    for (final n in notifications) {
      n['read'] = true;
    }
    await saveGlobal(parentPhone, notifications);
  }
  
  // Migration : Marquer tout lu (ancienne méthode pour compatibilité)
  static Future<void> markAllReadForChild(String childId, String parentKey) async {
    final child = await loadForChild(childId);
    final campaigns = await loadCampaigns(parentKey);

    for (final n in child) { n['read'] = true; }
    for (final n in campaigns) { n['read'] = true; }

    await saveForChild(childId, child);
    await saveCampaigns(parentKey, campaigns);
  }
  
  // ✅ Migration des anciennes notifications vers le système centralisé
  static Future<void> migrateToGlobal(String parentPhone, List<String> childIds) async {
    final global = await loadGlobal(parentPhone);
    var allNotifications = List<Map<String, dynamic>>.from(global);
    
    // Migrer les notifications de chaque enfant
    for (final childId in childIds) {
      final childNotifs = await loadForChild(childId);
      allNotifications = mergeUnique(allNotifications, childNotifs);
    }
    
    // Migrer les campagnes
    final campaigns = await loadCampaigns(parentPhone);
    allNotifications = mergeUnique(allNotifications, campaigns);
    
    // Sauvegarder tout dans la clé globale
    await saveGlobal(parentPhone, allNotifications);
    
    print("✅ Migration terminée : ${allNotifications.length} notifications centralisées");
  }
}