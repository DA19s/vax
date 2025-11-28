import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

/// 💉 Card de vaccin avec statut
class VaccineCard extends StatelessWidget {
  final String name;
  final String? date;
  final String status;
  final String? ageRecommended;
  final String? dose;
  final VoidCallback? onTap;
  
  const VaccineCard({
    super.key,
    required this.name,
    this.date,
    required this.status,
    this.ageRecommended,
    this.dose,
    this.onTap,
  });
  
  Color _getStatusColor() {
    switch (status.toLowerCase()) {
      case 'done':
      case 'fait':
      case 'completed':
        return AppColors.vaccineDone;
      case 'pending':
      case 'en attente':
        return AppColors.vaccinePending;
      case 'overdue':
      case 'en retard':
        return AppColors.vaccineOverdue;
      case 'missed':
      case 'raté':
      case 'rater':
        return AppColors.error;  // 🔴 ROUGE pour raté
      case 'scheduled':
      case 'programmé':
      case 'planned':
        return AppColors.vaccineScheduled;
      default:
        return AppColors.textTertiary;
    }
  }
  
  String _getStatusLabel() {
    switch (status.toLowerCase()) {
      case 'done':
      case 'fait':
      case 'completed':
        return 'Fait';
      case 'pending':
      case 'en attente':
        return 'En attente';
      case 'overdue':
      case 'en retard':
        return 'En retard';
      case 'missed':
      case 'raté':
      case 'rater':
        return 'Raté';  // ⚠️ Label pour raté
      case 'scheduled':
      case 'programmé':
      case 'planned':
        return 'Programmé';
      default:
        return status;
    }
  }
  
  IconData _getStatusIcon() {
    switch (status.toLowerCase()) {
      case 'done':
      case 'fait':
      case 'completed':
        return Icons.check_circle_rounded;
      case 'pending':
      case 'en attente':
        return Icons.schedule_rounded;
      case 'overdue':
      case 'en retard':
        return Icons.warning_rounded;
      case 'missed':
      case 'raté':
      case 'rater':
        return Icons.cancel_rounded;  // ❌ Icône pour raté
      case 'scheduled':
      case 'programmé':
      case 'planned':
        return Icons.event_rounded;
      default:
        return Icons.circle_outlined;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final color = _getStatusColor();
    
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: color.withOpacity(0.2), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Icon(
                    _getStatusIcon(),
                    color: color,
                    size: 24,
                  ),
                ),
                
                const SizedBox(width: AppSpacing.md),
                
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name + Dose
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style: AppTextStyles.bodyMedium.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (dose != null) ...[
                            const SizedBox(width: AppSpacing.xs),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: AppSpacing.xxs,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(AppRadius.xs),
                              ),
                              child: Text(
                                dose!,
                                style: AppTextStyles.caption.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      
                      const SizedBox(height: AppSpacing.xs),
                      
                      // Date or Age
                      if (date != null)
                        Text(
                          date!,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        )
                      else if (ageRecommended != null)
                        Text(
                          'Recommandé: $ageRecommended',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      
                      const SizedBox(height: AppSpacing.xs),
                      
                      // Status badge
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.sm,
                              vertical: AppSpacing.xxs,
                            ),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(AppRadius.xs),
                            ),
                            child: Text(
                              _getStatusLabel(),
                              style: AppTextStyles.caption.copyWith(
                                color: color,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Arrow
                if (onTap != null)
                  Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.textTertiary,
                    size: 20,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
