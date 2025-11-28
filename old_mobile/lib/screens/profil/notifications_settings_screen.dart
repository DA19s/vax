import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class NotificationsSettingsScreen extends StatefulWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  State<NotificationsSettingsScreen> createState() => _NotificationsSettingsScreenState();
}

class _NotificationsSettingsScreenState extends State<NotificationsSettingsScreen> {
  final _storage = const FlutterSecureStorage();
  
  bool _vaccineReminders = true;
  bool _appointmentReminders = true;
  bool _campaignNotifications = true;
  bool _systemNotifications = true;
  bool _soundEnabled = true;
  bool _vibrationEnabled = true;
  
  @override
  void initState() {
    super.initState();
    _loadSettings();
  }
  
  Future<void> _loadSettings() async {
    final vaccineReminders = await _storage.read(key: 'notif_vaccine_reminders');
    final appointmentReminders = await _storage.read(key: 'notif_appointment_reminders');
    final campaignNotifications = await _storage.read(key: 'notif_campaign_notifications');
    final systemNotifications = await _storage.read(key: 'notif_system_notifications');
    final soundEnabled = await _storage.read(key: 'notif_sound_enabled');
    final vibrationEnabled = await _storage.read(key: 'notif_vibration_enabled');
    
    setState(() {
      _vaccineReminders = vaccineReminders != 'false';
      _appointmentReminders = appointmentReminders != 'false';
      _campaignNotifications = campaignNotifications != 'false';
      _systemNotifications = systemNotifications != 'false';
      _soundEnabled = soundEnabled != 'false';
      _vibrationEnabled = vibrationEnabled != 'false';
    });
  }
  
  Future<void> _saveSetting(String key, bool value) async {
    await _storage.write(key: key, value: value.toString());
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.md),
            
            // Types de notifications
            _buildSection(
              title: 'Types de notifications',
              icon: Icons.notifications_outlined,
              children: [
                _buildSwitchTile(
                  title: 'Rappels de vaccination',
                  subtitle: 'Recevoir des alertes pour les vaccins à venir',
                  icon: Icons.vaccines_outlined,
                  value: _vaccineReminders,
                  onChanged: (value) {
                    setState(() => _vaccineReminders = value);
                    _saveSetting('notif_vaccine_reminders', value);
                  },
                ),
                
                _buildSwitchTile(
                  title: 'Rappels de rendez-vous',
                  subtitle: 'Notifications pour vos prochains rendez-vous',
                  icon: Icons.event_outlined,
                  value: _appointmentReminders,
                  onChanged: (value) {
                    setState(() => _appointmentReminders = value);
                    _saveSetting('notif_appointment_reminders', value);
                  },
                ),
                
                _buildSwitchTile(
                  title: 'Campagnes de vaccination',
                  subtitle: 'Informations sur les nouvelles campagnes',
                  icon: Icons.campaign_outlined,
                  value: _campaignNotifications,
                  onChanged: (value) {
                    setState(() => _campaignNotifications = value);
                    _saveSetting('notif_campaign_notifications', value);
                  },
                ),
                
                _buildSwitchTile(
                  title: 'Notifications système',
                  subtitle: 'Mises à jour et informations importantes',
                  icon: Icons.info_outline,
                  value: _systemNotifications,
                  onChanged: (value) {
                    setState(() => _systemNotifications = value);
                    _saveSetting('notif_system_notifications', value);
                  },
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Paramètres sonores
            _buildSection(
              title: 'Paramètres sonores',
              icon: Icons.volume_up_outlined,
              children: [
                _buildSwitchTile(
                  title: 'Son',
                  subtitle: 'Jouer un son lors d\'une notification',
                  icon: Icons.music_note_outlined,
                  value: _soundEnabled,
                  onChanged: (value) {
                    setState(() => _soundEnabled = value);
                    _saveSetting('notif_sound_enabled', value);
                  },
                ),
                
                _buildSwitchTile(
                  title: 'Vibration',
                  subtitle: 'Vibrer lors d\'une notification',
                  icon: Icons.vibration_outlined,
                  value: _vibrationEnabled,
                  onChanged: (value) {
                    setState(() => _vibrationEnabled = value);
                    _saveSetting('notif_vibration_enabled', value);
                  },
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
                      Icons.info_outline_rounded,
                      color: AppColors.info,
                      size: 20,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        'Les notifications vous aident à ne jamais manquer un vaccin important pour votre enfant.',
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
  
  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: Icon(icon, size: 24, color: AppColors.primary),
      ),
      title: Text(
        title,
        style: AppTextStyles.bodyLarge.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.textSecondary,
        ),
      ),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primary,
      ),
    );
  }
}
