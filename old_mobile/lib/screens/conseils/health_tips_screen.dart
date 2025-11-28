import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../services/api_service.dart';
import '../../widgets/video_player_widget.dart';

class HealthTipsScreen extends StatefulWidget {
  const HealthTipsScreen({super.key});
  
  @override
  State<HealthTipsScreen> createState() => _HealthTipsScreenState();
}

class _HealthTipsScreenState extends State<HealthTipsScreen> {
  String _selectedCategory = 'all';
  bool _isLoading = true;
  List<Map<String, dynamic>> _healthTips = [];
  String _errorMessage = '';
  
  @override
  void initState() {
    super.initState();
    _loadHealthTips();
  }

  Future<void> _loadHealthTips() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final response = await ApiService.getHealthTips();
      setState(() {
        _healthTips = response;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
      debugPrint('Erreur chargement conseils: $e');
    }
  }
  
  List<Map<String, dynamic>> get _filteredTips {
    if (_selectedCategory == 'all') return _healthTips;
    return _healthTips.where((tip) => tip['category'] == _selectedCategory).toList();
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'vaccination':
        return Icons.vaccines_outlined;
      case 'nutrition':
        return Icons.restaurant_outlined;
      case 'hygiene':
        return Icons.wash_outlined;
      case 'development':
        return Icons.child_care_outlined;
      case 'safety':
        return Icons.shield_outlined;
      default:
        return Icons.lightbulb_outline_rounded;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'vaccination':
        return AppColors.info;
      case 'nutrition':
        return AppColors.success;
      case 'hygiene':
        return AppColors.secondary;
      case 'development':
        return AppColors.warning;
      case 'safety':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }
  
  Widget _buildTipCard(Map<String, dynamic> tip) {
    final category = tip['category'] ?? 'general';
    final color = _getCategoryColor(category);
    final icon = _getCategoryIcon(category);
    final hasMedia = tip['media'] != null;
    final mediaType = tip['media']?['type'];

    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showTipDetails(tip),
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header avec icône et titre
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    // Logo VaxCare
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'VaxCare • ${_getCategoryLabel(category)}',
                            style: AppTextStyles.caption.copyWith(
                              color: color,
                              fontWeight: FontWeight.w700,
                              fontSize: 11,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          if (tip['targetAgeGroup'] != null && tip['targetAgeGroup'] != 'Tous')
                            Text(
                              '👶 ${tip['targetAgeGroup']}',
                              style: AppTextStyles.caption.copyWith(
                                color: AppColors.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                        ],
                      ),
                    ),
                    if (tip['priority'] == 'high')
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.local_fire_department_rounded, size: 12, color: AppColors.error),
                            const SizedBox(width: 4),
                            Text(
                              'Priorité',
                              style: AppTextStyles.caption.copyWith(
                                color: AppColors.error,
                                fontWeight: FontWeight.w700,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // Titre
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: Text(
                  tip['title'] ?? '',
                  style: AppTextStyles.h4.copyWith(
                    fontWeight: FontWeight.w700,
                    height: 1.3,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),

              const SizedBox(height: AppSpacing.sm),

              // Description
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: Text(
                  tip['description'] ?? '',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),

              const SizedBox(height: AppSpacing.md),

              // Media preview si disponible
              if (hasMedia && mediaType == 'image')
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    child: CachedNetworkImage(
                      imageUrl: tip['media']['url'],
                      height: 200,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        height: 200,
                        color: color.withOpacity(0.1),
                        child: const Center(
                          child: CircularProgressIndicator(),
                        ),
                      ),
                      errorWidget: (context, url, error) => Container(
                        height: 200,
                        color: color.withOpacity(0.1),
                        child: Center(
                          child: Icon(Icons.image_outlined, size: 48, color: color),
                        ),
                      ),
                    ),
                  ),
                ),

              if (hasMedia && mediaType == 'video')
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: Container(
                    height: 180,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.play_circle_filled, size: 64, color: color),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'Vidéo disponible',
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: color,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              if (hasMedia && mediaType == 'pdf')
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  child: Container(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: color.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.picture_as_pdf_rounded, size: 32, color: color),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Document PDF',
                                style: AppTextStyles.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                'Cliquez pour voir le document',
                                style: AppTextStyles.caption.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.arrow_forward_ios_rounded, size: 16, color: color),
                      ],
                    ),
                  ),
                ),

              // Footer avec vues et action
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    if (tip['views'] != null && tip['views'] > 0) ...[
                      Icon(
                        Icons.visibility_outlined,
                        size: 16,
                        color: AppColors.textTertiary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${tip['views']} vues',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                    const Spacer(),
                    Text(
                      'Lire plus',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: color,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      size: 16,
                      color: color,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showTipDetails(Map<String, dynamic> tip) {
    final category = tip['category'] ?? 'general';
    final color = _getCategoryColor(category);
    final icon = _getCategoryIcon(category);
    final hasMedia = tip['media'] != null;
    final mediaType = tip['media']?['type'];
    final mediaUrl = tip['media']?['url'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
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
              
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Media (si disponible)
                      if (hasMedia && mediaType == 'image')
                        ClipRRect(
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                          child: CachedNetworkImage(
                            imageUrl: mediaUrl!,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(
                              height: 200,
                              color: color.withOpacity(0.1),
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            ),
                            errorWidget: (context, url, error) => Container(
                              height: 200,
                              color: color.withOpacity(0.1),
                              child: Icon(Icons.image_outlined, size: 64, color: color),
                            ),
                          ),
                        ),
                      
                      if (hasMedia && mediaType == 'video')
                        VideoPlayerWidget(videoUrl: mediaUrl!),
                      
                      if (hasMedia && mediaType == 'pdf')
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.picture_as_pdf_outlined, size: 48, color: color),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Document PDF', style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                                    Text('Appuyez pour ouvrir', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
                                  ],
                                ),
                              ),
                              Icon(Icons.arrow_forward_ios_rounded, size: 16, color: color),
                            ],
                          ),
                        ),

                      if (hasMedia) const SizedBox(height: AppSpacing.lg),
                      
                      // Icon + Title
                      Row(
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(AppRadius.md),
                            ),
                            child: Icon(icon, color: color, size: 32),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Text(
                              tip['title'] ?? '',
                              style: AppTextStyles.h2,
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: AppSpacing.md),
                      
                      // Tags
                      Wrap(
                        spacing: AppSpacing.sm,
                        runSpacing: AppSpacing.sm,
                        children: [
                          _buildModalTag(_getCategoryLabel(category), color),
                          if (tip['targetAgeGroup'] != null && tip['targetAgeGroup'] != 'Tous')
                            _buildModalTag('👶 ${tip['targetAgeGroup']}', AppColors.secondary),
                          if (tip['priority'] == 'high')
                            _buildModalTag('🔥 Priorité haute', AppColors.error),
                        ],
                      ),
                      
                      const SizedBox(height: AppSpacing.lg),
                      
                      // Description
                      Text(
                        tip['description'] ?? '',
                        style: AppTextStyles.bodyMedium.copyWith(
                          height: 1.6,
                        ),
                      ),
                      
                      const SizedBox(height: AppSpacing.xl),
                      
                      // Info box
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.infoLight,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(color: AppColors.info.withOpacity(0.2)),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.lightbulb_outline_rounded,
                              color: AppColors.info,
                              size: 24,
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Text(
                                'Conseil personnalisé pour votre enfant. Consultez toujours un professionnel de santé pour des questions spécifiques.',
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
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModalTag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: AppTextStyles.bodySmall.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
  
  String _getCategoryLabel(String category) {
    switch (category) {
      case 'vaccination':
        return 'Vaccination';
      case 'nutrition':
        return 'Nutrition';
      case 'hygiene':
        return 'Hygiène';
      case 'development':
        return 'Développement';
      case 'safety':
        return 'Sécurité';
      case 'general':
        return 'Général';
      default:
        return category;
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // App Bar avec logo
          SliverAppBar(
            expandedHeight: 180,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withOpacity(0.8),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Logo VaxCare
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.surface.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                        ),
                        child: const Icon(
                          Icons.lightbulb_rounded,
                          size: 48,
                          color: AppColors.surface,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      const Text(
                        'Conseils Santé',
                        style: TextStyle(
                          color: AppColors.surface,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xs),
                      const Text(
                        'Pour la santé de votre enfant',
                        style: TextStyle(
                          color: AppColors.surface,
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh_rounded),
                onPressed: _loadHealthTips,
              ),
            ],
          ),
          // Content
          _isLoading
              ? SliverFillRemaining(
                  child: const LoadingIndicator(message: 'Chargement des conseils...'),
                )
              : _errorMessage.isNotEmpty
                  ? SliverFillRemaining(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(AppSpacing.xl),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
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
                                onPressed: _loadHealthTips,
                                child: const Text('Réessayer'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  : SliverList(
                      delegate: SliverChildListDelegate([
                        // Categories
                        Container(
                          height: 60,
                          margin: const EdgeInsets.only(top: AppSpacing.sm, bottom: AppSpacing.sm),
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                            children: [
                              _buildCategoryChip('Tous', 'all', Icons.grid_view_rounded),
                              const SizedBox(width: AppSpacing.sm),
                              _buildCategoryChip('Vaccination', 'vaccination', Icons.vaccines_outlined),
                              const SizedBox(width: AppSpacing.sm),
                              _buildCategoryChip('Nutrition', 'nutrition', Icons.restaurant_outlined),
                              const SizedBox(width: AppSpacing.sm),
                              _buildCategoryChip('Hygiène', 'hygiene', Icons.wash_outlined),
                              const SizedBox(width: AppSpacing.sm),
                              _buildCategoryChip('Développement', 'development', Icons.child_care_outlined),
                              const SizedBox(width: AppSpacing.sm),
                              _buildCategoryChip('Sécurité', 'safety', Icons.shield_outlined),
                            ],
                          ),
                        ),
                        // Empty state
                        if (_filteredTips.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(AppSpacing.xl),
                            child: Column(
                              children: [
                                const SizedBox(height: AppSpacing.xxl),
                                Icon(
                                  Icons.lightbulb_outline_rounded,
                                  size: 80,
                                  color: AppColors.textTertiary,
                                ),
                                const SizedBox(height: AppSpacing.lg),
                                Text(
                                  'Aucun conseil disponible',
                                  style: AppTextStyles.h3.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                const SizedBox(height: AppSpacing.sm),
                                Text(
                                  'Les conseils de santé apparaîtront ici',
                                  style: AppTextStyles.bodyMedium.copyWith(
                                    color: AppColors.textTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        // Tips list
                        ..._filteredTips.map((tip) => _buildTipCard(tip)).toList(),
                        const SizedBox(height: AppSpacing.xxl),
                      ]),
                    ),
        ],
      ),
    );
  }
  
  Widget _buildCategoryChip(String label, String value, IconData icon) {
    final isSelected = _selectedCategory == value;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategory = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.full),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppColors.surface : AppColors.textPrimary,
            ),
            const SizedBox(width: AppSpacing.xs),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: isSelected ? AppColors.surface : AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
