import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../link/link_child_screen.dart'; // ✅ chemin corrigé: fichier dans /screens/link/
import '../profil/children_selector_screen.dart';
import 'create_pin_screen.dart';
import 'pin_login_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController idController = TextEditingController();
  bool isLoading = false;
  String? error;

  final storage = const FlutterSecureStorage(); // ⭐ conserve le token

  Future<void> _verifyChildAndNavigate() async {
    final phone = phoneController.text.trim();
    final id = idController.text.trim();

    if (phone.isEmpty || id.isEmpty) {
      setState(() => error = "Veuillez saisir le numéro et l'ID reçus par SMS.");
      return;
    }

    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      // 1) Vérifier la liaison enfant
      final url = Uri.parse("http://localhost:5000/api/children/link/$id?phone=$phone");
      final response = await http.get(url);
      final data = json.decode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        // 2) Auth parent par téléphone → récupère un JWT et le stocke
        final authUrl = Uri.parse("http://localhost:5000/api/mobile/parent-link-auth");
        final authRes = await http.post(
          authUrl,
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "childId": id,
            "parentPhone": phone,
          }),
        );

        if (authRes.statusCode == 200) {
          final auth = jsonDecode(authRes.body);
          final token = auth["token"] as String?;
          if (token != null && token.isNotEmpty) {
            debugPrint("✅ Token JWT reçu: ${token.substring(0, 20)}...");
            
            // ⭐ Vérifier si l'utilisateur a déjà un PIN configuré
            final hasPin = await AuthService.hasPin();
            
            if (hasPin) {
              // L'utilisateur a déjà un PIN → On garde le token temporairement et on ré-authentifie avec PIN
              await storage.write(key: 'auth_token', value: token);
              debugPrint("🔐 Utilisateur a déjà un PIN, stockage temporaire du token");
              
              if (!mounted) return;
              
              // Aller à l'écran PIN login
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => const PinLoginScreen(),
                ),
              );
            } else {
              // Première connexion → Créer un PIN
              debugPrint("🆕 Première connexion, création du PIN");
              
              // Préparer les données utilisateur pour le stockage
              final Map<String, dynamic> userData = {
                ...Map<String, dynamic>.from(data["child"]),
                "parentPhone": phone,
                "token": token,
              };
              
              if (!mounted) return;
              
              // Aller à l'écran de création de PIN
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => CreatePinScreen(
                    token: token,
                    userData: userData,
                  ),
                ),
              );
            }
          } else {
            debugPrint("⚠️ Aucun token reçu dans la réponse");
            // Aller à l'écran de liaison même sans token
            if (!mounted) return;
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => LinkChildScreen(child: data["child"]),
              ),
            );
          }
        } else {
          debugPrint("⚠️ parent-link-auth a échoué: ${authRes.statusCode} ${authRes.body}");
          // Aller à l'écran de liaison même si l'auth a échoué
          if (!mounted) return;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => LinkChildScreen(child: data["child"]),
            ),
          );
        }
      } else {
        setState(() =>
            error = data["message"] ?? "Aucun enfant trouvé pour ces informations.");
      }
    } catch (e) {
      setState(() => error = "Erreur de connexion au serveur.");
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 20),

              // ✅ Logo VacxCare
              Column(
                children: [
                  Image.asset(
                    "assets/images/logo_vacxcare.png",
                    width: 80,
                    height: 80,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "VacxCare",
                    style: GoogleFonts.poppins(
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF0A1A33),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 40),

              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Numéro de téléphone",
                  style: GoogleFonts.poppins(
                      fontSize: 15, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  hintText: "Ex: 77 123 45 67",
                  prefixIcon: const Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              ),

              const SizedBox(height: 24),

              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "ID reçu par SMS",
                  style: GoogleFonts.poppins(
                      fontSize: 15, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: idController,
                decoration: InputDecoration(
                  hintText: "Entrez l'ID transmis par l’agent de santé",
                  prefixIcon: const Icon(Icons.key_outlined),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              ),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading ? null : _verifyChildAndNavigate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0A1A33),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(
                          "Continuer",
                          style: GoogleFonts.poppins(
                              fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
              ),

              const SizedBox(height: 20),

              if (error != null)
                Text(
                  error!,
                  style: const TextStyle(color: Colors.red, fontSize: 14),
                ),

              const SizedBox(height: 10),
              Text(
                "Vous n’avez pas encore d’ID ?\nContactez votre agent de santé.",
                textAlign: TextAlign.center,
                style:
                    GoogleFonts.poppins(fontSize: 13, color: Colors.grey[700]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}