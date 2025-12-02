import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  final String apiBase;
  final Map<String, dynamic> child;
  final VoidCallback? onNotificationChanged;

  const NotificationsScreen({
    super.key,
    required this.apiBase,
    required this.child,
    this.onNotificationChanged,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final storage = const FlutterSecureStorage();
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    // Marquer toutes les notifications comme lues quand l'écran est ouvert
    _markAllAsRead();
  }

  Future<void> _markAllAsRead() async {
    try {
      final childId = widget.child['id'] ?? widget.child['_id'] ?? '';
      if (childId.isNotEmpty) {
        await ApiService.markAllNotificationsAsRead(childId);
        // Notifier le parent écran que les notifications ont changé
        if (widget.onNotificationChanged != null) {
          widget.onNotificationChanged!();
        }
      }
    } catch (e) {
      print('⚠️ Erreur lors du marquage des notifications comme lues: $e');
    }
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final childId = widget.child['id'] ?? widget.child['_id'] ?? '';
      final notifications = await ApiService.getNotifications(childId);
      
      setState(() {
        _notifications = notifications.map((n) {
          final dt = DateTime.tryParse(n["createdAt"] ?? '') ?? DateTime.now();
          return {
            'id': n['_id'] ?? n['id'] ?? '',
            'title': n['title'] ?? 'Notification',
            'message': n['message'] ?? '',
            'date': DateFormat('dd MMM yyyy HH:mm', 'fr_FR').format(dt),
            'type': n['type'] ?? 'system',
            'read': n['read'] ?? n['isRead'] ?? false,
          };
        }).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0A1A33)),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? Center(
                  child: Text(
                    'Aucune notification',
                    style: GoogleFonts.poppins(color: Colors.grey),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final notif = _notifications[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          title: Text(
                            notif['title'],
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(notif['message']),
                              const SizedBox(height: 4),
                              Text(
                                notif['date'],
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          leading: const Icon(Icons.notifications),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
