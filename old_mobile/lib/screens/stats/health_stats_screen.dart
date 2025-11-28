import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/section_header.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class HealthStatsScreen extends StatefulWidget {
  final Map<String, dynamic> child;
  
  const HealthStatsScreen({super.key, required this.child});
  
  @override
  State<HealthStatsScreen> createState() => _HealthStatsScreenState();
}

class _HealthStatsScreenState extends State<HealthStatsScreen> {
  // Loading state
  bool _isLoading = true;
  bool _hasError = false;
  String _errorMessage = '';
  
  // Stats data
  int _totalVaccines = 0;
  int _completedVaccines = 0;
  int _scheduledVaccines = 0;
  int _overdueVaccines = 0;
  List<Map<String, dynamic>> _recentActivity = [];
  
  String get childId => widget.child['id'] ?? widget.child['_id'] ?? '';
  String get childName => widget.child['name'] ?? 'Enfant';
  
  double get _completionPercentage => _totalVaccines > 0 
      ? (_completedVaccines / _totalVaccines) * 100 
      : 0.0;
  
  @override
  void initState() {
    super.initState();
    _loadStats();
  }
  
  Future<void> _loadStats() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });
    
    try {
      // Charger les statistiques et l'activité en parallèle
      final results = await Future.wait([
        ApiService.getVaccinationStats(childId),
        ApiService.getRecentActivity(childId),
      ]);
      
      final stats = results[0] as Map<String, dynamic>;
      final activity = results[1] as List<Map<String, dynamic>>;
      
      setState(() {
        _totalVaccines = stats['totalVaccines'] ?? 0;
        _completedVaccines = stats['completedVaccines'] ?? 0;
        _scheduledVaccines = stats['scheduledVaccines'] ?? 0;
        _overdueVaccines = stats['overdueVaccines'] ?? 0;
        _recentActivity = activity;
        _isLoading = false;
      });
      
      debugPrint('📊 Stats chargées: Total=$_totalVaccines, Complétés=$_completedVaccines');
    } catch (e) {
      debugPrint('❌ Erreur chargement stats: $e');
      setState(() {
        _isLoading = false;
        _hasError = true;
        _errorMessage = e.toString();
      });
    }
  }
  
  Future<void> _refresh() async {
    await _loadStats();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Statistiques Santé'),
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Chargement des statistiques...')
          : _hasError
              ? _buildErrorView()
              : RefreshIndicator(
                  onRefresh: _refresh,
                  color: AppColors.primary,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: _buildContent(),
                    ),
                  ),
                ),
    );
  }
  
  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
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
              onPressed: _refresh,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }
  
  List<Widget> _buildContent() {
    return [
            // Hero card - Completion percentage
            Container(
              margin: const EdgeInsets.all(AppSpacing.md),
              padding: const EdgeInsets.all(AppSpacing.xl),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0A1A33), Color(0xFF1A2F4F)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(AppRadius.xl),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'Taux de vaccination',
                    style: TextStyle(
                      color: AppColors.surface,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  
                  const SizedBox(height: AppSpacing.lg),
                  
                  // Circular progress
                  SizedBox(
                    width: 160,
                    height: 160,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 160,
                          height: 160,
                          child: CircularProgressIndicator(
                            value: _completionPercentage / 100,
                            strokeWidth: 12,
                            backgroundColor: Colors.white.withOpacity(0.2),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppColors.secondary,
                            ),
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${_completionPercentage.toStringAsFixed(0)}%',
                              style: const TextStyle(
                                color: AppColors.surface,
                                fontSize: 40,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              '$_completedVaccines/$_totalVaccines vaccins',
                              style: TextStyle(
                                color: AppColors.surface.withOpacity(0.8),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: AppSpacing.lg),
                  
                  Text(
                    'Continuez à respecter le calendrier vaccinal !',
                    style: TextStyle(
                      color: AppColors.surface.withOpacity(0.9),
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            // Stats grid
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Complétés',
                      _completedVaccines.toString(),
                      Icons.check_circle_rounded,
                      AppColors.success,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _buildStatCard(
                      'Programmés',
                      _scheduledVaccines.toString(),
                      Icons.schedule_rounded,
                      AppColors.info,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.md),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'En retard',
                      _overdueVaccines.toString(),
                      Icons.warning_rounded,
                      AppColors.error,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _buildStatCard(
                      'Restants',
                      (_totalVaccines - _completedVaccines).toString(),
                      Icons.pending_actions_rounded,
                      AppColors.warning,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Recent activity
            const SectionHeader(
              title: 'Activité récente',
              icon: Icons.history_rounded,
            ),
            
            if (_recentActivity.isEmpty)
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Text(
                  'Aucune activité récente',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              )
            else
              ..._recentActivity.map((activity) {
                final type = activity['type'] ?? 'info';
                final title = activity['title'] ?? 'Activité';
                final date = activity['date'] != null 
                    ? DateTime.parse(activity['date'].toString())
                    : DateTime.now();
                final formattedDate = DateFormat('dd MMMM yyyy', 'fr_FR').format(date);
                
                IconData icon;
                Color color;
                
                switch (type) {
                  case 'vaccination':
                    icon = Icons.check_circle_rounded;
                    color = AppColors.success;
                    break;
                  case 'appointment':
                    icon = Icons.event_rounded;
                    color = AppColors.info;
                    break;
                  case 'reminder':
                    icon = Icons.notifications_active_rounded;
                    color = AppColors.warning;
                    break;
                  default:
                    icon = Icons.info_rounded;
                    color = AppColors.primary;
                }
                
                return _buildActivityItem(title, formattedDate, icon, color);
              }).toList(),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Health milestones
            const SectionHeader(
              title: 'Jalons de santé',
              icon: Icons.emoji_events_outlined,
            ),
            
            _buildMilestoneCard(
              'Premier vaccin',
              'BCG à la naissance',
              Icons.stars_rounded,
              true,
            ),
            
            _buildMilestoneCard(
              'Série Polio complète',
              '3 doses administrées',
              Icons.military_tech_rounded,
              false,
            ),
            
            _buildMilestoneCard(
              'Calendrier à jour',
              'Tous les vaccins à temps',
              Icons.verified_rounded,
              false,
            ),
            
            const SizedBox(height: AppSpacing.xxl),
    ];
  }
  
  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      margin: EdgeInsets.zero,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          
          const SizedBox(height: AppSpacing.sm),
          
          Text(
            value,
            style: AppTextStyles.h2.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
          
          const SizedBox(height: AppSpacing.xxs),
          
          Text(
            label,
            style: AppTextStyles.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
  
  Widget _buildActivityItem(String title, String subtitle, IconData icon, Color color) {
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
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          
          const SizedBox(width: AppSpacing.md),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  subtitle,
                  style: AppTextStyles.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMilestoneCard(String title, String subtitle, IconData icon, bool achieved) {
    return AppCard(
      margin: const EdgeInsets.only(
        left: AppSpacing.md,
        right: AppSpacing.md,
        bottom: AppSpacing.md,
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: achieved
                  ? AppColors.warning.withOpacity(0.1)
                  : AppColors.border,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(
              icon,
              color: achieved ? AppColors.warning : AppColors.textTertiary,
              size: 24,
            ),
          ),
          
          const SizedBox(width: AppSpacing.md),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                    color: achieved ? AppColors.textPrimary : AppColors.textTertiary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  subtitle,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: achieved ? AppColors.textSecondary : AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          
          if (achieved)
            const Icon(
              Icons.check_circle_rounded,
              color: AppColors.success,
              size: 24,
            )
          else
            Icon(
              Icons.lock_outline_rounded,
              color: AppColors.textTertiary,
              size: 20,
            ),
        ],
      ),
    );
  }
}
