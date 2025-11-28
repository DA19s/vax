import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/system_settings.dart';

class SettingsService {
  static const String baseUrl = 'http://localhost:5000';
  static const _storage = FlutterSecureStorage();
  static const String _settingsCacheKey = 'system_settings_cache';

  /// Récupère les paramètres système depuis l'API
  static Future<SystemSettings> getSystemSettings() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/system-settings'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final settings = SystemSettings.fromJson(data);
        
        // Mettre en cache les settings
        await _storage.write(key: _settingsCacheKey, value: json.encode(data));
        
        return settings;
      } else {
        // En cas d'erreur, retourner les settings depuis le cache
        return await _getSettingsFromCache();
      }
    } catch (e) {
      print('❌ Erreur récupération settings: $e');
      // En cas d'erreur réseau, utiliser le cache
      return await _getSettingsFromCache();
    }
  }

  /// Récupère les settings depuis le cache local
  static Future<SystemSettings> _getSettingsFromCache() async {
    try {
      final cachedData = await _storage.read(key: _settingsCacheKey);
      if (cachedData != null) {
        final data = json.decode(cachedData);
        return SystemSettings.fromJson(data);
      }
    } catch (e) {
      print('⚠️ Erreur lecture cache settings: $e');
    }
    
    // Retourner les settings par défaut
    return SystemSettings(
      appName: 'VaxCare',
      appSubtitle: 'Santé de votre enfant simplifiée',
      mobileBackgroundColor: '#0A1A33',
      mobileButtonColor: '#3B760F',
      onboardingSlide1Title: 'Calendrier vaccinal simplifié',
      onboardingSlide1Subtitle: 'Consultez tous les rendez-vous de vaccination de vos enfants en un seul endroit.',
      onboardingSlide2Title: 'Suivi professionnel et personnalisé',
      onboardingSlide2Subtitle: 'Des agents de santé qualifiés pour accompagner chaque étape de la vaccination.',
      onboardingSlide3Title: 'Notifications et rappels intelligents',
      onboardingSlide3Subtitle: 'Ne manquez plus jamais un vaccin important pour la santé de votre enfant.',
      dashboardSlide1Title: 'Suivi Vaccinal Complet',
      dashboardSlide1Subtitle: 'Tous les vaccins de votre enfant en un clin d\'œil',
      dashboardSlide2Title: 'Rendez-vous à Venir',
      dashboardSlide2Subtitle: 'Ne manquez jamais un rendez-vous important',
      dashboardSlide3Title: 'Santé de Votre Enfant',
      dashboardSlide3Subtitle: 'Suivez la croissance et le développement',
    );
  }

  /// Vide le cache des settings
  static Future<void> clearSettingsCache() async {
    await _storage.delete(key: _settingsCacheKey);
  }
}
