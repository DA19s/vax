import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../services/api_service.dart';
import '../auth/login_screen.dart';

class PrivacySettingsScreen extends StatefulWidget {
  final Map<String, dynamic> child;
  
  const PrivacySettingsScreen({super.key, required this.child});

  @override
  State<PrivacySettingsScreen> createState() => _PrivacySettingsScreenState();
}

class _PrivacySettingsScreenState extends State<PrivacySettingsScreen> {
  final _storage = const FlutterSecureStorage();
  bool _isLoading = false;
  int _cacheSize = 0;
  
  @override
  void initState() {
    super.initState();
    _calculateCacheSize();
  }
  
  Future<void> _calculateCacheSize() async {
    // Estimation du cache (notifications, images, etc.)
    try {
      final notifKeys = ['cached_notifications_global', 'cached_notifications'];
      int totalSize = 0;
      
      for (final key in notifKeys) {
        final data = await _storage.read(key: key);
        if (data != null) {
          totalSize += data.length;
        }
      }
      
      setState(() {
        _cacheSize = (totalSize / 1024).round(); // En KB
      });
    } catch (e) {
      debugPrint('Erreur calcul cache: $e');
    }
  }
  
  Future<void> _clearCache() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.delete_sweep_outlined, color: AppColors.warning),
            SizedBox(width: 12),
            Text('Effacer le cache'),
          ],
        ),
        content: const Text(
          'Cela supprimera les données temporaires et libérera de l\'espace. Vos données importantes seront conservées.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              setState(() => _isLoading = true);
              
              try {
                // Supprimer uniquement les données en cache, pas les credentials
                await _storage.delete(key: 'cached_notifications_global');
                await _storage.delete(key: 'cached_notifications');
                
                await _calculateCacheSize();
                
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Row(
                        children: [
                          Icon(Icons.check_circle, color: Colors.white),
                          SizedBox(width: 12),
                          Text('Cache effacé avec succès'),
                        ],
                      ),
                      backgroundColor: AppColors.success,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erreur : $e'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              } finally {
                setState(() => _isLoading = false);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.warning,
            ),
            child: const Text('Effacer'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _downloadMyData() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.download_outlined, color: AppColors.info),
            SizedBox(width: 12),
            Text('Télécharger mes données'),
          ],
        ),
        content: const Text(
          'Un fichier contenant toutes vos données sera généré et envoyé à votre adresse email dans les prochaines 24 heures.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              setState(() => _isLoading = true);
              
              try {
                final token = await _storage.read(key: 'auth_token');
                final parentPhone = widget.child['parentPhone'] ?? 
                                   widget.child['parentInfo']?['phone'] ?? '';
                
                final response = await http.post(
                  Uri.parse('http://localhost:5000/api/mobile/request-data-export'),
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer $token',
                  },
                  body: json.encode({'parentPhone': parentPhone}),
                );
                
                if (response.statusCode == 200) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Row(
                          children: [
                            Icon(Icons.check_circle, color: Colors.white),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Demande envoyée ! Vous recevrez un email avec vos données.',
                              ),
                            ),
                          ],
                        ),
                        backgroundColor: AppColors.success,
                        duration: Duration(seconds: 5),
                      ),
                    );
                  }
                } else {
                  throw Exception('Erreur serveur');
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erreur : $e'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                }
              } finally {
                setState(() => _isLoading = false);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.info,
            ),
            child: const Text('Demander'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _deleteAccount() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_outlined, color: AppColors.error),
            SizedBox(width: 12),
            Text('Supprimer mon compte'),
          ],
        ),
        content: const Text(
          '⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !\n\n'
          'Toutes vos données et celles de vos enfants seront définitivement supprimées.\n\n'
          'Êtes-vous absolument sûr de vouloir continuer ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _confirmAccountDeletion();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('Supprimer définitivement'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _confirmAccountDeletion() async {
    showDialog(
      context: context,
      builder: (context) {
        final phoneController = TextEditingController();
        return AlertDialog(
          title: const Text('Confirmation finale'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Pour confirmer, entrez votre numéro de téléphone :',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  hintText: '+221 XX XXX XX XX',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                final phone = phoneController.text.trim();
                final actualPhone = widget.child['parentPhone'] ?? 
                                   widget.child['parentInfo']?['phone'] ?? '';
                
                if (phone != actualPhone) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Numéro incorrect'),
                      backgroundColor: AppColors.error,
                    ),
                  );
                  return;
                }
                
                Navigator.pop(context);
                setState(() => _isLoading = true);
                
                try {
                  final token = await _storage.read(key: 'auth_token');
                  
                  final response = await http.delete(
                    Uri.parse('http://localhost:5000/api/mobile/account'),
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': 'Bearer $token',
                    },
                  );
                  
                  if (response.statusCode == 200) {
                    // Déconnexion et nettoyage
                    await _storage.deleteAll();
                    
                    if (mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                        (route) => false,
                      );
                      
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Compte supprimé avec succès'),
                          backgroundColor: AppColors.success,
                        ),
                      );
                    }
                  } else {
                    throw Exception('Erreur serveur');
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Erreur : $e'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                } finally {
                  setState(() => _isLoading = false);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
              ),
              child: const Text('Supprimer'),
            ),
          ],
        );
      },
    );
  }
  
  void _openPrivacyPolicy() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Politique de confidentialité'),
        content: const SingleChildScrollView(
          child: Text(
            'Politique de confidentialité VaxCare\n\n'
            '1. Collecte des données\n'
            'Nous collectons uniquement les données nécessaires au fonctionnement de l\'application.\n\n'
            '2. Utilisation des données\n'
            'Vos données sont utilisées pour assurer le suivi vaccinal de vos enfants.\n\n'
            '3. Sécurité\n'
            'Toutes vos données sont chiffrées et stockées de manière sécurisée.\n\n'
            '4. Partage\n'
            'Vos données ne sont jamais vendues ou partagées avec des tiers.\n\n'
            '5. Droits\n'
            'Vous pouvez à tout moment demander l\'accès, la modification ou la suppression de vos données.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
        ],
      ),
    );
  }
  
  void _openTermsOfService() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Conditions d\'utilisation'),
        content: const SingleChildScrollView(
          child: Text(
            'Conditions d\'utilisation VaxCare\n\n'
            '1. Acceptation\n'
            'En utilisant VaxCare, vous acceptez ces conditions.\n\n'
            '2. Utilisation\n'
            'L\'application est réservée au suivi vaccinal des enfants au Sénégal.\n\n'
            '3. Responsabilité\n'
            'Les informations fournies sont à titre indicatif. Consultez toujours un professionnel de santé.\n\n'
            '4. Compte\n'
            'Vous êtes responsable de la sécurité de votre compte.\n\n'
            '5. Modifications\n'
            'Nous nous réservons le droit de modifier ces conditions.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
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
        title: const Text('Vie privée et données'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  const SizedBox(height: AppSpacing.md),
                  
                  // Données et cache
                  _buildSection(
                    title: 'Données et cache',
                    icon: Icons.storage_outlined,
                    children: [
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.warning.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: const Icon(Icons.cleaning_services_outlined, color: AppColors.warning),
                        ),
                        title: const Text('Effacer le cache'),
                        subtitle: Text('Libérer $_cacheSize KB'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: _clearCache,
                      ),
                      
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.info.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: const Icon(Icons.download_outlined, color: AppColors.info),
                        ),
                        title: const Text('Télécharger mes données'),
                        subtitle: const Text('Export RGPD'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: _downloadMyData,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: AppSpacing.lg),
                  
                  // Documents légaux
                  _buildSection(
                    title: 'Documents légaux',
                    icon: Icons.gavel_outlined,
                    children: [
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: const Icon(Icons.privacy_tip_outlined, color: AppColors.primary),
                        ),
                        title: const Text('Politique de confidentialité'),
                        subtitle: const Text('Comment nous protégeons vos données'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: _openPrivacyPolicy,
                      ),
                      
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.info.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: const Icon(Icons.description_outlined, color: AppColors.info),
                        ),
                        title: const Text('Conditions d\'utilisation'),
                        subtitle: const Text('Règles d\'utilisation de l\'app'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: _openTermsOfService,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: AppSpacing.lg),
                  
                  // Zone danger
                  _buildSection(
                    title: 'Zone danger',
                    icon: Icons.warning_outlined,
                    children: [
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(AppSpacing.sm),
                          decoration: BoxDecoration(
                            color: AppColors.error.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: const Icon(Icons.delete_forever_outlined, color: AppColors.error),
                        ),
                        title: const Text(
                          'Supprimer mon compte',
                          style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600),
                        ),
                        subtitle: const Text('Action irréversible'),
                        trailing: const Icon(Icons.chevron_right, color: AppColors.error),
                        onTap: _deleteAccount,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: AppSpacing.lg),
                  
                  // Info
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Container(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      decoration: BoxDecoration(
                        color: AppColors.infoLight,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.security_outlined,
                            color: AppColors.info,
                            size: 20,
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              'Vos données sont protégées par un chiffrement de bout en bout. Nous respectons scrupuleusement la réglementation RGPD.',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.info,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: AppSpacing.xxl),
                ],
              ),
            ),
    );
  }
  
  Widget _buildSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            children: [
              Icon(icon, size: 20, color: AppColors.primary),
              const SizedBox(width: AppSpacing.sm),
              Text(
                title,
                style: AppTextStyles.h4.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }
}
