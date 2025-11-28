import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String _baseUrl = 'http://localhost:5000/api';
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  
  // Headers avec authentification
  static Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'auth_token');
    print('🔑 Token récupéré du storage: ${token != null ? "${token.substring(0, 20)}..." : "NULL"}');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  // Gestion des erreurs HTTP
  static void _handleHttpError(http.Response response) {
    if (response.statusCode >= 400) {
      try {
        final error = json.decode(response.body);
        throw Exception(error['message'] ?? 'Erreur API: ${response.statusCode}');
      } catch (e) {
        throw Exception('Erreur API: ${response.statusCode}');
      }
    }
  }
  
  // Données mock DÉSACTIVÉES - Utilisation uniquement des vraies données
  static bool _useMockData = false;
  
  static Future<T> _withFallback<T>(Future<T> Function() apiCall, T Function() mockData) async {
    try {
      return await apiCall();
    } catch (e) {
      print('❌ ERREUR API: $e');
      print('⚠️ PAS DE MOCK - Vérifiez que le backend est démarré sur http://localhost:5000');
      rethrow; // Propager l'erreur au lieu d'utiliser les mocks
    }
  }
  
  // Mock data generators
  static Map<String, dynamic> _getMockStats() => {
    'totalVaccines': 12,
    'completedVaccines': 8,
    'missedVaccines': 2,
    'remainingVaccines': 4,
    'scheduledVaccines': 3,
    'overdueVaccines': 1,
  };
  
  static List<Map<String, dynamic>> _getMockNotifications() => [
    {
      '_id': '1',
      'title': 'Rappel de vaccination',
      'message': 'N\'oubliez pas le vaccin BCG prévu demain',
      'type': 'vaccination',
      'createdAt': DateTime.now().subtract(Duration(hours: 2)).toIso8601String(),
    },
    {
      '_id': '2', 
      'title': 'Nouvelle campagne',
      'message': 'Campagne de vaccination contre la polio',
      'type': 'campagne',
      'createdAt': DateTime.now().subtract(Duration(days: 1)).toIso8601String(),
    }
  ];
  
  static List<Map<String, dynamic>> _getMockAppointments() => [
    {
      '_id': '1',
      'vaccine': {'name': 'BCG'},
      'date': DateTime.now().add(Duration(days: 7)).toIso8601String(),
      'status': 'scheduled',
    },
    {
      '_id': '2',
      'vaccine': {'name': 'Polio'},
      'date': DateTime.now().add(Duration(days: 14)).toIso8601String(), 
      'status': 'scheduled',
    }
  ];
  
  static List<Map<String, dynamic>> _getMockActivity() => [
    {
      'type': 'vaccination',
      'title': 'Vaccin BCG administré',
      'date': DateTime.now().subtract(Duration(days: 3)).toIso8601String(),
      'createdAt': DateTime.now().subtract(Duration(days: 3)).toIso8601String(),
    },
    {
      'type': 'appointment',
      'title': 'Rendez-vous Polio programmé',
      'date': DateTime.now().subtract(Duration(days: 1)).toIso8601String(),
      'createdAt': DateTime.now().subtract(Duration(days: 1)).toIso8601String(),
    }
  ];
  
  // ==================== ENFANTS ====================
  
  /// Récupérer les informations d'un enfant
  static Future<Map<String, dynamic>> getChild(String childId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/mobile/children/$childId'),
      headers: headers,
    );
    
    _handleHttpError(response);
    final data = json.decode(response.body);
    // L'API retourne { success: true, child: {...} }
    if (data is Map && data['child'] != null) {
      return data['child'];
    }
    return data;
  }
  
  /// Récupérer tous les enfants d'un parent
  static Future<List<Map<String, dynamic>>> getParentChildren() async {
    print('🔍 ApiService.getParentChildren: Début de l\'appel');
    final headers = await _getHeaders();
    print('📤 Headers: ${headers.keys.toList()}');
    
    final url = '$_baseUrl/mobile/parent/children';
    print('🌐 URL: $url');
    
    final response = await http.get(
      Uri.parse(url),
      headers: headers,
    );
    
    print('📥 Status Code: ${response.statusCode}');
    print('📄 Response body: ${response.body}');
    
    _handleHttpError(response);
    final data = json.decode(response.body);
    // L'API retourne { success: true, count: X, children: [...] }
    if (data is Map && data['children'] != null) {
      print('✅ ${data['children'].length} enfant(s) trouvé(s)');
      return List<Map<String, dynamic>>.from(data['children']);
    }
    print('⚠️ Aucun enfant dans la réponse');
    return [];
  }
  
  /// Lier un enfant avec téléphone parent
  static Future<Map<String, dynamic>> linkChild(String childId, String parentPhone) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/children/link/$childId?phone=$parentPhone'),
      headers: headers,
    );
    
    _handleHttpError(response);
    return json.decode(response.body);
  }
  
  // ==================== VACCINATIONS ====================
  
  /// Récupérer les vaccinations d'un enfant
  static Future<List<Map<String, dynamic>>> getVaccinations(String childId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/mobile/children/$childId/vaccinations'),
      headers: headers,
    );
    
    _handleHttpError(response);
    final data = json.decode(response.body);
    return List<Map<String, dynamic>>.from(data['vaccinations'] ?? []);
  }
  
  /// Marquer un vaccin comme administré
  static Future<void> markVaccineAsGiven(String childId, String vaccineId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$_baseUrl/mobile/children/$childId/vaccinations/$vaccineId/administer'),
      headers: headers,
      body: json.encode({
        'administeredDate': DateTime.now().toIso8601String(),
        'status': 'administered',
      }),
    );
    
    _handleHttpError(response);
  }
  
  /// Récupérer le calendrier vaccinal
  static Future<List<Map<String, dynamic>>> getVaccinationCalendar(String childId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/mobile/children/$childId/calendar'),
      headers: headers,
    );
    
    _handleHttpError(response);
    final data = json.decode(response.body);
    return List<Map<String, dynamic>>.from(data['calendar'] ?? []);
  }
  
  // ==================== RENDEZ-VOUS ====================
  
  /// Récupérer les rendez-vous d'un enfant
  static Future<List<Map<String, dynamic>>> getAppointments(String childId) async {
    return _withFallback(
      () async {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/mobile/children/$childId/appointments'),
          headers: headers,
        );
        _handleHttpError(response);
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data);
      },
      _getMockAppointments,
    );
  }
  
  /// Créer un nouveau rendez-vous
  static Future<Map<String, dynamic>> createAppointment(String childId, Map<String, dynamic> appointmentData) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$_baseUrl/mobile/children/$childId/appointments'),
      headers: headers,
      body: json.encode(appointmentData),
    );
    
    _handleHttpError(response);
    return json.decode(response.body);
  }
  
  /// Annuler un rendez-vous
  static Future<void> cancelAppointment(String childId, String appointmentId) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$_baseUrl/mobile/children/$childId/appointments/$appointmentId'),
      headers: headers,
      body: json.encode({'status': 'cancelled'}),
    );
    
    _handleHttpError(response);
  }
  
  // ==================== NOTIFICATIONS ====================
  
  /// Récupérer les notifications du parent connecté
  static Future<List<Map<String, dynamic>>> getNotifications(String childId) async {
    return _withFallback(
      () async {
        print('📡 Appel API: $_baseUrl/notifications');
        final headers = await _getHeaders();
        print('📤 Headers envoyés: ${headers.keys.toList()}');
        final response = await http.get(
          Uri.parse('$_baseUrl/notifications'),
          headers: headers,
        );
        print('📥 Status Code: ${response.statusCode}');
        if (response.statusCode == 401) {
          print('❌ 401 Unauthorized - Token invalide ou manquant');
          print('📄 Response body: ${response.body}');
        }
        _handleHttpError(response);
        final data = json.decode(response.body);
        // L'API retourne { success: true, notifications: [...] }
        if (data is Map && data['notifications'] != null) {
          print('✅ ${data['notifications'].length} notifications reçues');
          return List<Map<String, dynamic>>.from(data['notifications']);
        }
        return List<Map<String, dynamic>>.from(data);
      },
      _getMockNotifications,
    );
  }
  
  /// Récupérer les notifications d'un enfant spécifique
  static Future<List<Map<String, dynamic>>> getChildNotifications(String childId) async {
    return _withFallback(
      () async {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/mobile/children/$childId/notifications'),
          headers: headers,
        );
        _handleHttpError(response);
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data);
      },
      _getMockNotifications,
    );
  }
  
  /// Marquer une notification comme lue
  static Future<void> markNotificationAsRead(String notificationId) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$_baseUrl/notifications/$notificationId/read'),
      headers: headers,
    );
    
    _handleHttpError(response);
  }
  
  // ==================== STATISTIQUES ====================
  
  /// Récupérer les statistiques de vaccination d'un enfant
  static Future<Map<String, dynamic>> getVaccinationStats(String childId) async {
    return _withFallback(
      () async {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/mobile/children/$childId/stats'),
          headers: headers,
        );
        _handleHttpError(response);
        return json.decode(response.body);
      },
      _getMockStats,
    );
  }
  
  /// Récupérer l'activité récente d'un enfant
  static Future<List<Map<String, dynamic>>> getRecentActivity(String childId) async {
    return _withFallback(
      () async {
        final headers = await _getHeaders();
        final response = await http.get(
          Uri.parse('$_baseUrl/mobile/children/$childId/activity'),
          headers: headers,
        );
        _handleHttpError(response);
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data);
      },
      _getMockActivity,
    );
  }
  
  // ==================== CAMPAGNES ====================
  
  /// Récupérer les campagnes de vaccination
  static Future<List<Map<String, dynamic>>> getCampaigns() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/campaigns'),
      headers: headers,
    );
    
    _handleHttpError(response);
    final data = json.decode(response.body);
    // L'API retourne { success: true, campaigns: [...] }
    if (data is Map && data['campaigns'] != null) {
      return List<Map<String, dynamic>>.from(data['campaigns']);
    }
    return List<Map<String, dynamic>>.from(data);
  }
  
  /// Récupérer le détail d'une campagne
  static Future<Map<String, dynamic>> getCampaignById(String campaignId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$_baseUrl/campaigns/$campaignId'),
      headers: headers,
    );
    
    _handleHttpError(response);
    final data = json.decode(response.body);
    return data['campaign'] ?? data;
  }
  
  // ==================== AUTHENTIFICATION ====================
  
  /// Connexion avec ID enfant et téléphone parent
  static Future<Map<String, dynamic>> login(String childId, String parentPhone) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'childId': childId,
        'parentPhone': parentPhone,
      }),
    );
    
    _handleHttpError(response);
    final data = json.decode(response.body);
    
    // Sauvegarder le token
    if (data['token'] != null) {
      await _storage.write(key: 'auth_token', value: data['token']);
      await _storage.write(key: 'child_id', value: childId);
    }
    
    return data;
  }
  
  /// Déconnexion
  static Future<void> logout() async {
    await _storage.deleteAll();
  }
  
  // ==================== CONSEILS DE SANTÉ ====================
  
  /// Récupérer les conseils de santé
  static Future<List<Map<String, dynamic>>> getHealthTips() async {
    return _withFallback<List<Map<String, dynamic>>>(
      () async {
        final response = await http.get(
          Uri.parse('$_baseUrl/health-tips'),
          headers: await _getHeaders(),
        );
        _handleHttpError(response);
        
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['tips'] ?? []);
      },
      () => <Map<String, dynamic>>[], // Retourne liste vide si erreur
    );
  }

  /* -------------------------------------------------------------------------- */
  /* 🏥 DEMANDES DE RENDEZ-VOUS INTELLIGENTES                                 */
  /* -------------------------------------------------------------------------- */

  // Rechercher centres avec stock disponible pour un vaccin
  static Future<List<Map<String, dynamic>>> searchAvailableCenters(String vaccine, {String? region}) async {
    try {
      final uri = Uri.parse('$_baseUrl/appointment-requests/available-centers');
      final params = {'vaccine': vaccine};
      if (region != null) params['region'] = region;
      
      final response = await http.get(
        uri.replace(queryParameters: params),
        headers: await _getHeaders(),
      );
      _handleHttpError(response);
      
      final data = json.decode(response.body);
      return List<Map<String, dynamic>>.from(data['centers'] ?? []);
    } catch (e) {
      print('❌ Erreur recherche centres: $e');
      return [];
    }
  }

  // Créer une demande de rendez-vous
  static Future<Map<String, dynamic>> createAppointmentRequest({
    required String childId,
    required String vaccine,
    required String healthCenter,
    required String region,
    String? district,
    required DateTime requestedDate,
    String? requestMessage,
    String urgencyLevel = 'normal',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/appointment-requests/create'),
        headers: await _getHeaders(),
        body: json.encode({
          'childId': childId,
          'vaccine': vaccine,
          'healthCenter': healthCenter,
          'region': region,
          'district': district,
          'requestedDate': requestedDate.toIso8601String(),
          'requestMessage': requestMessage,
          'urgencyLevel': urgencyLevel,
        }),
      );
      _handleHttpError(response);
      
      return json.decode(response.body);
    } catch (e) {
      print('❌ Erreur création demande RDV: $e');
      rethrow;
    }
  }

  // Récupérer les demandes d'un parent
  static Future<List<Map<String, dynamic>>> getParentRequests(String childId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/appointment-requests/parent/$childId'),
        headers: await _getHeaders(),
      );
      _handleHttpError(response);
      
      final data = json.decode(response.body);
      return List<Map<String, dynamic>>.from(data['requests'] ?? []);
    } catch (e) {
      print('❌ Erreur récupération demandes: $e');
      return [];
    }
  }
  
  // ==================== UTILITAIRES ====================
  
  /// Vérifier si l'utilisateur est connecté
  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'auth_token');
    return token != null && token.isNotEmpty;
  }
  
  /// Récupérer l'ID de l'enfant connecté
  static Future<String?> getCurrentChildId() async {
    return await _storage.read(key: 'child_id');
  }
  
  /// Récupérer le token d'authentification
  static Future<String?> getAuthToken() async {
    return await _storage.read(key: 'auth_token');
  }
}