import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/basic_date_picker.dart';
import '../../services/api_service.dart';

class RequestAppointmentScreen extends StatefulWidget {
  final String childId;
  final String vaccine;
  final String childName;

  const RequestAppointmentScreen({
    super.key,
    required this.childId,
    required this.vaccine,
    required this.childName,
  });

  @override
  State<RequestAppointmentScreen> createState() => _RequestAppointmentScreenState();
}

class _RequestAppointmentScreenState extends State<RequestAppointmentScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  List<Map<String, dynamic>> _availableCenters = [];
  String _errorMessage = '';
  
  // Formulaire
  String? _selectedCenter;
  DateTime? _selectedDate;
  String _requestMessage = '';
  String _urgencyLevel = 'normal';

  @override
  void initState() {
    super.initState();
    _loadAvailableCenters();
  }

  Future<void> _loadAvailableCenters() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final centers = await ApiService.searchAvailableCenters(widget.vaccine);
      print('📱 Centres reçus: ${centers.length}');
      for (var center in centers) {
        print('📱 Centre: ${center['name']}, hasStock: ${center['hasStock']}, jours: ${center['availableDays']}');
      }
      setState(() {
        _availableCenters = centers;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await BasicDatePicker.show(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      title: 'Date souhaitée',
    );

    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _submitRequest() async {
    if (_selectedCenter == null || _selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Veuillez sélectionner un centre et une date'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final selectedCenterData = _availableCenters.firstWhere(
        (center) => center['name'] == _selectedCenter,
      );

      await ApiService.createAppointmentRequest(
        childId: widget.childId,
        vaccine: widget.vaccine,
        healthCenter: _selectedCenter!,
        region: selectedCenterData['region'],
        district: selectedCenterData['district'],
        requestedDate: _selectedDate!,
        requestMessage: _requestMessage.isEmpty ? null : _requestMessage,
        urgencyLevel: _urgencyLevel,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Demande de rendez-vous envoyée avec succès'),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop(true); // Retourner true pour indiquer le succès
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Erreur: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  String _getDaysOfWeekString(List<dynamic> days) {
    if (days.isEmpty) return 'Jours non précisés';
    
    const dayMap = {
      'monday': 'Lun',
      'tuesday': 'Mar',
      'wednesday': 'Mer',
      'thursday': 'Jeu',
      'friday': 'Ven',
      'saturday': 'Sam',
      'sunday': 'Dim',
    };
    
    return days.map((day) => dayMap[day.toLowerCase()] ?? day).join(', ');
  }

  Widget _buildCenterCard(Map<String, dynamic> center) {
    final isSelected = _selectedCenter == center['name'];
    final hasStock = center['hasStock'] ?? false; // ✅ Utiliser hasStock boolean
    final availableDays = List<dynamic>.from(center['availableDays'] ?? []);

    return AppCard(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: EdgeInsets.zero,
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedCenter = isSelected ? null : center['name'];
          });
        },
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: isSelected
                ? Border.all(color: AppColors.primary, width: 2)
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Icon(
                      _getCenterIcon(center['type']),
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          center['name'],
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Text(
                          center['address'] ?? 'Adresse non disponible',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isSelected)
                    const Icon(
                      Icons.check_circle,
                      color: AppColors.primary,
                      size: 24,
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              
              // Informations sur le stock
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: hasStock ? AppColors.success.withOpacity(0.1) : AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Row(
                  children: [
                    // Point coloré au lieu d'icône vaccin
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: hasStock ? AppColors.success : AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      hasStock ? 'Doses disponibles' : 'Stock épuisé',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: hasStock ? AppColors.success : AppColors.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppSpacing.sm),
              
              // Jours de disponibilité
              if (availableDays.isNotEmpty) ...[
                Row(
                  children: [
                    const Icon(
                      Icons.schedule_rounded,
                      color: AppColors.info,
                      size: 16,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'Disponible: ${_getDaysOfWeekString(availableDays)}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.info,
                      ),
                    ),
                  ],
                ),
              ] else ...[
                Row(
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: AppColors.warning,
                      size: 16,
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    Text(
                      'Horaires à préciser avec le centre',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.warning,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  IconData _getCenterIcon(String? type) {
    switch (type) {
      case 'district':
        return Icons.domain_rounded;
      case 'health_center':
        return Icons.local_hospital_rounded;
      case 'health_post':
        return Icons.medical_services_rounded;
      case 'health_case':
        return Icons.home_work_rounded;
      case 'clinic':
        return Icons.healing_rounded;
      default:
        return Icons.local_hospital_rounded;
    }
  }

  Widget _buildRequestForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.lg),
        const Divider(),
        const SizedBox(height: AppSpacing.lg),
        
        Text(
          'Détails de la demande',
          style: AppTextStyles.h3.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        
        const SizedBox(height: AppSpacing.md),
        
        // Sélection de la date
        AppCard(
          child: ListTile(
            leading: const Icon(Icons.calendar_today_rounded, color: AppColors.primary),
            title: const Text('Date souhaitée'),
            subtitle: _selectedDate != null
                ? Text(DateFormat('EEEE dd MMMM yyyy', 'fr_FR').format(_selectedDate!))
                : const Text('Sélectionnez une date'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: _selectDate,
          ),
        ),
        
        const SizedBox(height: AppSpacing.md),
        
        // Niveau d'urgence
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Niveau d\'urgence',
                style: AppTextStyles.bodyMedium,
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: RadioListTile<String>(
                      title: const Text('Normal'),
                      value: 'normal',
                      groupValue: _urgencyLevel,
                      onChanged: (value) {
                        setState(() {
                          _urgencyLevel = value!;
                        });
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                  Expanded(
                    child: RadioListTile<String>(
                      title: const Text('Urgent'),
                      value: 'urgent',
                      groupValue: _urgencyLevel,
                      onChanged: (value) {
                        setState(() {
                          _urgencyLevel = value!;
                        });
                      },
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        const SizedBox(height: AppSpacing.md),
        
        // Message optionnel
        AppCard(
          child: TextField(
            decoration: const InputDecoration(
              labelText: 'Message optionnel',
              hintText: 'Précisez vos préférences ou contraintes...',
              border: InputBorder.none,
            ),
            maxLines: 3,
            onChanged: (value) {
              _requestMessage = value;
            },
          ),
        ),
        
        const SizedBox(height: AppSpacing.xl),
        
        // Bouton de soumission
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _submitRequest,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
            ),
            child: _isSubmitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(
                    'Envoyer la demande',
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Demande de RDV'),
            Text(
              '${widget.vaccine} - ${widget.childName}',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Recherche des centres disponibles...')
          : _errorMessage.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        size: 64,
                        color: AppColors.error,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text('Erreur de chargement', style: AppTextStyles.h3),
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
                        onPressed: _loadAvailableCenters,
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                )
              : _availableCenters.isEmpty
                  ? EmptyState(
                      icon: Icons.search_off_rounded,
                      title: 'Aucun centre disponible',
                      message: 'Aucun centre de santé avec stock de ${widget.vaccine} trouvé dans votre région.',
                      buttonText: 'Actualiser',
                      onButtonPressed: _loadAvailableCenters,
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // En-tête avec informations
                          AppCard(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(AppSpacing.sm),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(AppRadius.sm),
                                      ),
                                      child: const Icon(
                                        Icons.vaccines_rounded,
                                        color: AppColors.primary,
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(width: AppSpacing.md),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Vaccination ${widget.vaccine}',
                                            style: AppTextStyles.bodyMedium.copyWith(
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          Text(
                                            'Pour ${widget.childName}',
                                            style: AppTextStyles.bodySmall.copyWith(
                                              color: AppColors.textSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: AppSpacing.md),
                                Container(
                                  padding: const EdgeInsets.all(AppSpacing.sm),
                                  decoration: BoxDecoration(
                                    color: AppColors.info.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(AppRadius.sm),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.info_outline_rounded,
                                        color: AppColors.info,
                                        size: 16,
                                      ),
                                      const SizedBox(width: AppSpacing.xs),
                                      Expanded(
                                        child: Text(
                                          '${_availableCenters.length} centre(s) avec stock disponible trouvé(s)',
                                          style: AppTextStyles.bodySmall.copyWith(
                                            color: AppColors.info,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          
                          const SizedBox(height: AppSpacing.lg),
                          
                          Text(
                            'Centres disponibles',
                            style: AppTextStyles.h3.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          
                          const SizedBox(height: AppSpacing.md),
                          
                          // Liste des centres
                          ...(_availableCenters.map((center) => _buildCenterCard(center))),
                          
                          // Formulaire de demande (seulement si un centre est sélectionné)
                          if (_selectedCenter != null) _buildRequestForm(),
                        ],
                      ),
                    ),
    );
  }
}
