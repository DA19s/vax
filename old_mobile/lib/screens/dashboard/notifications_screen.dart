import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../../services/notification_store.dart';

class NotificationsScreen extends StatefulWidget {
  final String apiBase;
  final String? token;
  final Map<String, dynamic> child;
  final VoidCallback? onNotificationChanged; // Callback pour notifier les changements

  const NotificationsScreen({
    super.key,
    required this.apiBase,
    this.token,
    required this.child,
    this.onNotificationChanged,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final storage = const FlutterSecureStorage();
  List<Map<String, dynamic>> _notifications = [];
  List<Map<String, dynamic>> _filteredNotifications = [];
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // ✅ Clé unique centralisée pour le parent
  String get _parentPhone {
    final m = widget.child;
    return (m['parentPhone'] ?? m['parentInfo']?['phone'] ?? '').toString();
  }
  
  String get _childId {
    final m = widget.child;
    for (final k in ['_id','id','childId','child_id']) {
      final v = m[k];
      if (v != null && v.toString().trim().isNotEmpty) return v.toString();
    }
    return '';
  }

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
    _loadGlobalNotifications();      // ✅ Charger depuis store centralisé
    _fetchNotificationsFromBackend(); // merge backend + save
    _connectToSocket();              // save dans store centralisé

    // ⭐ Marquer tout lu après 3 secondes (laisser le temps de voir)
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        _markAllReadGlobal();
      }
    });
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    // Plus de socket à nettoyer - géré par ModernDashboardScreen
    super.dispose();
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text.toLowerCase();
      _filterAndSortNotifications();
    });
  }

  void _filterAndSortNotifications() {
    // 1. Trier par date (plus récent en haut)
    final sorted = List<Map<String, dynamic>>.from(_notifications);
    sorted.sort((a, b) {
      final dateA = _parseNotificationDate(a['date'] ?? '');
      final dateB = _parseNotificationDate(b['date'] ?? '');
      return dateB.compareTo(dateA); // Plus récent en premier
    });

    // 2. Filtrer par recherche
    if (_searchQuery.isEmpty) {
      _filteredNotifications = sorted;
    } else {
      _filteredNotifications = sorted.where((n) {
        final title = (n['title'] ?? '').toString().toLowerCase();
        final message = (n['message'] ?? '').toString().toLowerCase();
        return title.contains(_searchQuery) || message.contains(_searchQuery);
      }).toList();
    }
  }

  DateTime _parseNotificationDate(String dateStr) {
    try {
      // Format: "dd MMM yyyy HH:mm"
      return DateFormat('dd MMM yyyy HH:mm').parse(dateStr);
    } catch (e) {
      return DateTime.now();
    }
  }

  Future<void> _deleteNotification(String notifId) async {
    // 1. Supprimer localement d'abord (pour l'UI responsive)
    setState(() {
      _notifications.removeWhere((n) => n['id'] == notifId);
      _filterAndSortNotifications();
    });
    await _saveGlobalNotifications();
    
    // 2. Appeler le backend pour masquer la notification (soft delete)
    await _hideNotificationOnBackend(notifId);
    
    // 3. Notifier le dashboard du changement
    if (widget.onNotificationChanged != null) {
      widget.onNotificationChanged!();
    }
    
    debugPrint("🗑️ Notification supprimée: $notifId");
  }
  
  Future<void> _hideNotificationOnBackend(String notifId) async {
    try {
      // Trouver la notification pour récupérer son serverId (ID MongoDB)
      final notification = _notifications.firstWhere(
        (n) => n['id'] == notifId,
        orElse: () => <String, dynamic>{},
      );
      
      final serverId = notification['serverId'];
      if (serverId == null || serverId.toString().isEmpty) {
        debugPrint("⚠️ Pas de serverId pour masquer la notification: $notifId");
        return;
      }
      
      // Récupérer le token
      String? token = widget.token;
      if (token == null || token.isEmpty) {
        token = await storage.read(key: 'auth_token');
      }
      
      if (token == null || token.isEmpty) {
        debugPrint("⚠️ Pas de token pour masquer la notification");
        return;
      }
      
      final headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      };
      
      final res = await http.post(
        Uri.parse("${widget.apiBase}/api/notifications/$serverId/hide"),
        headers: headers,
      );
      
      if (res.statusCode == 200) {
        debugPrint("✅ Notification masquée sur le backend: $serverId (local: $notifId)");
      } else {
        debugPrint("⚠️ Erreur masquage backend (${res.statusCode}): ${res.body}");
      }
    } catch (e) {
      debugPrint("🚨 Erreur masquage backend: $e");
    }
  }
  
  Future<void> _hideNotificationOnBackendWithId(String serverId) async {
    try {
      // Récupérer le token
      String? token = widget.token;
      if (token == null || token.isEmpty) {
        token = await storage.read(key: 'auth_token');
      }
      
      if (token == null || token.isEmpty) {
        debugPrint("⚠️ Pas de token pour masquer la notification");
        return;
      }
      
      final headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      };
      
      final res = await http.post(
        Uri.parse("${widget.apiBase}/api/notifications/$serverId/hide"),
        headers: headers,
      );
      
      if (res.statusCode == 200) {
        debugPrint("✅ Notification masquée sur le backend: $serverId");
      } else {
        debugPrint("⚠️ Erreur masquage backend (${res.statusCode}): ${res.body}");
      }
    } catch (e) {
      debugPrint("🚨 Erreur masquage backend: $e");
    }
  }

  /// ✅ Charger depuis le store centralisé
  Future<void> _loadGlobalNotifications() async {
    if (_parentPhone.isEmpty) {
      debugPrint("⚠️ Pas de numéro parent - impossible de charger les notifications");
      return;
    }
    
    _notifications = await NotificationStore.loadGlobal(_parentPhone);
    debugPrint("📦 Notifications centralisées chargées: ${_notifications.length} pour $_parentPhone");
    _filterAndSortNotifications();
    setState(() {});
  }

  /// ✅ Sauvegarder dans le store centralisé
  Future<void> _saveGlobalNotifications() async {
    if (_parentPhone.isEmpty) return;
    await NotificationStore.saveGlobal(_parentPhone, _notifications);
    debugPrint("💾 Notifications sauvegardées globalement (${_notifications.length})");
  }

  /// ✅ Marquer tout lu et persister
  Future<void> _markAllReadGlobal() async {
    if (_parentPhone.isEmpty) return;
    
    await NotificationStore.markAllRead(_parentPhone);
    
    // Mettre à jour la vue actuelle
    setState(() {
      for (final n in _notifications) {
        n['read'] = true;
      }
    });
    debugPrint("✅ Toutes les notifications marquées lues (persistées globalement).");
  }

  Future<void> _fetchNotificationsFromBackend() async {
    try {
      // Récupérer le token depuis le storage si non fourni en widget
      String? token = widget.token;
      if (token == null || token.isEmpty) {
        token = await storage.read(key: 'auth_token');
      }
      
      debugPrint("📡 Fetch notifications - Token: ${token != null ? '${token.substring(0, 20)}...' : 'NULL'}");
      
      final headers = {
        "Content-Type": "application/json",
        if (token != null && token.isNotEmpty) "Authorization": "Bearer $token",
      };
      
      final res = await http.get(
        Uri.parse("${widget.apiBase}/api/notifications"),
        headers: headers,
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final notifs = (data["notifications"] as List?) ?? [];

        final fetched = notifs.map<Map<String, dynamic>>((n) {
          final dt = DateTime.tryParse(n["createdAt"] ?? '') ?? DateTime.now();
          final formatted = DateFormat('dd MMM yyyy HH:mm').format(dt);
          final id = '${dt.millisecondsSinceEpoch}_${n["title"] ?? "Notification"}';
          return {
            'serverId': (n["_id"] ?? '').toString(), // ⭐ id mongo
            'icon': n["icon"] ?? "🔔",
            'title': n["title"] ?? "Notification",
            'message': n["message"] ?? "",
            'date': formatted,
            'type': (n["type"] ?? 'systeme').toString(),
            'id': id,
            'read': false,
          };
        }).toList();

        if (fetched.isEmpty) {
          debugPrint("ℹ️ Backend a renvoyé 0 notif — on conserve le cache local.");
          return;
        }

        // ✅ Fusionner avec les notifications existantes
        setState(() {
          _notifications = NotificationStore.mergeUnique(_notifications, fetched);
          _filterAndSortNotifications();
        });
        await _saveGlobalNotifications();
      } else {
        debugPrint("⚠️ Erreur HTTP : ${res.statusCode}");
      }
    } catch (e) {
      debugPrint("🚨 Erreur fetch backend: $e");
    }
  }

  void _connectToSocket() {
    // ✅ Plus de Socket.io ici - ModernDashboardScreen gère tout centralement
    // Charger simplement les notifications depuis le cache local
    debugPrint("📦 NotificationsScreen: Chargement depuis cache local uniquement");
    _loadGlobalNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Notifications",
          style: TextStyle(
            color: Color(0xFF0A1A33),
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Color(0xFF0A1A33)),
        elevation: 1,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(70),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: '🔍 Rechercher une notification...',
                filled: true,
                fillColor: const Color(0xFFF8F9FB),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.black54),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
              ),
            ),
          ),
        ),
      ),
      backgroundColor: Colors.white,
      body: _notifications.isEmpty
          ? const Center(
              child: Text(
                "Aucune notification pour le moment 📭",
                style: TextStyle(color: Colors.black54),
              ),
            )
          : _filteredNotifications.isEmpty
              ? const Center(
                  child: Text(
                    "Aucun résultat pour cette recherche 🔍",
                    style: TextStyle(color: Colors.black54),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _filteredNotifications.length,
                  itemBuilder: (context, i) => _buildNotificationCard(
                    _filteredNotifications[i],
                  ),
                ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> n) {
    final notifId = n['id'] ?? '';
    return Dismissible(
      key: Key(notifId),
      direction: DismissDirection.endToStart,
      confirmDismiss: (direction) async {
        // Slide fort = supprime direct, slide léger = demande confirmation
        return true;
      },
      onDismissed: (direction) {
        // Sauvegarder la notification pour restauration rapide
        final deletedNotif = Map<String, dynamic>.from(n);
        final serverId = deletedNotif['serverId']; // Récupérer serverId avant suppression
        bool isDeleted = true;
        
        // Supprimer localement d'abord
        setState(() {
          _notifications.removeWhere((notif) => notif['id'] == notifId);
          _filterAndSortNotifications();
        });
        _saveGlobalNotifications();
        
        // Notifier le dashboard
        if (widget.onNotificationChanged != null) {
          widget.onNotificationChanged!();
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🗑️ ${n['title']} supprimée'),
            duration: const Duration(seconds: 3),
            action: SnackBarAction(
              label: 'Annuler',
              onPressed: () {
                if (isDeleted) {
                  // Restaurer seulement localement (pas sur le backend)
                  setState(() {
                    _notifications.insert(0, deletedNotif);
                    _filterAndSortNotifications();
                  });
                  _saveGlobalNotifications();
                  
                  // Notifier le dashboard de la restauration
                  if (widget.onNotificationChanged != null) {
                    widget.onNotificationChanged!();
                  }
                  
                  isDeleted = false;
                  debugPrint("🔄 Notification restaurée localement: $notifId");
                }
              },
            ),
          ),
        ).closed.then((_) {
          // Quand la SnackBar disparaît, masquer définitivement sur le backend
          if (isDeleted && serverId != null && serverId.toString().isNotEmpty) {
            _hideNotificationOnBackendWithId(serverId.toString());
          }
        });
      },
      background: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.red,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.centerRight,
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Icon(Icons.delete, color: Colors.white, size: 28),
            SizedBox(width: 8),
            Text(
              'Supprimer',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8F9FB),
          borderRadius: BorderRadius.circular(12),
          border: n['read'] == false
              ? Border.all(color: const Color(0xFF0A1A33), width: 0.6)
              : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(n['icon'] ?? "🔔", style: const TextStyle(fontSize: 26)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(n['title'] ?? "Notification",
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0A1A33),
                          fontSize: 16)),
                  const SizedBox(height: 4),
                  Text(n['message'] ?? "",
                      style: const TextStyle(color: Colors.black87)),
                  const SizedBox(height: 6),
                  Text(n['date'] ?? "",
                      style: const TextStyle(
                          fontSize: 12, color: Colors.black45)),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}