import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/empty_state.dart';
import '../../core/widgets/loading_indicator.dart';
import '../../models/campaign_model.dart';
import '../../services/api_service.dart';
import '../../widgets/campaign_card.dart';

class CampagneScreen extends StatefulWidget {
  const CampagneScreen({super.key});
  
  @override
  State<CampagneScreen> createState() => _CampagneScreenState();
}

class _CampagneScreenState extends State<CampagneScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  List<Campaign> _campaigns = [];
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadCampaigns();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  Future<void> _loadCampaigns() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    
    try {
      final data = await ApiService.getCampaigns();
      setState(() {
        _campaigns = data.map((c) => Campaign.fromJson(c)).toList();
        // Trier par date de création (plus récente en premier)
        _campaigns.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }
  
  List<Campaign> _filterCampaigns(String filter) {
    switch (filter) {
      case 'all':
        return _campaigns;
      case 'ongoing':
        return _campaigns.where((c) => c.status == 'ongoing').toList();
      case 'upcoming':
        return _campaigns.where((c) => c.status == 'planned' || c.isUpcoming).toList();
      case 'completed':
        return _campaigns.where((c) => c.status == 'completed' || c.isCompleted).toList();
      default:
        return _campaigns;
    }
  }
  
  Widget _buildTabContent(String filter) {
    final filtered = _filterCampaigns(filter);
    
    if (filtered.isEmpty) {
      return EmptyState(
        icon: Icons.campaign_outlined,
        title: 'Aucune campagne',
        message: filter == 'all'
            ? 'Aucune campagne de vaccination disponible'
            : 'Aucune campagne avec ce statut',
      );
    }
    
    return RefreshIndicator(
      onRefresh: _loadCampaigns,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.md),
        itemCount: filtered.length,
        itemBuilder: (context, index) {
          final campaign = filtered[index];
          return CampaignCard(
            campaign: campaign,
            onTap: () => _showCampaignDetails(campaign),
          );
        },
      ),
    );
  }
  
  void _showCampaignDetails(Campaign campaign) {
    final dateFormat = DateFormat('dd MMMM yyyy', 'fr_FR');
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
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
                    // En-tête avec icône
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(AppSpacing.md),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                          ),
                          child: Icon(
                            Icons.campaign_rounded,
                            color: AppColors.primary,
                            size: 32,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                campaign.title,
                                style: AppTextStyles.h2,
                              ),
                              if (campaign.region != null) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.location_on_outlined,
                                      size: 16,
                                      color: AppColors.textSecondary,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      campaign.region!,
                                      style: AppTextStyles.bodyMedium.copyWith(
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: AppSpacing.lg),
                    
                    // Description
                    if (campaign.description != null && campaign.description!.isNotEmpty) ...[
                      Text(
                        'Description',
                        style: AppTextStyles.h4,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        campaign.description!,
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                    ],
                    
                    // Informations clés
                    Text(
                      'Informations',
                      style: AppTextStyles.h4,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    
                    _buildInfoRow(
                      Icons.calendar_today_outlined,
                      'Date de début',
                      dateFormat.format(campaign.startDate),
                    ),
                    _buildInfoRow(
                      Icons.event_outlined,
                      'Date de fin',
                      dateFormat.format(campaign.endDate),
                    ),
                    
                    if (campaign.targetVaccine != null)
                      _buildInfoRow(
                        Icons.vaccines_outlined,
                        'Vaccin ciblé',
                        campaign.targetVaccine!,
                      ),
                    
                    if (campaign.targetAgeGroup != null)
                      _buildInfoRow(
                        Icons.people_outline,
                        'Groupe d\'âge',
                        campaign.targetAgeGroup!,
                      ),
                    
                    if (campaign.targetPopulation != null)
                      _buildInfoRow(
                        Icons.group_outlined,
                        'Population cible',
                        '${campaign.targetPopulation} personnes',
                      ),
                    
                    // Progression
                    if (campaign.targetPopulation != null && campaign.targetPopulation! > 0) ...[
                      const SizedBox(height: AppSpacing.lg),
                      Text(
                        'Progression',
                        style: AppTextStyles.h4,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(AppRadius.lg),
                          border: Border.all(
                            color: AppColors.primary.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Vaccinés',
                                  style: AppTextStyles.bodyMedium.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                                Text(
                                  '${campaign.vaccinatedCount} / ${campaign.targetPopulation}',
                                  style: AppTextStyles.h3.copyWith(
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(AppRadius.full),
                              child: LinearProgressIndicator(
                                value: campaign.progress,
                                backgroundColor: AppColors.border,
                                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                                minHeight: 8,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              '${(campaign.progress * 100).toStringAsFixed(1)}% complété',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    
                    // Médias (si disponibles)
                    if (campaign.medias.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.lg),
                      Text(
                        'Ressources',
                        style: AppTextStyles.h4,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      ...campaign.medias.map((media) => _buildMediaItem(media)),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(
              icon,
              size: 20,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMediaItem(Media media) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Icon(
            media.type == 'video' ? Icons.play_circle_outline : Icons.picture_as_pdf_outlined,
            color: AppColors.primary,
            size: 32,
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  media.type == 'video' ? 'Vidéo' : 'Document PDF',
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Cliquez pour ouvrir',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_ios_rounded,
            size: 16,
            color: AppColors.textTertiary,
          ),
        ],
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Campagnes de Vaccination'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadCampaigns,
            tooltip: 'Actualiser',
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
          isScrollable: false,
          tabs: const [
            Tab(text: 'Toutes'),
            Tab(text: 'En cours'),
            Tab(text: 'À venir'),
            Tab(text: 'Terminées'),
          ],
        ),
      ),
      body: _isLoading
          ? const LoadingIndicator(message: 'Chargement des campagnes...')
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: AppColors.error,
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Text(
                        'Erreur de chargement',
                        style: AppTextStyles.h3,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                        child: Text(
                          _error!,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      ElevatedButton.icon(
                        onPressed: _loadCampaigns,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Réessayer'),
                      ),
                    ],
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildTabContent('all'),
                    _buildTabContent('ongoing'),
                    _buildTabContent('upcoming'),
                    _buildTabContent('completed'),
                  ],
                ),
    );
  }
}
