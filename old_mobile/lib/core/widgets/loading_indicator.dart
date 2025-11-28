import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

/// ⏳ Indicateur de chargement personnalisé
class LoadingIndicator extends StatelessWidget {
  final String? message;
  final bool isFullScreen;
  
  const LoadingIndicator({
    super.key,
    this.message,
    this.isFullScreen = false,
  });
  
  @override
  Widget build(BuildContext context) {
    final content = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      mainAxisSize: MainAxisSize.min,
      children: [
        const CircularProgressIndicator(
          color: AppColors.primary,
          strokeWidth: 3,
        ),
        if (message != null) ...[
          const SizedBox(height: AppSpacing.md),
          Text(
            message!,
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
    
    if (isFullScreen) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: content),
      );
    }
    
    return Center(child: content);
  }
}
