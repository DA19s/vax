import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../services/api_service.dart';
import '../../services/settings_service.dart';
import '../../services/notification_store.dart';
import '../../models/system_settings.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../vaccination/vaccination_list_screen.dart';
import '../appointments/appointments_screen.dart';
import '../conseils/health_tips_screen.dart';
import '../stats/health_stats_screen.dart';
import '../profil/profile_screen.dart';
import '../campagnes/campagne_screen.dart';
import 'calendrier_screen.dart';
import 'notifications_screen.dart';

class ModernDashboardScreen extends StatefulWidget {
  final Map<String, dynamic> child;
  
  const ModernDashboardScreen({super.key, required this.child});
  
  @override
  State<ModernDashboardScreen> createState() => _ModernDashboardScreenState();
}

class _ModernDashboardScreenState extends State<ModernDashboardScreen> with TickerProviderStateMixin {
  final storage = const FlutterSecureStorage();
  int _currentIndex = 0;
  IO.Socket? socket;
  
  // Loading states
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  
  // API Data
  int _notificationCount = 0;
  int _totalVaccines = 0;
  int _completedVaccines = 0;
  int _missedVaccines = 0;
  int _remainingVaccines = 0;
  int _upcomingAppointments = 0;
  List<Map<String, dynamic>> _recentActivities = [];
  List<Map<String, dynamic>> _upcomingAppointmentsList = [];
  
  // Slideshow pour header
  late PageController _pageController;
  int _currentPage = 0;
  late AnimationController _fadeController;
  
  // Settings système
  SystemSettings? _settings;
  
  // Images et textes du slideshow (dynamiques depuis settings)
  List<Map<String, String>> get _headerSlides {
    if (_settings == null) {
      return [
        {
          'image': 'assets/images/onboarding1.png',
          'title': 'Suivi Vaccinal Complet',
          'subtitle': 'Tous les vaccins de votre enfant en un clin d\'œil',
        },
        {
          'image': 'assets/images/onboarding2.png',
          'title': 'Rendez-vous à Venir',
          'subtitle': 'Ne manquez jamais un rendez-vous important',
        },
        {
          'image': 'assets/images/onboarding3.png',
          'title': 'Santé de Votre Enfant',
          'subtitle': 'Suivez la croissance et le développement',
        },
      ];
    }
    
    return [
      {
        'image': _settings!.dashboardSlide1Image ?? 'assets/images/onboarding1.png',
        'title': _settings!.dashboardSlide1Title ?? 'Suivi Vaccinal Complet',
        'subtitle': _settings!.dashboardSlide1Subtitle ?? 'Tous les vaccins de votre enfant en un clin d\'œil',
      },
      {
        'image': _settings!.dashboardSlide2Image ?? 'assets/images/onboarding2.png',
        'title': _settings!.dashboardSlide2Title ?? 'Rendez-vous à Venir',
        'subtitle': _settings!.dashboardSlide2Subtitle ?? 'Ne manquez jamais un rendez-vous important',
      },
      {
        'image': _settings!.dashboardSlide3Image ?? 'assets/images/onboarding3.png',
        'title': _settings!.dashboardSlide3Title ?? 'Santé de Votre Enfant',
        'subtitle': _settings!.dashboardSlide3Subtitle ?? 'Suivez la croissance et le développement',
      },
    ];
  }
  
  // Child info getters
  String get childName => widget.child['name'] ?? 'Enfant';
  String get childId => widget.child['id'] ?? widget.child['_id'] ?? '';
  
  @override
  void initState() {
    super.initState();
    print("🎯🎯🎯 MODERN DASHBOARD SCREEN - initState APPELÉ 🎯🎯🎯");
    print("📋 Child data: ${widget.child}");
    
    // Initialiser le slideshow
    _pageController = PageController();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    
    // Charger les settings système
    _loadSettings();
    
    // Démarrer le slideshow automatique
    _startAutoSlide();
    
    _loadDashboardData();
    _connectToSocket();
    _migrateNotifications(); // ✅ Migrer les anciennes notifications
  }
  
  /// ✅ Migrer les anciennes notifications vers le système centralisé
  Future<void> _migrateNotifications() async {
    try {
      final parentPhone = (widget.child['parentPhone'] ?? widget.child['parentInfo']?['phone'] ?? '').toString();
      if (parentPhone.isEmpty) {
        print("⚠️ Pas de numéro parent pour la migration");
        return;
      }
      
      // Récupérer tous les IDs d'enfants du parent (pour l'instant juste celui-ci)
      final childIds = [childId];
      
      // Migrer toutes les notifications
      await NotificationStore.migrateToGlobal(parentPhone, childIds);
      
      // Charger et compter les notifications centralisées
      final allNotifications = await NotificationStore.loadGlobal(parentPhone);
      final unread = NotificationStore.unreadCount(allNotifications);
      
      if (mounted) {
        setState(() {
          _notificationCount = unread;
        });
      }
      
      print("✅ Migration terminée - $unread notifications non lues");
    } catch (e) {
      print("⚠️ Erreur migration notifications: $e");
    }
  }
  
  /// Charge les paramètres système depuis le serveur
  Future<void> _loadSettings() async {
    try {
      final settings = await SettingsService.getSystemSettings();
      if (mounted) {
        setState(() {
          _settings = settings;
        });
      }
    } catch (e) {
      debugPrint('⚠️ Erreur chargement settings dashboard: $e');
      // Continuer avec les valeurs par défaut
    }
  }
  
  void _startAutoSlide() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _pageController.hasClients) {
        final nextPage = (_currentPage + 1) % _headerSlides.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOut,
        ).then((_) {
          if (mounted) {
            setState(() => _currentPage = nextPage);
            _startAutoSlide();
          }
        });
      }
    });
  }
  
  @override
  void dispose() {
    _pageController.dispose();
    _fadeController.dispose();
    socket?.disconnect();
    socket?.dispose();
    super.dispose();
  }
  
  // Fonction pour recharger les notifications après suppression
  Future<void> _refreshNotifications() async {
    try {
      final notifications = await ApiService.getNotifications(childId);
      setState(() {
        _notificationCount = notifications.where((n) => !(n['read'] ?? false)).length;
      });
      debugPrint("🔄 Notifications rechargées: $_notificationCount non lues");
    } catch (e) {
      debugPrint("⚠️ Erreur refresh notifications: $e");
    }
  }
  
  Future<void> _loadDashboardData() async {
    try {
      setState(() {
        _isLoading = true;
        _hasError = false;
      });
      
      // Charger toutes les données en parallèle
      final futures = await Future.wait([
        ApiService.getVaccinationStats(childId),
        ApiService.getNotifications(childId),
        ApiService.getAppointments(childId),
        ApiService.getRecentActivity(childId),
      ]);
      
      final stats = futures[0] as Map<String, dynamic>;
      final notifications = futures[1] as List<Map<String, dynamic>>;
      final appointments = futures[2] as List<Map<String, dynamic>>;
      final activities = futures[3] as List<Map<String, dynamic>>;
      
      setState(() {
        // Stats vaccinations
        _totalVaccines = stats['totalVaccines'] ?? 0;
        _completedVaccines = stats['completedVaccines'] ?? 0;
        _missedVaccines = stats['missedVaccines'] ?? 0;
        _remainingVaccines = stats['remainingVaccines'] ?? 0;
        
        // Notifications non lues
        _notificationCount = notifications.where((n) => !(n['read'] ?? false)).length;
        
        // 📅 Rendez-vous à venir - SEULEMENT LE PROCHAIN (le plus proche)
        final now = DateTime.now();
        
        // Filtrer les rendez-vous programmés/à venir
        final futureAppointments = appointments
            .where((apt) {
              try {
                final status = apt['status']?.toString().toLowerCase();
                // Statuts considérés comme "à venir"
                final isUpcoming = status == 'scheduled' || 
                                   status == 'pending' || 
                                   status == 'planned' ||
                                   status == 'confirmed' || 
                                   status == 'waiting';
                
                if (!isUpcoming) return false;
                
                // Vérifier que la date est dans le futur
                final dateStr = apt['date'] ?? apt['scheduledDate'];
                if (dateStr == null) return false;
                
                final date = DateTime.parse(dateStr);
                return date.isAfter(now);
              } catch (e) {
                print("⚠️ Erreur parsing appointment: $e");
                return false;
              }
            })
            .toList();
        
        // Trier par date pour trouver le plus proche
        futureAppointments.sort((a, b) {
          try {
            final dateA = DateTime.parse(a['date'] ?? a['scheduledDate'] ?? now.toIso8601String());
            final dateB = DateTime.parse(b['date'] ?? b['scheduledDate'] ?? now.toIso8601String());
            return dateA.compareTo(dateB);
          } catch (e) {
            return 0;
          }
        });
        
        // Ne garder que le PROCHAIN (le plus proche)
        _upcomingAppointmentsList = futureAppointments.take(1).toList();
        _upcomingAppointments = futureAppointments.length; // Total des rendez-vous à venir
        
        print("📅 Rendez-vous à venir: ${futureAppointments.length}");
        if (_upcomingAppointmentsList.isNotEmpty) {
          print("  → Prochain: ${_upcomingAppointmentsList[0]['vaccineName']} le ${_upcomingAppointmentsList[0]['date']}");
        }
        
        // Activités récentes
        _recentActivities = activities.take(3).toList();
        
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _hasError = true;
        _errorMessage = e.toString();
      });
    }
  }
  
  Future<void> _refreshData() async {
    await _loadDashboardData();
  }
  
  /// 🔌 Connexion Socket.io pour recevoir les notifications en temps réel
  void _connectToSocket() {
    print("🚀🚀🚀 _connectToSocket APPELÉ 🚀🚀🚀");
    
    final baseUrl = 'http://localhost:5000';
    
    String _extractChildId(Map<String, dynamic> m) {
      final candidates = ['_id', 'id', 'childId', 'child_id'];
      for (final k in candidates) {
        final v = m[k];
        if (v != null && v.toString().trim().isNotEmpty) return v.toString();
      }
      return '';
    }
    
    final childId = _extractChildId(widget.child);
    // Créer un userId unique pour chaque parent-enfant pour éviter les conflits
    final baseUserId = widget.child['userId'] ?? widget.child['parentId'] ?? 'parent';
    final parentUserId = "${baseUserId}_child_$childId"; // Unique par parent+enfant
    final parentPhone = (widget.child['parentPhone'] ?? widget.child['parentInfo']?['parentPhone'] ?? '').toString();
    
    print("🔌 ModernDashboard Socket → $baseUrl | child=$childId | phone=$parentPhone");
    print("🆔 Parent User ID unique: $parentUserId");
    print("🏠 Child data: ${widget.child}");
    
    socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setReconnectionAttempts(10)
          .setReconnectionDelay(2000)
          .disableAutoConnect()
          .build(),
    );
    
    print("🔗 Tentative de connexion Socket.io...");
    socket!.connect();
    
    socket!.onConnect((_) {
      print("✅✅✅ ModernDashboard Socket CONNECTÉ ✅✅✅");
      
      final roomsOnRegister = [
        "parent",
        "all",
        if (childId.isNotEmpty)
          "child_$childId",
        if (childId.isNotEmpty && parentPhone.isNotEmpty)
          "parent_${parentPhone}_child_$childId",
      ];
      
      print("📤 Rooms à enregistrer: $roomsOnRegister");
      
      socket!.emit("registerUser", {
        "userId": parentUserId,
        "role": "parent",
        "rooms": roomsOnRegister,
        "parentPhone": parentPhone,
        "childId": childId,
      });
      
      print("📤 registerUser envoyé");
    });
    
    socket!.on("joinedRooms", (rooms) {
      print("✅ ModernDashboard Rooms rejointes: $rooms");
    });
    
    // 📩 Écouter les nouvelles notifications - CENTRALISÉ
    socket!.off("newNotification");
    socket!.on("newNotification", (data) async {
      print("📩📩📩 NOTIFICATION REÇUE: $data");
      if (data is Map && data["title"] != null) {
        try {
          final notifToSave = {
            'title': data['title'],
            'message': data['message'] ?? '',
            'icon': data['icon'] ?? '🔔',
            'type': data['type'] ?? 'info',
            'date': DateFormat('dd MMM yyyy HH:mm').format(DateTime.now()),
            'read': false,
            'id': '${DateTime.now().millisecondsSinceEpoch}_${data['title']}',
            'serverId': data['_id'] ?? data['id'],
          };
          
          // ✅ Sauvegarder dans le store CENTRALISÉ (une seule fois pour tout le parent)
          final parentPhone = (widget.child['parentPhone'] ?? widget.child['parentInfo']?['phone'] ?? '').toString();
          if (parentPhone.isNotEmpty) {
            await NotificationStore.addNotificationGlobal(parentPhone, notifToSave);
            print("💾 Notification sauvegardée globalement pour parent: $parentPhone");
          }
        } catch (e) {
          print("⚠️ Erreur sauvegarde notification: $e");
        }
        
        setState(() {
          _notificationCount++;
        });
        
        // 🔄 Recharger les données si c'est une notification de vaccination
        if (data['type'] == 'vaccination') {
          print("🔄 Notification vaccination reçue - Rechargement des données...");
          _loadDashboardData();
        }
        
        // Afficher une snackbar pour la notification
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Text(data["icon"] ?? "🔔", style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          data["title"] ?? "Notification",
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        if (data["message"] != null)
                          Text(
                            data["message"],
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              backgroundColor: AppColors.primary,
              duration: const Duration(seconds: 4),
              behavior: SnackBarBehavior.floating,
              action: SnackBarAction(
                label: 'Voir',
                textColor: Colors.white,
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => NotificationsScreen(
                        apiBase: baseUrl,
                        child: widget.child,
                      ),
                    ),
                  );
                },
              ),
            ),
          );
        }
      }
    });
    
    socket!.onConnectError((error) {
      print("❌❌❌ Erreur connexion Socket.io: $error");
    });
    
    socket!.onError((error) {
      print("❌ Socket.io Error: $error");
    });
    
    socket!.onDisconnect((reason) {
      print("🔴 Socket déconnecté: $reason");
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _buildBody(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }
  
  Widget _buildBody() {
    switch (_currentIndex) {
      case 0:
        return _buildHomeTab();
      case 1:
        return VaccinationListScreen(childId: childId);
      case 2:
        return CalendrierVaccinalScreen(
          child: widget.child,
          apiBase: 'http://localhost:5000',
        );
      case 3:
        return ProfileScreen(child: widget.child);
      default:
        return _buildHomeTab();
    }
  }
  
  Widget _buildHomeTab() {
    if (_isLoading) {
      return const LoadingIndicator(message: 'Chargement du tableau de bord...');
    }
    
    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Erreur de chargement',
              style: AppTextStyles.h3,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              _errorMessage,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            ElevatedButton(
              onPressed: _refreshData,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }
    
    return RefreshIndicator(
      onRefresh: _refreshData,
      color: AppColors.primary,
      child: CustomScrollView(
        slivers: [
        // App Bar avec header
        SliverAppBar(
          expandedHeight: 180,
          floating: false,
          pinned: true,
          backgroundColor: AppColors.primary,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                // 🎬 Slideshow d'images en arrière-plan
                PageView.builder(
                  controller: _pageController,
                  itemCount: _headerSlides.length,
                  onPageChanged: (index) {
                    setState(() => _currentPage = index);
                  },
                  itemBuilder: (context, index) {
                    final slide = _headerSlides[index];
                    final imageUrl = slide['image']!;
                    
                    // Si c'est une URL http(s), utiliser CachedNetworkImage
                    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                      return CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: AppColors.primary,
                          child: const Center(
                            child: CircularProgressIndicator(color: Colors.white),
                          ),
                        ),
                        errorWidget: (context, url, error) => Image.asset(
                          'assets/images/onboarding1.png',
                          fit: BoxFit.cover,
                        ),
                      );
                    } else {
                      // Image locale
                      return Image.asset(
                        imageUrl,
                        fit: BoxFit.cover,
                      );
                    }
                  },
                ),
                
                // 💙 Overlay bleu transparent
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF0A1A33).withOpacity(0.85),
                        const Color(0xFF1A2F4F).withOpacity(0.80),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),
                
                // Contenu du header
                SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Row(
                        children: [
                          // Avatar
                          GestureDetector(
                            onTap: () => setState(() => _currentIndex = 3),
                            child: Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                color: AppColors.secondary.withOpacity(0.2),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AppColors.surface.withOpacity(0.3),
                                  width: 2,
                                ),
                              ),
                              child: Center(
                                child: _CartoonAvatar(
                                  gender: (widget.child['gender'] ?? '').toString(),
                                  size: 44,
                                ),
                              ),
                            ),
                          ),
                          
                          const SizedBox(width: AppSpacing.md),
                          
                          // Name and greeting
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Bonjour 👋',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.surface.withOpacity(0.8),
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.xxs),
                                Text(
                                  childName,
                                  style: AppTextStyles.h3.copyWith(
                                    color: AppColors.surface,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          
                          // 🔧 Bouton DEBUG - Effacer le token (TEMPORAIRE)
                          IconButton(
                            onPressed: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('🔄 Déconnexion'),
                                  content: const Text('Effacer le token et se reconnecter ?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(ctx, false),
                                      child: const Text('Annuler'),
                                    ),
                                    TextButton(
                                      onPressed: () => Navigator.pop(ctx, true),
                                      child: const Text('Oui'),
                                    ),
                                  ],
                                ),
                              );
                              if (confirm == true && mounted) {
                                await storage.deleteAll();
                                print('✅ Storage effacé - Veuillez vous reconnecter');
                                // Retour au login
                                Navigator.of(context).pushNamedAndRemoveUntil(
                                  '/',
                                  (route) => false,
                                );
                              }
                            },
                            icon: const Icon(
                              Icons.logout_outlined,
                              color: AppColors.surface,
                              size: 24,
                            ),
                            tooltip: 'Se déconnecter',
                          ),
                          
                          const SizedBox(width: AppSpacing.xs),
                          
                          // Notification badge
                          GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => NotificationsScreen(
                                    apiBase: 'http://localhost:5000',
                                    child: widget.child,
                                  ),
                                ),
                              );
                            },
                            child: Stack(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: AppColors.surface.withOpacity(0.15),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.notifications_outlined,
                                    color: AppColors.surface,
                                    size: 24,
                                  ),
                                ),
                                if (_notificationCount > 0)
                                  Positioned(
                                    right: 0,
                                    top: 0,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(
                                        color: AppColors.error,
                                        shape: BoxShape.circle,
                                      ),
                                      constraints: const BoxConstraints(
                                        minWidth: 20,
                                        minHeight: 20,
                                      ),
                                      child: Text(
                                        _notificationCount.toString(),
                                        style: const TextStyle(
                                          color: AppColors.surface,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                ),
              ],
            ),
          ),
        ),
        
        // Content
        SliverToBoxAdapter(
          child: Column(
            children: [
              const SizedBox(height: AppSpacing.lg),
              
              // Stats rapides
              _buildQuickStats(),
              
              const SizedBox(height: AppSpacing.lg),
              
              // Menu fonctionnalités principales
              const SectionHeader(
                title: 'Fonctionnalités',
                icon: Icons.grid_view_rounded,
              ),
              _buildFeaturesGrid(),
              
              const SizedBox(height: AppSpacing.lg),
              
              // Prochains rendez-vous
              SectionHeader(
                title: 'Prochain rendez-vous',
                icon: Icons.event_rounded,
                actionText: 'Voir tout',
              ),
              _buildUpcomingAppointments(),
              
              const SizedBox(height: AppSpacing.lg),
              
              // Activité récente
              const SectionHeader(
                title: 'Activité récente',
                icon: Icons.history_rounded,
              ),
              _buildRecentActivity(),
              
              const SizedBox(height: AppSpacing.xxl),
            ],
          ),
        ),
        ],
      ),
    );
  }
  
  Widget _buildQuickStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'Vaccins faits',
                  value: '$_completedVaccines',
                  icon: Icons.check_circle_outline_rounded,
                  color: AppColors.success,
                  subtitle: 'Sur $_totalVaccines',
                  onTap: () {
                    setState(() => _currentIndex = 1);
                  },
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: StatCard(
                  label: 'Vaccins ratés',
                  value: '$_missedVaccines',
                  icon: Icons.warning_amber_rounded,
                  color: AppColors.warning,
                  subtitle: 'À rattraper',
                  onTap: () {
                    setState(() => _currentIndex = 1);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Expanded(
                child: StatCard(
                  label: 'Restants',
                  value: '$_remainingVaccines',
                  icon: Icons.pending_outlined,
                  color: AppColors.info,
                  subtitle: 'À faire',
                  onTap: () {
                    setState(() => _currentIndex = 1);
                  },
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: StatCard(
                  label: 'Rendez-vous',
                  value: _upcomingAppointments.toString(),
                  icon: Icons.event_outlined,
                  color: AppColors.secondary,
                  subtitle: 'À venir',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => AppointmentsScreen(childId: childId),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildFeaturesGrid() {
    final features = [
      {
        'title': 'Vaccinations',
        'icon': Icons.vaccines_outlined,
        'color': AppColors.info,
        'onTap': () => setState(() => _currentIndex = 1),
      },
      {
        'title': 'Rendez-vous',
        'icon': Icons.calendar_today_outlined,
        'color': AppColors.secondary,
        'onTap': () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => AppointmentsScreen(childId: childId),
              ),
            ),
      },
      {
        'title': 'Calendrier',
        'icon': Icons.event_note_outlined,
        'color': AppColors.warning,
        'onTap': () => setState(() => _currentIndex = 2),
      },
      {
        'title': 'Statistiques',
        'icon': Icons.analytics_outlined,
        'color': AppColors.success,
        'onTap': () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => HealthStatsScreen(child: widget.child),
              ),
            ),
      },
      {
        'title': 'Conseils',
        'icon': Icons.lightbulb_outline_rounded,
        'color': AppColors.warning,
        'onTap': () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HealthTipsScreen()),
            ),
      },
      {
        'title': 'Campagnes',
        'icon': Icons.campaign_outlined,
        'color': AppColors.error,
        'onTap': () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const CampagneScreen()),
            ),
      },
      {
        'title': 'Notifications',
        'icon': Icons.notifications_outlined,
        'color': AppColors.info,
        'badge': _notificationCount > 0 ? _notificationCount.toString() : null,
        'onTap': () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => NotificationsScreen(
                  apiBase: 'http://localhost:5000',
                  child: widget.child,
                  onNotificationChanged: _refreshNotifications, // Callback pour recharger
                ),
              ),
            ).then((_) {
              // Recharger aussi quand on revient de l'écran notifications
              _refreshNotifications();
            }),
      },
      {
        'title': 'Profil',
        'icon': Icons.person_outline_rounded,
        'color': AppColors.primary,
        'onTap': () => setState(() => _currentIndex = 3),
      },
    ];
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: AppSpacing.md,
          mainAxisSpacing: AppSpacing.md,
          childAspectRatio: 0.85,
        ),
        itemCount: features.length,
        itemBuilder: (context, index) {
          final feature = features[index];
          return _buildFeatureCard(
            title: feature['title'] as String,
            icon: feature['icon'] as IconData,
            color: feature['color'] as Color,
            onTap: feature['onTap'] as VoidCallback,
            badge: feature['badge'] as String?,
          );
        },
      ),
    );
  }
  
  Widget _buildFeatureCard({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    String? badge,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Padding pour centrer le contenu
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xs,
                vertical: AppSpacing.sm,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Container pour l'icône avec fond coloré
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: Center(
                      child: Icon(
                        icon, 
                        color: color, 
                        size: 30,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  // Texte du titre
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Text(
                      title,
                      style: AppTextStyles.caption.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                        fontSize: 11,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            // Badge de notification
            if (badge != null)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 18,
                    minHeight: 18,
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      color: AppColors.surface,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildUpcomingAppointments() {
    if (_upcomingAppointmentsList.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: AppCard(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  Icon(
                    Icons.event_available_rounded,
                    size: 48,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Aucun rendez-vous à venir',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
    
    return Column(
      children: _upcomingAppointmentsList.map((apt) {
        final date = DateTime.parse(apt['date']);
        return AppCard(
          margin: const EdgeInsets.only(
            left: AppSpacing.md,
            right: AppSpacing.md,
            bottom: AppSpacing.sm,
          ),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => AppointmentsScreen(childId: childId),
              ),
            );
          },
          child: Row(
            children: [
              // Date badge
              Container(
                width: 56,
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.info.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Column(
                  children: [
                    Text(
                      DateFormat('dd').format(date),
                      style: AppTextStyles.h4.copyWith(
                        color: AppColors.info,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      DateFormat('MMM', 'fr_FR').format(date).toUpperCase(),
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.info,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(width: AppSpacing.md),
              
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      apt['vaccineName'] ?? apt['title'] ?? 'Rendez-vous',
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time_rounded,
                          size: 14,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: AppSpacing.xxs),
                        Text(
                          apt['time'] ?? DateFormat('HH:mm').format(date),
                          style: AppTextStyles.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textTertiary,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
  
  IconData _getActivityIcon(String type) {
    switch (type.toLowerCase()) {
      case 'vaccination':
      case 'vaccine_administered':
        return Icons.check_circle_rounded;
      case 'appointment':
      case 'appointment_scheduled':
        return Icons.event_rounded;
      case 'notification':
      case 'reminder_sent':
        return Icons.notifications_active_rounded;
      default:
        return Icons.info_rounded;
    }
  }
  
  Color _getActivityColor(String type) {
    switch (type.toLowerCase()) {
      case 'vaccination':
      case 'vaccine_administered':
        return AppColors.success;
      case 'appointment':
      case 'appointment_scheduled':
        return AppColors.info;
      case 'notification':
      case 'reminder_sent':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }
  
  Widget _buildRecentActivity() {
    if (_recentActivities.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: AppCard(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  Icon(
                    Icons.history_rounded,
                    size: 48,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Aucune activité récente',
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }
    
    return Column(
      children: _recentActivities.map((activity) {
        return AppCard(
          margin: const EdgeInsets.only(
            left: AppSpacing.md,
            right: AppSpacing.md,
            bottom: AppSpacing.sm,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _getActivityColor(activity['type'] ?? '').withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Icon(
                  _getActivityIcon(activity['type'] ?? ''),
                  color: _getActivityColor(activity['type'] ?? ''),
                  size: 24,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activity['title'] ?? 'Activité',
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      activity['description'] ?? '',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xs,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                icon: Icons.home_rounded,
                label: 'Accueil',
                index: 0,
              ),
              _buildNavItem(
                icon: Icons.vaccines_outlined,
                label: 'Vaccins',
                index: 1,
              ),
              _buildNavItem(
                icon: Icons.calendar_today_outlined,
                label: 'Calendrier',
                index: 2,
              ),
              _buildNavItem(
                icon: Icons.person_outline_rounded,
                label: 'Profil',
                index: 3,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String label,
    required int index,
  }) {
    final isActive = _currentIndex == index;

    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive ? AppColors.primary : AppColors.textTertiary,
              size: 24,
            ),
            const SizedBox(height: AppSpacing.xxs),
            Text(
              label,
              style: AppTextStyles.caption.copyWith(
                color: isActive ? AppColors.primary : AppColors.textTertiary,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

}

class _CartoonAvatar extends StatelessWidget {
  final String gender;
  final double size;
  const _CartoonAvatar({required this.gender, this.size = 44});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _CartoonAvatarPainter(gender: gender),
      ),
    );
  }
}

class _CartoonAvatarPainter extends CustomPainter {
  final String gender;
  _CartoonAvatarPainter({required this.gender});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    final bgPaint = Paint()
      ..color = const Color(0xFFFFFFFF).withOpacity(0.15);
    canvas.drawCircle(center, radius, bgPaint);

    final faceRadius = radius * 0.58;
    final faceCenter = Offset(center.dx, center.dy - radius * 0.08);
    final skinPaint = Paint()..color = const Color(0xFFFFE0B2);
    canvas.drawCircle(faceCenter, faceRadius, skinPaint);

    final isFemale = gender.toUpperCase().startsWith('F');
    final isMale = gender.toUpperCase().startsWith('M');

    final hairPaint = Paint()
      ..color = isFemale
          ? const Color(0xFF8E5A9A)
          : isMale
              ? const Color(0xFF3E4A66)
              : const Color(0xFF6B7280);

    final hairTopRect = Rect.fromCircle(center: faceCenter.translate(0, -faceRadius * 0.35), radius: faceRadius * 1.1);
    final hairPath = Path()
      ..addOval(hairTopRect)
      ..addRect(Rect.fromLTWH(0, 0, 0, 0));
    canvas.save();
    canvas.clipPath(Path()
      ..addOval(Rect.fromCircle(center: faceCenter, radius: faceRadius))
      ..addRect(Rect.fromLTWH(0, 0, 0, 0)));
    canvas.drawPath(hairPath, hairPaint);
    canvas.restore();

    if (isFemale) {
      final fringePath = Path()
        ..moveTo(faceCenter.dx - faceRadius * 0.8, faceCenter.dy - faceRadius * 0.3)
        ..quadraticBezierTo(
            faceCenter.dx,
            faceCenter.dy - faceRadius * 0.6,
            faceCenter.dx + faceRadius * 0.8,
            faceCenter.dy - faceRadius * 0.3)
        ..lineTo(faceCenter.dx + faceRadius * 0.8, faceCenter.dy - faceRadius * 0.1)
        ..quadraticBezierTo(
            faceCenter.dx,
            faceCenter.dy - faceRadius * 0.35,
            faceCenter.dx - faceRadius * 0.8,
            faceCenter.dy - faceRadius * 0.1)
        ..close();
      canvas.drawPath(fringePath, hairPaint);
    } else if (isMale) {
      final shortHairPath = Path()
        ..addArc(
          Rect.fromCircle(center: faceCenter.translate(0, -faceRadius * 0.15), radius: faceRadius * 1.02),
          -3.14,
          3.14,
        );
      canvas.drawPath(shortHairPath, hairPaint);
    }

    final eyePaint = Paint()..color = const Color(0xFF263238);
    final eyeOffsetX = faceRadius * 0.35;
    final eyeOffsetY = faceRadius * 0.1;
    canvas.drawCircle(faceCenter.translate(-eyeOffsetX, -eyeOffsetY), faceRadius * 0.08, eyePaint);
    canvas.drawCircle(faceCenter.translate(eyeOffsetX, -eyeOffsetY), faceRadius * 0.08, eyePaint);

    final smilePaint = Paint()
      ..color = const Color(0xFFB66A50)
      ..style = PaintingStyle.stroke
      ..strokeWidth = faceRadius * 0.10
      ..strokeCap = StrokeCap.round;
    final smileRect = Rect.fromCenter(
      center: faceCenter.translate(0, faceRadius * 0.30),
      width: faceRadius * 0.9,
      height: faceRadius * 0.7,
    );
    canvas.drawArc(smileRect, 0.15 * 3.14, 0.7 * 3.14, false, smilePaint);

    final shirtPaint = Paint()
      ..color = isFemale
          ? const Color(0xFFE91E63).withOpacity(0.9)
          : isMale
              ? const Color(0xFF2196F3).withOpacity(0.9)
              : const Color(0xFF10B981).withOpacity(0.9);
    final shouldersRect = Rect.fromCenter(
      center: center.translate(0, radius * 0.9),
      width: radius * 2.2,
      height: radius * 1.2,
    );
    canvas.save();
    canvas.clipPath(Path()..addOval(Rect.fromCircle(center: center, radius: radius)));
    canvas.drawOval(shouldersRect, shirtPaint);
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CartoonAvatarPainter oldDelegate) {
    return oldDelegate.gender != gender;
  }
}
