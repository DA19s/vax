import 'dart:convert';
import 'package:http/http.dart' as http;
import '../storage/offline_store.dart';

class SyncService {
  final String baseUrl;
  SyncService(this.baseUrl);

  Future<void> pullChildData(String childId) async {
    final lastVacc = OfflineStore.getMeta('vaccinations_since_$childId');
    final lastAppt = OfflineStore.getMeta('appointments_since_$childId');
    final lastNotif = OfflineStore.getMeta('notifications_since_$childId');

    final vaccUri = Uri.parse('$baseUrl/api/mobile/children/$childId/vaccinations${_since(lastVacc)}');
    final apptUri = Uri.parse('$baseUrl/api/mobile/children/$childId/appointments${_since(lastAppt)}');
    final notifUri = Uri.parse('$baseUrl/api/mobile/children/$childId/notifications${_since(lastNotif)}');

    final vaccRes = await http.get(vaccUri);
    if (vaccRes.statusCode == 200) {
      final data = jsonDecode(vaccRes.body) as Map<String, dynamic>;
      final items = (data['vaccinations'] as List).cast<Map>();
      await OfflineStore.upsertMany('vaccinations', items.cast<Map<String, dynamic>>());
      final serverTime = (data['serverTime'] as String?) ?? DateTime.now().toIso8601String();
      await OfflineStore.setMeta('vaccinations_since_$childId', serverTime);
    }

    final apptRes = await http.get(apptUri);
    if (apptRes.statusCode == 200) {
      final list = jsonDecode(apptRes.body) as List;
      final items = list.cast<Map>();
      await OfflineStore.upsertMany('appointments', items.cast<Map<String, dynamic>>());
      final serverTime = apptRes.headers['x-server-time'] ?? DateTime.now().toIso8601String();
      await OfflineStore.setMeta('appointments_since_$childId', serverTime);
    }

    final notifRes = await http.get(notifUri);
    if (notifRes.statusCode == 200) {
      final list = jsonDecode(notifRes.body) as List;
      final items = list.cast<Map>();
      await OfflineStore.upsertMany('notifications', items.cast<Map<String, dynamic>>());
      final serverTime = notifRes.headers['x-server-time'] ?? DateTime.now().toIso8601String();
      await OfflineStore.setMeta('notifications_since_$childId', serverTime);
    }
  }

  String _since(String? value) => value == null ? '' : '?since=${Uri.encodeQueryComponent(value)}';
}
