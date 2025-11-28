import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../services/api_service.dart';
import 'request_appointment_screen.dart';
import 'my_requests_screen.dart';

class AppointmentsScreen extends StatefulWidget {
  final String childId;

  const AppointmentsScreen({super.key, required this.childId});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> with WidgetsBindingObserver {
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  String _selectedFilter = 'all';  // 🔄 Changé de 'upcoming' à 'all' pour tout voir
  List<Map<String, dynamic>> _appointments = [];
  IO.Socket? socket;
  String _childName = ''; // Nom de l'enfant pour l'affichage

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadAppointments();
    _connectToSocket();  // 🔌 Connexion Socket.io
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    socket?.disconnect();
    socket?.dispose();
    super.dispose();
  }
  
  /// 🔌 Connexion Socket.io pour auto-rafraîchissement
  void _connectToSocket() {
    try {
      socket = IO.io(
        'http://localhost:5000',
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .build(),
      );
      
      socket!.connect();
      
      socket!.on('connect', (_) {
        print('✅ AppointmentsScreen: Socket connecté');
      });
      
      // 🔄 Écouter les notifications de vaccination (rendez-vous)
      socket!.off('newNotification'); // Supprimer les anciens listeners
      socket!.on('newNotification', (data) {
        print('📩 AppointmentsScreen: Notification reçue: $data');
        if (data is Map && data['type'] == 'vaccination') {
          print('🔄 Notification vaccination → Rechargement rendez-vous...');
          _loadAppointments();  // Recharger la liste
        }
      });
      
      socket!.on('disconnect', (_) {
        print('❌ AppointmentsScreen: Socket déconnecté');
      });
    } catch (e) {
      print('⚠️ Erreur connexion socket: $e');
    }
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Recharger les données quand l'écran reprend le focus
      print("🔄 Écran Appointments repris - Rechargement...");
      _loadAppointments();
    }
  }

  Future<void> _loadAppointments() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final appointments = await ApiService.getAppointments(widget.childId);

      setState(() {
        _appointments = appointments
            .map((apt) {
              final dn = apt['doseNumber'];
              final doseLabel = (dn is num && dn > 0) ? 'Dose ${dn.toInt()}' : null;
              
              // Récupérer le nom de l'enfant depuis les données (si disponible)
              if (apt['child'] != null && _childName.isEmpty) {
                final child = apt['child'];
                if (child is Map) {
                  _childName = '${child['prenom'] ?? ''} ${child['nom'] ?? ''}'.trim();
                }
              }
              
              return {
                'id': apt['_id'] ?? apt['id'],
                'vaccine': apt['vaccineName'] ?? apt['title'] ?? 'Rendez-vous',
                'date': DateTime.parse(
                    apt['date'] ?? apt['scheduledDate'] ?? DateTime.now().toIso8601String()),
                'time': apt['time'] ??
                    DateFormat('HH:mm').format(
                        DateTime.parse(apt['date'] ?? DateTime.now().toIso8601String())),
                'location': apt['location'] ?? apt['healthCenter'] ?? 'Centre de santé',
                'status': _mapAppointmentStatus(apt['status']),
                'notes': apt['notes'] ?? apt['description'],
                'dose': doseLabel,
              };
            })
            .toList();
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

  // Naviguer vers l'écran de demande de rendez-vous
  Future<void> _requestAppointment(String vaccine) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RequestAppointmentScreen(
          childId: widget.childId,
          vaccine: vaccine,
          childName: _childName.isNotEmpty ? _childName : 'Enfant',
        ),
      ),
    );

    // Si la demande a été créée avec succès, recharger les rendez-vous
    if (result == true) {
      _loadAppointments();
    }
  }

  String _mapAppointmentStatus(String? apiStatus) {
    switch (apiStatus?.toLowerCase()) {
      case 'confirmed':
      case 'scheduled':
      case 'planned':        // ← Ajouté
        return 'scheduled';
      case 'pending':
      case 'waiting':
        return 'pending';
      case 'completed':
      case 'done':
        return 'done';
      case 'missed':
      case 'rater':
        return 'missed';
      case 'cancelled':
      case 'canceled':
      case 'refused':        // ← Ajouté
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  List<Map<String, dynamic>> get _filteredAppointments {
    final now = DateTime.now();
    List<Map<String, dynamic>> filtered;
    
    switch (_selectedFilter) {
      case 'upcoming':
        filtered = _appointments
            .where((a) =>
                a['status'] == 'scheduled' || a['status'] == 'pending')
            .toList();
        break;
      case 'past':
        filtered = _appointments
            .where((a) =>
                a['status'] == 'done' || a['status'] == 'missed' || a['status'] == 'cancelled')
            .toList();
        break;
      default:
        filtered = _appointments;
    }
    
    // 🔄 TRI AUTOMATIQUE : Programmés en haut, Faits/Ratés en bas
    filtered.sort((a, b) {
      final statusA = a['status'];
      final statusB = b['status'];
      final dateA = a['date'] as DateTime;
      final dateB = b['date'] as DateTime;
      
      // Ordre de priorité des statuts
      int getPriority(String status) {
        switch (status) {
          case 'scheduled': return 1; // Programmés en premier
          case 'pending': return 2;   // En attente
          case 'done': return 3;      // Faits
          case 'missed': return 4;    // Ratés
          case 'cancelled': return 5; // Annulés
          default: return 6;
        }
      }
      
      final priorityA = getPriority(statusA);
      final priorityB = getPriority(statusB);
      
      // Si même priorité, trier par date
      if (priorityA == priorityB) {
        // Pour programmés : plus proche en premier
        if (statusA == 'scheduled' || statusA == 'pending') {
          return dateA.compareTo(dateB);
        }
        // Pour faits/ratés : plus récent en premier
        return dateB.compareTo(dateA);
      }
      
      return priorityA.compareTo(priorityB);
    });
    
    return filtered;
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'scheduled':
        return AppColors.info;        // Bleu pour programmé
      case 'pending':
        return AppColors.warning;     // Orange pour en attente
      case 'done':
        return AppColors.success;     // ✅ VERT pour fait
      case 'missed':
        return AppColors.error;       // 🔴 ROUGE pour raté
      case 'cancelled':
        return AppColors.textSecondary;
      default:
        return AppColors.textTertiary;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'scheduled':
        return 'Programmé';
      case 'pending':
        return 'En attente';
      case 'done':
        return 'Fait';          // ✅ FAIT (vert)
      case 'missed':
        return 'Raté';          // 🔴 RATÉ (rouge)
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'scheduled':
        return Icons.event_available_rounded;
      case 'pending':
        return Icons.schedule_rounded;
      case 'done':
        return Icons.check_circle_rounded;    // ✅ Icône fait
      case 'missed':
        return Icons.error_rounded;           // 🔴 Icône raté
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.event_rounded;
    }
  }

  Widget _buildAppointmentCard(Map<String, dynamic> appointment) {
    final date = appointment['date'] as DateTime;
    final statusColor = _getStatusColor(appointment['status']);

    return AppCard(
      margin: const EdgeInsets.only(
          left: AppSpacing.md, right: AppSpacing.md, bottom: AppSpacing.md),
      onTap: () {
        // TODO: Show appointment details
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Date
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Column(
                  children: [
                    Text(
                      DateFormat('dd').format(date),
                      style: AppTextStyles.h3.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      DateFormat('MMM', 'fr_FR')
                          .format(date)
                          .toUpperCase(),
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.primary,
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
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            appointment['vaccine'],
                            style: AppTextStyles.bodyMedium
                                .copyWith(fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (appointment['dose'] != null) ...[
                          const SizedBox(width: AppSpacing.xs),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.info.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              appointment['dose'],
                              style: AppTextStyles.caption.copyWith(
                                color: AppColors.info,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ]
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Row(
                      children: [
                        const Icon(Icons.access_time_rounded,
                            size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: AppSpacing.xxs),
                        Text(appointment['time'],
                            style: AppTextStyles.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.xs),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_getStatusIcon(appointment['status']),
                        size: 14, color: statusColor),
                    const SizedBox(width: AppSpacing.xxs),
                    Text(
                      _getStatusLabel(appointment['status']),
                      style: AppTextStyles.caption.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              const Icon(Icons.location_on_outlined,
                  size: 16, color: AppColors.textSecondary),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text(
                  appointment['location'],
                  style: AppTextStyles.bodySmall
                      .copyWith(color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
          if (appointment['notes'] != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.infoLight,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded,
                      size: 16, color: AppColors.info),
                  const SizedBox(width: AppSpacing.xs),
                  Expanded(
                    child: Text(appointment['notes'],
                        style: AppTextStyles.bodySmall
                            .copyWith(color: AppColors.info)),
                  ),
                ],
              ),
            ),
          ],
          // 🚨 MESSAGE SPÉCIAL POUR VACCINS RATÉS
          if (appointment['status'] == 'missed') ...[
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.warning_rounded,
                          size: 18, color: AppColors.error),
                      const SizedBox(width: AppSpacing.xs),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Vaccin raté',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.error,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xxs),
                            Text(
                              'Trouvez rapidement un centre avec stock disponible.',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.error,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _requestAppointment(appointment['vaccine']),
                      icon: const Icon(Icons.search_rounded, size: 16),
                      label: const Text('Demander un RDV'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          // ✅ DEMANDE RDV SUPPRIMÉE POUR VACCINS PROGRAMMÉS
          // Seuls les vaccins ratés permettent de faire une demande RDV
        ],
      ),
    );
  }

  Widget _buildAppointmentsList() {
    final filteredList = _filteredAppointments;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            children: [
              _buildFilterChip('À venir', 'upcoming'),
              const SizedBox(width: AppSpacing.sm),
              _buildFilterChip('Passés', 'past'),
              const SizedBox(width: AppSpacing.sm),
              _buildFilterChip('Tous', 'all'),
            ],
          ),
        ),
        Expanded(
          child: filteredList.isEmpty
              ? EmptyState(
                  icon: Icons.event_busy_rounded,
                  title: 'Aucun rendez-vous',
                  message:
                      'Vous n\'avez aucun rendez-vous $_selectedFilter',
                  buttonText: 'Prendre rendez-vous',
                  onButtonPressed: () {
                    // TODO: Add appointment
                  },
                )
              : RefreshIndicator(
                  onRefresh: _loadAppointments,
                  color: AppColors.primary,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(
                        top: AppSpacing.sm, bottom: AppSpacing.xl),
                    itemCount: filteredList.length,
                    itemBuilder: (context, index) =>
                        _buildAppointmentCard(filteredList[index]),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(
            color: isSelected ? AppColors.surface : AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Rendez-vous'),
        actions: [
          IconButton(
            icon: const Icon(Icons.list_alt_rounded),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => MyRequestsScreen(
                    childId: widget.childId,
                    childName: _childName.isNotEmpty ? _childName : 'Enfant',
                  ),
                ),
              );
            },
            tooltip: 'Mes demandes de RDV',
          ),
        ],
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Chargement des rendez-vous...')
          : _hasError
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded,
                          size: 64, color: AppColors.error),
                      const SizedBox(height: AppSpacing.md),
                      Text('Erreur de chargement', style: AppTextStyles.h3),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        _errorMessage,
                        style: AppTextStyles.bodyMedium
                            .copyWith(color: AppColors.textSecondary),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      ElevatedButton(
                        onPressed: _loadAppointments,
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                )
              : _buildAppointmentsList(),
    );
  }
}