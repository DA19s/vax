import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;

import 'calendrier_screen.dart';
import 'notifications_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic> child;
  final String? apiBase;
  final String? token;
  final bool isAgent;
  final String? agentChildName;

  const DashboardScreen({
    super.key,
    required this.child,
    this.apiBase,
    this.token,
    this.isAgent = false,
    this.agentChildName,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;
  String? _token;
  final storage = const FlutterSecureStorage();
  IO.Socket? socket;

  List<Map<String, dynamic>> _cards = [];
  List<Map<String, dynamic>> _notifications = [];
  int _unread = 0; // ⭐ compteur non-lus

  // 🔑 Identifiant enfant + clé de cache par enfant
  String get _childId {
    final m = widget.child;
    for (final k in ['_id','id','childId','child_id']) {
      final v = m[k];
      if (v != null && v.toString().trim().isNotEmpty) return v.toString();
    }
    return '';
  }
  String get _storageKey => 'cached_notifications_$_childId';

  // 🔑 Clé globale de campagnes, scindée par parent (phone/id si dispo)
  String get _parentKeyId {
    final m = widget.child;
    final pid = (m['parentId'] ?? m['userId'] ?? m['parentPhone'] ?? 'parent').toString();
    return pid.isEmpty ? 'parent' : pid;
  }
  String get _campaignKey => 'cached_notifications_campaigns_$_parentKeyId';

  @override
  void initState() {
    super.initState();
    _initDashboard();
  }

  @override
  void dispose() {
    socket?.disconnect();
    socket?.dispose();
    super.dispose();
  }

  Future<void> _initDashboard() async {
    await _loadTokenIfNeeded();
    _initCards();
    await _loadNotificationsFromLocal();     // enfant + fusion campagnes
    await _loadNotificationsFromBackend();   // merge + sauvegarde
    _connectToSocket();                      // sauvegarde ciblée + globale si campagne
  }

  Future<void> _loadTokenIfNeeded() async {
    _token = widget.token?.isNotEmpty == true
        ? widget.token
        : await storage.read(key: 'auth_token');
  }

  // —— utils fusion/déduplication ——
  List<Map<String, dynamic>> _mergeUnique(List<Map<String, dynamic>> base, List<Map<String, dynamic>> incoming) {
    final existing = List<Map<String, dynamic>>.from(base);
    final seen = existing
        .map((n) => (n['serverId'] ?? n['id'] ?? '${n['title']}|${n['message']}|${n['date']}'))
        .toSet();
    for (final n in incoming) {
      final key = n['serverId'] ?? n['id'] ?? '${n['title']}|${n['message']}|${n['date']}';
      if (!seen.contains(key)) {
        existing.insert(0, n);
        seen.add(key);
      }
    }
    return existing;
  }

  // ⭐ calcule non-lus
  void _recomputeUnread() {
    setState(() {
      _unread = _notifications.where((n) => n['read'] == false).length;
    });
  }

  Future<void> _loadNotificationsFromLocal() async {
    // 1) Lecture par enfant
    final saved = await storage.read(key: _storageKey);
    if (saved != null) {
      final List decoded = jsonDecode(saved);
      _notifications = List<Map<String, dynamic>>.from(decoded);
      for (final n in _notifications) {
        n['read'] ??= false; // ⭐
        n['id'] ??= '${n['title']}|${n['message']}|${n['date']}'; // ⭐
      }
      debugPrint("📦 Dashboard : notifications depuis cache (${_notifications.length}) [$_storageKey]");
    }

    // 2) Fusion des campagnes globales (par parent)
    final campSaved = await storage.read(key: _campaignKey);
    if (campSaved != null && campSaved.isNotEmpty) {
      final List decoded = jsonDecode(campSaved);
      final campaigns = List<Map<String, dynamic>>.from(decoded);
      for (final n in campaigns) {
        n['read'] ??= false; // ⭐
        n['id'] ??= '${n['title']}|${n['message']}|${n['date']}'; // ⭐
      }
      _notifications = _mergeUnique(_notifications, campaigns);
      debugPrint("📦 Dashboard : campagnes fusionnées (${campaigns.length}) [$_campaignKey]");
    }

    _recomputeUnread(); // ⭐
    setState(() {});
  }

  Future<void> _saveNotificationsToLocal() async {
    await storage.write(
      key: _storageKey,
      value: jsonEncode(_notifications),
    );
    debugPrint("💾 Dashboard : notifications sauvegardées (${_notifications.length}) [$_storageKey]");
    _recomputeUnread(); // ⭐
  }

  Future<void> _saveCampaignGlobally(Map<String, dynamic> note) async {
    try {
      final raw = await storage.read(key: _campaignKey);
      List<Map<String, dynamic>> list = [];
      if (raw != null && raw.isNotEmpty) {
        list = List<Map<String, dynamic>>.from(jsonDecode(raw));
      }
      note['read'] ??= false; // ⭐
      note['id'] ??= '${note['title']}|${note['message']}|${note['date']}'; // ⭐
      list = _mergeUnique(list, [note]);
      await storage.write(key: _campaignKey, value: jsonEncode(list));
      debugPrint("💾 Campagne sauvegardée globalement [$_campaignKey] (${list.length})");
    } catch (e) {
      debugPrint("⚠️ Save campaign global failed: $e");
    }
  }

  void _initCards() {
    final child = widget.child;
    final name = (child['name'] ?? 'Enfant').toString();
    final birthDate = child['birthDate']?.toString();
    final age = birthDate != null ? _calculateAge(birthDate) : "Âge inconnu";

    _cards = [
      {
        'type': 'profil',
        'name': name,
        'age': age,
        'button': 'Voir le calendrier vaccinal',
        'image': 'assets/images/baby_avatar.png',
      },
      {
        'type': 'campagne',
        'title': 'Campagne Rougeole 2025',
        'subtitle': 'Disponible du 10 au 25 octobre',
        'button': 'En savoir plus',
        'image': 'assets/images/campagne.png',
      },
      {
        'type': 'conseil',
        'title': 'Conseil santé du jour',
        'subtitle': 'Hydratez bien votre enfant chaque jour.',
        'button': 'Lire le conseil',
        'image': 'assets/images/conseil.png',
      },
    ];
  }

  /// 🔌 Connexion Socket.io + join rooms (ajout de 'parent' et 'all' pour campagnes)
  void _connectToSocket() {
    final baseUrl = widget.apiBase ?? 'http://localhost:5000';

    String _extractChildId(Map<String, dynamic> m) {
      final candidates = ['_id', 'id', 'childId', 'child_id'];
      for (final k in candidates) {
        final v = m[k];
        if (v != null && v.toString().trim().isNotEmpty) return v.toString();
      }
      return '';
    }

    final childId = _extractChildId(widget.child);
    final parentUserId =
        (widget.child['parentId'] ?? widget.child['userId'] ?? 'parentMobile')
            .toString();
    final parentPhone = (widget.child['parentPhone'] ?? '').toString();

    debugPrint(
        "🔌 Connexion socket à $baseUrl (parent=$parentUserId, child=$childId, phone=$parentPhone)");

    socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setReconnectionAttempts(10)
          .setReconnectionDelay(1000)
          .build(),
    );

    socket!.onConnect((_) async {
      debugPrint("🟢 Socket connecté");

      final roomsOnRegister = <String>[
        // ⬇️⬇️ AJOUTS pour les campagnes
        "all",
        "parent",
        // ⬆️⬆️

        if (childId.isNotEmpty) "child_$childId",
        if (parentPhone.isNotEmpty)
          "parent_${parentPhone}_child_$childId",
      ];

      socket!.emit("registerUser", {
        "userId": parentUserId,
        "role": "parent",
        "rooms": roomsOnRegister,
        if (parentPhone.isNotEmpty) "parentPhone": parentPhone,
        "childId": childId,
      });

      debugPrint("✅ Rooms envoyées à l'enregistrement : $roomsOnRegister");
    });

    socket!.off("newNotification");
    socket!.on("newNotification", (data) async {
      debugPrint("📩 Dashboard: newNotification $data");
      if (data is Map && data["title"] != null) {
        final now = DateTime.now();
        final note = {
          'icon': data["icon"] ?? "🔔",
          'title': data["title"],
          'message': data["message"],
          'date': DateFormat('dd MMM yyyy HH:mm').format(now),
          'type': (data['type'] ?? 'systeme').toString(),
          'read': false, // ⭐
          'id': '${now.millisecondsSinceEpoch}_${data["title"]}', // ⭐
        };

        // 🔔 Si c'est une campagne, on la stocke aussi globalement (par parent)
        if (note['type'] == 'campagne') {
          await _saveCampaignGlobally(note);
        }

        setState(() {
          _notifications = _mergeUnique(_notifications, [note]);
        });
        await _saveNotificationsToLocal(); // ⭐ persistance + recompute unread
      }
    });

    socket!.on("joinedRooms",
        (rooms) => debugPrint("✅ Rooms rejointes: $rooms"));
    socket!.onConnectError(
        (err) => debugPrint("⚠️ Socket connect_error: $err"));
    socket!.onError((err) => debugPrint("🚨 Socket error: $err"));
    socket!
        .onDisconnect((reason) => debugPrint("🔴 Socket disconnect: $reason"));
  }

  Future<void> _loadNotificationsFromBackend() async {
    try {
      final baseUrl = widget.apiBase ?? 'http://localhost:5000';
      final res = await http.get(
        Uri.parse("$baseUrl/api/notifications"),
        headers: {"Authorization": "Bearer ${_token ?? ""}"},
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final notifs = (data["notifications"] as List?) ?? [];

        // On prépare les éléments à fusionner (on garde le type + on capture _id)
        final fetched = notifs.map<Map<String, dynamic>>((n) {
          final dt = DateTime.tryParse(n["createdAt"] ?? '') ?? DateTime.now();
          final formatted = DateFormat('dd MMM yyyy HH:mm').format(dt);
          final id = '${dt.millisecondsSinceEpoch}_${n["title"] ?? "Notification"}';
          return {
            'serverId': (n["_id"] ?? '').toString(), // ⭐ id mongo (si dispo)
            'icon': n["icon"] ?? "🔔",
            'title': n["title"] ?? "Notification",
            'message': n["message"] ?? "",
            'date': formatted,
            'type': (n["type"] ?? 'systeme').toString(),
            'read': false, // ⭐
            'id': id,      // ⭐
          };
        }).toList();

        if (fetched.isEmpty) {
          debugPrint("ℹ️ Backend a renvoyé 0 notif — on conserve le cache local.");
          _recomputeUnread(); // ⭐
          return;
        }

        // 🔔 Extra : stocker les campagnes globalement
        final campaigns = fetched.where((n) => n['type'] == 'campagne').toList();
        if (campaigns.isNotEmpty) {
          final raw = await storage.read(key: _campaignKey);
          List<Map<String, dynamic>> cur = [];
          if (raw != null && raw.isNotEmpty) {
            cur = List<Map<String, dynamic>>.from(jsonDecode(raw));
          }
          final merged = _mergeUnique(cur, campaigns);
          await storage.write(key: _campaignKey, value: jsonEncode(merged));
          debugPrint("💾 Campagnes backend fusionnées globalement [$_campaignKey] (${merged.length})");
        }

        setState(() {
          _notifications = _mergeUnique(_notifications, fetched);
        });
        await _saveNotificationsToLocal(); // ⭐
      }
    } catch (e) {
      debugPrint("⚠️ Erreur backend notifications : $e");
    }
  }

  String _calculateAge(String birthDate) {
    try {
      final birth = DateTime.parse(birthDate);
      final now = DateTime.now();
      int months = (now.year - birth.year) * 12 + (now.month - birth.month);
      if (now.day < birth.day) months--;
      if (months < 12) return "$months mois";
      final years = months ~/ 12;
      final rest = months % 12;
      return "$years an${years > 1 ? 's' : ''}${rest > 0 ? ' $rest mois' : ''}";
    } catch (_) {
      return "Âge inconnu";
    }
  }

  @override
  Widget build(BuildContext context) {
    final childName = widget.child['name'] ?? "Enfant";

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          "Carnet de $childName",
          style: const TextStyle(
            color: Color(0xFF0A1A33),
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            const SizedBox(height: 10),
            CarouselSlider.builder(
              itemCount: _cards.length,
              options: CarouselOptions(
                height: 360,
                autoPlay: true,
                viewportFraction: 1,
                enlargeCenterPage: true,
                onPageChanged: (i, _) => setState(() => _currentIndex = i),
              ),
              itemBuilder: (context, i, _) {
                final card = _cards[i];
                switch (card['type']) {
                  case 'profil':
                    return _buildProfilCard(card);
                  case 'campagne':
                    return _buildCampagneCard(card);
                  case 'conseil':
                    return _buildConseilCard(card);
                  default:
                    return const SizedBox();
                }
              },
            ),
            const SizedBox(height: 20),
            const Text(
              "Notifications récentes",
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xFF0A1A33),
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 12),
            Column(
              children:
                  _notifications.map((n) => _buildNotificationCard(n)).toList(),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),

      // ⭐ FAB avec badge non-lus
      floatingActionButton: SizedBox(
        width: 64, height: 64,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(
              child: FloatingActionButton(
                backgroundColor: const Color(0xFF0A1A33),
                child: const Icon(Icons.notifications, color: Colors.white, size: 26),
                onPressed: () async {
                  final t = _token ?? await storage.read(key: 'auth_token');
                  if (!mounted) return;
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => NotificationsScreen(
                        apiBase: widget.apiBase ?? 'http://localhost:5001',
                        token: t,
                        child: widget.child,
                      ),
                    ),
                  );
                  // ⭐ Au retour, recharger depuis le stockage (notifs marquées lues)
                  await _loadNotificationsFromLocal();
                },
              ),
            ),
            if (_unread > 0)
              Positioned(
                right: -2, top: -2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '$_unread',
                    style: const TextStyle(
                      color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfilCard(Map<String, dynamic> data) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 8,
                offset: const Offset(0, 4))
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              backgroundImage: AssetImage(data['image']),
              radius: 50,
            ),
            const SizedBox(height: 10),
            Text(data['name'],
                style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0A1A33))),
            Text(data['age'], style: const TextStyle(color: Colors.black54)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              icon: const Icon(Icons.calendar_month),
              label: Text(data['button']),
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0A1A33)),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => CalendrierVaccinalScreen(
                            child: widget.child,
                            apiBase: widget.apiBase,
                          )),
                );
              },
            ),
          ],
        ),
      );

  Widget _buildCampagneCard(Map<String, dynamic> d) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFFEAF3FF),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(d['image'], height: 130),
            const SizedBox(height: 10),
            Text(d['title'],
                style: const TextStyle(
                    fontWeight: FontWeight.bold, color: Color(0xFF0A1A33))),
            Text(d['subtitle'], textAlign: TextAlign.center),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0A1A33)),
              child: Text(d['button']),
            )
          ],
        ),
      );

  Widget _buildConseilCard(Map<String, dynamic> d) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3E9),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(d['image'], height: 130),
            const SizedBox(height: 10),
            Text(d['title'],
                style: const TextStyle(
                    fontWeight: FontWeight.bold, color: Color(0xFF0A1A33))),
            Text(d['subtitle'], textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF0A1A33)),
              ),
              child: Text(d['button'],
                  style: const TextStyle(color: Colors.black)),
            )
          ],
        ),
      );

  Widget _buildNotificationCard(Map<String, dynamic> n) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8F9FB),
          borderRadius: BorderRadius.circular(12),
          // ⭐ bordure si non-lu
          border: n['read'] == false
              ? Border.all(color: const Color(0xFF0A1A33), width: 0.6)
              : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(n['icon'] ?? "🔔", style: const TextStyle(fontSize: 24)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(n['title'] ?? "Notification",
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0A1A33))),
                  Text(n['message'] ?? "",
                      style: const TextStyle(color: Colors.black87)),
                  Text(n['date'] ?? "",
                      style: const TextStyle(
                          fontSize: 12, color: Colors.black45)),
                ],
              ),
            )
          ],
        ),
      );
}