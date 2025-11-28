import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../services/auth_service.dart';
import 'improved_vaccine_selection_screen.dart';
import '../dashboard/modern_dashboard_screen.dart';

class CreatePinScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic> userData;
  final bool isNewParent; // Nouveau paramètre pour savoir si c'est un parent qui s'inscrit
  
  const CreatePinScreen({
    Key? key,
    required this.token,
    required this.userData,
    this.isNewParent = false,
  }) : super(key: key);

  @override
  State<CreatePinScreen> createState() => _CreatePinScreenState();
}

class _CreatePinScreenState extends State<CreatePinScreen> {
  final List<TextEditingController> _pinControllers = 
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(4, (_) => FocusNode());
  
  final List<TextEditingController> _confirmPinControllers = 
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _confirmFocusNodes = List.generate(4, (_) => FocusNode());
  
  bool _isConfirming = false;
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    for (var controller in _pinControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    for (var controller in _confirmPinControllers) {
      controller.dispose();
    }
    for (var node in _confirmFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String _getPin() {
    return _pinControllers.map((c) => c.text).join();
  }

  String _getConfirmPin() {
    return _confirmPinControllers.map((c) => c.text).join();
  }

  void _onPinDigitChanged(int index, String value, bool isConfirm) {
    if (value.isNotEmpty && index < 3) {
      // Passer au champ suivant
      if (isConfirm) {
        _confirmFocusNodes[index + 1].requestFocus();
      } else {
        _focusNodes[index + 1].requestFocus();
      }
    }

    // Vérifier si le PIN est complet
    final controllers = isConfirm ? _confirmPinControllers : _pinControllers;
    final pin = controllers.map((c) => c.text).join();
    
    if (pin.length == 4) {
      if (!_isConfirming && !isConfirm) {
        // Premier PIN complet, passer à la confirmation
        setState(() {
          _isConfirming = true;
          _error = null;
        });
        Future.delayed(const Duration(milliseconds: 300), () {
          _confirmFocusNodes[0].requestFocus();
        });
      } else if (_isConfirming && isConfirm) {
        // Confirmation complète, valider
        _validateAndSavePin();
      }
    }
  }

  void _onPinDigitDeleted(int index, bool isConfirm) {
    if (index > 0) {
      // Revenir au champ précédent
      if (isConfirm) {
        _confirmFocusNodes[index - 1].requestFocus();
      } else {
        _focusNodes[index - 1].requestFocus();
      }
    }
  }

  Future<void> _validateAndSavePin() async {
    final pin = _getPin();
    final confirmPin = _getConfirmPin();

    if (pin != confirmPin) {
      setState(() {
        _error = "Les codes PIN ne correspondent pas";
        // Réinitialiser la confirmation
        for (var controller in _confirmPinControllers) {
          controller.clear();
        }
        _confirmFocusNodes[0].requestFocus();
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Sauvegarder toutes les données d'authentification localement
      await AuthService.saveCompleteAuthData(
        token: widget.token,
        userData: widget.userData,
        pin: pin,
      );

      // 🔐 Sauvegarder le PIN sur le serveur
      final childId = widget.userData['id'] ?? widget.userData['_id'];
      final parentPhone = widget.userData['parentPhone'];
      
      final response = await http.post(
        Uri.parse('http://localhost:5000/api/mobile/parent-pin/save'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${widget.token}',
        },
        body: json.encode({
          'childId': childId,
          'parentPhone': parentPhone,
          'pin': pin,
        }),
      );

      if (response.statusCode != 200) {
        debugPrint("⚠️ Erreur sauvegarde PIN serveur: ${response.body}");
        // On continue quand même car le PIN est sauvegardé localement
      } else {
        debugPrint("✅ PIN sauvegardé sur le serveur");
      }

      if (!mounted) return;

      // Navigation conditionnelle selon le type de parent
      if (widget.isNewParent) {
        // Nouveau parent qui s'inscrit → Sélection des vaccins
        final childId = widget.userData['_id'] ?? widget.userData['id'];
        final birthDate = widget.userData['birthDate'] != null
            ? DateTime.parse(widget.userData['birthDate'])
            : DateTime.now();

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ImprovedVaccineSelectionScreen(
              childId: childId,
              childBirthDate: birthDate,
              token: widget.token,
            ),
          ),
        );
      } else {
        // Parent existant qui reçoit un code d'accès d'un agent → Dashboard direct
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (_) => ModernDashboardScreen(child: widget.userData),
          ),
          (route) => false,
        );
      }
    } catch (e) {
      debugPrint("❌ Erreur lors de la sauvegarde du PIN: $e");
      setState(() {
        _isLoading = false;
        _error = "Erreur lors de la sauvegarde du PIN";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: _isConfirming
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Color(0xFF0A1A33)),
                onPressed: () {
                  setState(() {
                    _isConfirming = false;
                    _error = null;
                    for (var controller in _confirmPinControllers) {
                      controller.clear();
                    }
                  });
                },
              )
            : null,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 20),
              
              // Logo dans un cercle avec ombre
              Container(
                padding: const EdgeInsets.all(20),
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
                  width: 80,
                  height: 80,
                ),
              ),
              
              const SizedBox(height: 24),
              
              Text(
                _isConfirming ? "Confirmez votre code PIN" : "Créez votre code PIN",
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0A1A33),
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 8),
              
              Text(
                _isConfirming 
                    ? "Saisissez à nouveau votre code PIN"
                    : "Ce code vous permettra d'accéder rapidement à votre compte",
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 48),
              
              // Champs PIN
              _buildPinFields(
                _isConfirming ? _confirmPinControllers : _pinControllers,
                _isConfirming ? _confirmFocusNodes : _focusNodes,
                _isConfirming,
              ),
              
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
              
              // Info sécurité
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF3BA3E5).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline,
                      color: Color(0xFF3BA3E5),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        "Mémorisez bien ce code, il vous sera demandé à chaque connexion",
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: const Color(0xFF0A1A33),
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
    );
  }

  Widget _buildPinFields(
    List<TextEditingController> controllers,
    List<FocusNode> focusNodes,
    bool isConfirm,
  ) {
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
              color: focusNodes[index].hasFocus
                  ? const Color(0xFF3BA3E5)
                  : Colors.grey[300]!,
              width: 2,
            ),
            boxShadow: focusNodes[index].hasFocus
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
            controller: controllers[index],
            focusNode: focusNodes[index],
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
              _onPinDigitChanged(index, value, isConfirm);
            },
            onTap: () {
              // Si on clique sur un champ et que le précédent est vide, revenir au précédent
              if (index > 0 && controllers[index - 1].text.isEmpty) {
                focusNodes[index - 1].requestFocus();
              }
            },
            onEditingComplete: () {
              if (controllers[index].text.isEmpty && index > 0) {
                _onPinDigitDeleted(index, isConfirm);
              }
            },
          ),
        );
      }),
    );
  }
}
