import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import '../../services/auth_service.dart';
import '../../models/system_settings.dart';
import '../dashboard/modern_dashboard_screen.dart';

class PinLoginScreen extends StatefulWidget {
  final SystemSettings? settings;
  
  const PinLoginScreen({Key? key, this.settings}) : super(key: key);

  @override
  State<PinLoginScreen> createState() => _PinLoginScreenState();
}

class _PinLoginScreenState extends State<PinLoginScreen> {
  final List<TextEditingController> _pinControllers = 
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());
  final _storage = const FlutterSecureStorage();
  
  bool _isLoading = false;
  String? _error;
  int _failedAttempts = 0;

  @override
  void initState() {
    super.initState();
    // Focus automatique sur le premier champ
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        _focusNodes[0].requestFocus();
      }
    });
  }

  @override
  void dispose() {
    for (var controller in _pinControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String _getPin() {
    return _pinControllers.map((c) => c.text).join();
  }

  void _clearPin() {
    for (var controller in _pinControllers) {
      controller.clear();
    }
    _focusNodes[0].requestFocus();
  }

  void _onPinDigitChanged(int index, String value) {
    if (value.isNotEmpty && index < 3) {
      // Passer au champ suivant
      _focusNodes[index + 1].requestFocus();
    }

    // Vérifier si le PIN est complet
    final pin = _getPin();
    if (pin.length == 4) {
      _verifyPin(pin);
    }
  }

  void _onPinDigitDeleted(int index) {
    if (index > 0) {
      // Revenir au champ précédent
      _focusNodes[index - 1].requestFocus();
    }
  }

  Future<void> _verifyPin(String pin) async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Récupérer les informations stockées
      final token = await _storage.read(key: 'auth_token');
      final childId = await _storage.read(key: 'child_id');
      final parentPhone = await _storage.read(key: 'parent_phone');

      if (token == null || childId == null || parentPhone == null) {
        setState(() {
          _isLoading = false;
          _error = "Erreur: Informations manquantes";
          _clearPin();
        });
        return;
      }

      // 🔐 Vérifier le PIN côté serveur
      final response = await http.post(
        Uri.parse('http://localhost:5000/api/mobile/parent-pin/verify'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'childId': childId,
          'parentPhone': parentPhone,
          'pin': pin,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint("✅ PIN vérifié avec succès");
        
        // Sauvegarder le PIN localement après vérification serveur réussie
        await AuthService.savePin(pin);
        await AuthService.saveUserData(data['child']);
        await AuthService.setLoggedIn(true);
        
        if (!mounted) return;
        
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => ModernDashboardScreen(child: data['child']),
          ),
        );
      } else {
        // PIN incorrect
        debugPrint("❌ PIN incorrect: ${response.statusCode} ${response.body}");
        setState(() {
          _isLoading = false;
          _failedAttempts++;
          _error = _failedAttempts >= 3
              ? "Trop de tentatives. Utilisez 'Code PIN oublié'"
              : "Code PIN incorrect";
          _clearPin();
        });
      }
    } catch (e) {
      debugPrint("❌ Erreur lors de la vérification du PIN: $e");
      setState(() {
        _isLoading = false;
        _error = "Erreur lors de la vérification du PIN";
        _clearPin();
      });
    }
  }

  Future<void> _forgotPin() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Code PIN oublié ?',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        content: Text(
          'Vous devrez vous reconnecter avec votre numéro de téléphone et l\'ID reçu par SMS.',
          style: GoogleFonts.poppins(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Annuler',
              style: GoogleFonts.poppins(color: Colors.grey),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              backgroundColor: const Color(0xFF0A1A33),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              'Continuer',
              style: GoogleFonts.poppins(),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // Déconnexion et retour au login
      await AuthService.logout();
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/login',
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 24),
              
              // Logo dans un cercle avec ombre - AGRANDI
              Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0A1A33).withOpacity(0.15),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Image.asset(
                  "assets/images/logo_vacxcare.png",
                  width: 120,
                  height: 120,
                ),
              ),
              
              const SizedBox(height: 24),
              
              Text(
                "VaxCare",
                style: GoogleFonts.poppins(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0A1A33),
                ),
              ),
              
              const SizedBox(height: 32),
              
              Text(
                "Entrez votre code PIN",
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0A1A33),
                ),
              ),
              
              const SizedBox(height: 8),
              
              Text(
                "Saisissez votre code à 4 chiffres",
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Champs PIN
              _buildPinFields(),
              
              const SizedBox(height: 24),
              
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _error!,
                          style: GoogleFonts.poppins(
                            color: Colors.red,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const Spacer(),
              
              if (_isLoading)
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF0A1A33)),
                ),
              
              const SizedBox(height: 20),
              
              // Bouton mot de passe oublié
              TextButton(
                onPressed: _forgotPin,
                child: Text(
                  "Code PIN oublié ?",
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF3BA3E5),
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPinFields() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: List.generate(4, (index) {
        return Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _focusNodes[index].hasFocus
                  ? const Color(0xFF3BA3E5)
                  : Colors.grey[300]!,
              width: 2,
            ),
            boxShadow: _focusNodes[index].hasFocus
                ? [
                    BoxShadow(
                      color: const Color(0xFF3BA3E5).withOpacity(0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: TextField(
            controller: _pinControllers[index],
            focusNode: _focusNodes[index],
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            maxLength: 1,
            obscureText: true,
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF0A1A33),
            ),
            decoration: const InputDecoration(
              border: InputBorder.none,
              counterText: '',
            ),
            onChanged: (value) {
              _onPinDigitChanged(index, value);
            },
            onTap: () {
              // Si on clique sur un champ et que le précédent est vide, revenir au précédent
              if (index > 0 && _pinControllers[index - 1].text.isEmpty) {
                _focusNodes[index - 1].requestFocus();
              }
            },
            onEditingComplete: () {
              if (_pinControllers[index].text.isEmpty && index > 0) {
                _onPinDigitDeleted(index);
              }
            },
          ),
        );
      }),
    );
  }
}
