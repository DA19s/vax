import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/vaccine_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../core/widgets/empty_state.dart';
import '../../services/api_service.dart';

class VaccinationListScreen extends StatefulWidget {
  final String childId;
  
  const VaccinationListScreen({super.key, required this.childId});
  
  @override
  State<VaccinationListScreen> createState() => _VaccinationListScreenState();
}

class _VaccinationListScreenState extends State<VaccinationListScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<Map<String, dynamic>> _vaccinations = [];
  IO.Socket? socket;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _loadVaccinations();
    _connectToSocket();  // 🔌 Connexion Socket.io
  }
  
  @override
  void dispose() {
    _tabController.dispose();
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
        print('✅ VaccinationList: Socket connecté');
      });
      
      // 🔄 Écouter les notifications de vaccination
      socket!.off('newNotification'); // Supprimer les anciens listeners
      socket!.on('newNotification', (data) {
        print('📩 VaccinationList: Notification reçue: $data');
        if (data is Map && data['type'] == 'vaccination') {
          print('🔄 Notification vaccination → Rechargement...');
          _loadVaccinations();  // Recharger la liste
        }
      });
      
      socket!.on('disconnect', (_) {
        print('❌ VaccinationList: Socket déconnecté');
      });
    } catch (e) {
      print('⚠️ Erreur connexion socket: $e');
    }
  }
  
  Future<void> _loadVaccinations() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      final vaccinations = await ApiService.getVaccinations(widget.childId);
      
      setState(() {
        _vaccinations = vaccinations.map((v) {
          final dn = v['doseNumber'];
          final doseLabel = (dn is num && dn > 0) ? 'Dose ${dn.toInt()}' : (v['dose'] ?? '');
          return {
            'name': v['vaccineName'] ?? v['name'] ?? 'Vaccin',
            'status': _mapVaccineStatus(v['status']),
            'date': v['administeredDate'] ?? v['scheduledDate'] ?? v['dueDate'],
            'ageRecommended': v['recommendedAge'] ?? 'Non spécifié',
            'dose': (doseLabel is String && doseLabel.isNotEmpty) ? doseLabel : '—',
            'id': v['_id'] ?? v['id'],
            'description': v['description'],
            'location': v['location'] ?? v['healthCenter'],
          };
        }).toList();
        
        // Trier par date : plus récent en haut
        _vaccinations.sort((a, b) {
          final dateA = _parseDate(a['date']);
          final dateB = _parseDate(b['date']);
          if (dateA == null && dateB == null) return 0;
          if (dateA == null) return 1;
          if (dateB == null) return -1;
          return dateB.compareTo(dateA); // Plus récent en premier
        });
        
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      // TODO: Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur lors du chargement: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
  
  String _mapVaccineStatus(String? apiStatus) {
    switch (apiStatus?.toLowerCase()) {
      case 'administered':
      case 'completed':
      case 'done':
        return 'done';
      case 'scheduled':
      case 'upcoming':
      case 'planned':
        return 'scheduled';
      case 'missed':
      case 'rater':
        return 'missed';  // 🚨 AJOUTÉ : Vaccins ratés
      case 'overdue':
      case 'late':
        return 'overdue';
      case 'pending':
      case 'waiting':
      default:
        return 'pending';
    }
  }
  
  /// 📅 Convertir une chaîne de date en DateTime pour le tri
  DateTime? _parseDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return null;
    try {
      return DateTime.parse(dateStr);
    } catch (e) {
      try {
        // Essayer le format dd/MM/yyyy
        final parts = dateStr.split('/');
        if (parts.length == 3) {
          return DateTime(int.parse(parts[2]), int.parse(parts[1]), int.parse(parts[0]));
        }
      } catch (_) {}
      return null;
    }
  }
  
  List<Map<String, dynamic>> _filterByStatus(String status) {
    if (status == 'all') return _vaccinations;
    return _vaccinations.where((v) => v['status'] == status).toList();
  }
  
  Widget _buildTabContent(String status) {
    final filtered = _filterByStatus(status);
    
    if (filtered.isEmpty) {
      return EmptyState(
        icon: Icons.vaccines_outlined,
        title: 'Aucun vaccin',
        message: status == 'all'
            ? 'Aucune vaccination enregistrée'
            : 'Aucun vaccin avec ce statut',
      );
    }
    
    return RefreshIndicator(
      onRefresh: _loadVaccinations,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: filtered.length,
        itemBuilder: (context, index) {
          final vaccine = filtered[index];
          return VaccineCard(
            name: vaccine['name'],
            date: vaccine['date'],
            status: vaccine['status'],
            ageRecommended: vaccine['ageRecommended'],
            dose: vaccine['dose'],
            onTap: () {
              // TODO: Navigate to vaccine details
              _showVaccineDetails(vaccine);
            },
          );
        },
      ),
    );
  }
  
  void _showVaccineDetails(Map<String, dynamic> vaccine) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(AppRadius.xl),
            topRight: Radius.circular(AppRadius.xl),
          ),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
            ),
            
            // Content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      vaccine['name'],
                      style: AppTextStyles.h2,
                    ),
                    
                    const SizedBox(height: AppSpacing.sm),
                    
                    // Status badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.md,
                        vertical: AppSpacing.sm,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(vaccine['status']).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Text(
                        _getStatusLabel(vaccine['status']),
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: _getStatusColor(vaccine['status']),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: AppSpacing.lg),
                    
                    // Details
                    _buildDetailRow('Date', vaccine['date'] ?? 'Non définie'),
                    _buildDetailRow('Âge recommandé', vaccine['ageRecommended'] ?? '-'),
                    _buildDetailRow('Dose', vaccine['dose'] ?? '-'),
                    
                    const SizedBox(height: AppSpacing.lg),
                    
                    // Description
                    Text(
                      'À propos',
                      style: AppTextStyles.h4,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      'Ce vaccin protège contre plusieurs maladies graves. Il est recommandé de suivre le calendrier vaccinal pour une protection optimale.',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'done':
        return AppColors.vaccineDone;
      case 'scheduled':
        return AppColors.vaccineScheduled;
      case 'missed':
        return AppColors.error;  // 🔴 ROUGE pour raté
      case 'overdue':
        return AppColors.vaccineOverdue;
      case 'pending':
        return AppColors.vaccinePending;
      default:
        return AppColors.textTertiary;
    }
  }
  
  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'done':
        return 'Fait';
      case 'scheduled':
        return 'Programmé';
      case 'missed':
        return 'Raté';  // ⚠️ Label pour raté
      case 'overdue':
        return 'En retard';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Vaccinations'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () {
              // TODO: Implement search
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textTertiary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelStyle: AppTextStyles.bodySmall.copyWith(
            fontWeight: FontWeight.w600,
          ),
          tabs: const [
            Tab(text: 'Tous'),
            Tab(text: 'Faits'),
            Tab(text: 'Programmés'),
            Tab(text: 'Ratés'),
            Tab(text: 'En retard'),
          ],
        ),
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Chargement des vaccinations...')
          : TabBarView(
              controller: _tabController,
              children: [
                _buildTabContent('all'),
                _buildTabContent('done'),
                _buildTabContent('scheduled'),
                _buildTabContent('missed'),
                _buildTabContent('overdue'),
              ],
            ),
    );
  }
}
