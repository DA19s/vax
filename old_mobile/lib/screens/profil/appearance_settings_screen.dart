import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

class AppearanceSettingsScreen extends StatefulWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  State<AppearanceSettingsScreen> createState() => _AppearanceSettingsScreenState();
}

class _AppearanceSettingsScreenState extends State<AppearanceSettingsScreen> {
  final _storage = const FlutterSecureStorage();
  
  String _themeMode = 'light'; // light, dark, system
  String _fontSize = 'medium'; // small, medium, large
  bool _animationsEnabled = true;
  Color _accentColor = AppColors.primary;
  
  final List<Color> _accentColors = [
    const Color(0xFF3B760F), // Vert VaxCare (défaut)
    const Color(0xFF2196F3), // Bleu
    const Color(0xFFE91E63), // Rose
    const Color(0xFF9C27B0), // Violet
    const Color(0xFFFF9800), // Orange
    const Color(0xFF009688), // Turquoise
    const Color(0xFFF44336), // Rouge
    const Color(0xFF795548), // Marron
  ];
  
  @override
  void initState() {
    super.initState();
    _loadSettings();
  }
  
  Future<void> _loadSettings() async {
    final themeMode = await _storage.read(key: 'app_theme_mode') ?? 'light';
    final fontSize = await _storage.read(key: 'app_font_size') ?? 'medium';
    final animations = await _storage.read(key: 'app_animations_enabled');
    final accentColorHex = await _storage.read(key: 'app_accent_color');
    
    setState(() {
      _themeMode = themeMode;
      _fontSize = fontSize;
      _animationsEnabled = animations != 'false';
      if (accentColorHex != null) {
        _accentColor = Color(int.parse(accentColorHex.substring(1), radix: 16) + 0xFF000000);
      }
    });
  }
  
  Future<void> _saveSetting(String key, String value) async {
    await _storage.write(key: key, value: value);
  }
  
  Future<void> _saveThemeMode(String mode) async {
    setState(() => _themeMode = mode);
    await _saveSetting('app_theme_mode', mode);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Text(
                mode == 'dark' 
                    ? 'Thème sombre activé (redémarrage requis)'
                    : mode == 'light' 
                        ? 'Thème clair activé'
                        : 'Thème système activé',
              ),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
  
  Future<void> _saveFontSize(String size) async {
    setState(() => _fontSize = size);
    await _saveSetting('app_font_size', size);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 12),
              Text('Taille de police : ${_getFontSizeLabel(size)}'),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
  
  Future<void> _saveAccentColor(Color color) async {
    setState(() => _accentColor = color);
    final hexColor = '#${color.value.toRadixString(16).substring(2).toUpperCase()}';
    await _saveSetting('app_accent_color', hexColor);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 12),
              Text('Couleur d\'accent modifiée (redémarrage requis)'),
            ],
          ),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
  
  String _getFontSizeLabel(String size) {
    switch (size) {
      case 'small':
        return 'Petit';
      case 'large':
        return 'Grand';
      default:
        return 'Normal';
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Apparence'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.md),
            
            // Thème
            _buildSection(
              title: 'Thème',
              icon: Icons.brightness_6_outlined,
              children: [
                _buildRadioTile(
                  title: 'Clair',
                  subtitle: 'Fond blanc avec texte sombre',
                  icon: Icons.light_mode_outlined,
                  value: 'light',
                  groupValue: _themeMode,
                  onChanged: _saveThemeMode,
                ),
                _buildRadioTile(
                  title: 'Sombre',
                  subtitle: 'Fond sombre avec texte clair',
                  icon: Icons.dark_mode_outlined,
                  value: 'dark',
                  groupValue: _themeMode,
                  onChanged: _saveThemeMode,
                ),
                _buildRadioTile(
                  title: 'Système',
                  subtitle: 'Suivre les paramètres de l\'appareil',
                  icon: Icons.settings_brightness_outlined,
                  value: 'system',
                  groupValue: _themeMode,
                  onChanged: _saveThemeMode,
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Taille de police
            _buildSection(
              title: 'Taille de police',
              icon: Icons.text_fields_outlined,
              children: [
                _buildRadioTile(
                  title: 'Petit',
                  subtitle: 'Pour une meilleure densité',
                  icon: Icons.text_decrease_outlined,
                  value: 'small',
                  groupValue: _fontSize,
                  onChanged: _saveFontSize,
                ),
                _buildRadioTile(
                  title: 'Normal',
                  subtitle: 'Taille recommandée',
                  icon: Icons.text_fields_outlined,
                  value: 'medium',
                  groupValue: _fontSize,
                  onChanged: _saveFontSize,
                ),
                _buildRadioTile(
                  title: 'Grand',
                  subtitle: 'Plus facile à lire',
                  icon: Icons.text_increase_outlined,
                  value: 'large',
                  groupValue: _fontSize,
                  onChanged: _saveFontSize,
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Couleur d'accent
            _buildSection(
              title: 'Couleur d\'accent',
              icon: Icons.palette_outlined,
              children: [
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.sm,
                    children: _accentColors.map((color) {
                      final isSelected = _accentColor.value == color.value;
                      return GestureDetector(
                        onTap: () => _saveAccentColor(color),
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            border: isSelected
                                ? Border.all(color: Colors.black, width: 3)
                                : null,
                            boxShadow: [
                              BoxShadow(
                                color: color.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: isSelected
                              ? const Icon(Icons.check, color: Colors.white, size: 28)
                              : null,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: AppSpacing.lg),
            
            // Animations
            _buildSection(
              title: 'Animations',
              icon: Icons.animation_outlined,
              children: [
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: const Icon(Icons.animation_outlined, color: AppColors.primary),
                  ),
                  title: const Text('Animations activées'),
                  subtitle: const Text('Transitions et effets visuels'),
                  trailing: Switch(
                    value: _animationsEnabled,
                    onChanged: (value) async {
                      setState(() => _animationsEnabled = value);
                      await _saveSetting('app_animations_enabled', value.toString());
                    },
                    activeColor: AppColors.primary,
                  ),
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
                        'Certains changements nécessitent un redémarrage de l\'application pour prendre effet.',
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
  
  Widget _buildRadioTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required String value,
    required String groupValue,
    required ValueChanged<String> onChanged,
  }) {
    final isSelected = value == groupValue;
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppColors.primary.withOpacity(0.15)
              : AppColors.primary.withOpacity(0.08),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        child: Icon(
          icon, 
          color: isSelected ? AppColors.primary : AppColors.textSecondary,
        ),
      ),
      title: Text(
        title,
        style: AppTextStyles.bodyLarge.copyWith(
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.textSecondary,
        ),
      ),
      trailing: Radio<String>(
        value: value,
        groupValue: groupValue,
        onChanged: (val) => onChanged(val!),
        activeColor: AppColors.primary,
      ),
      onTap: () => onChanged(value),
    );
  }
}
