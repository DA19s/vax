import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../dashboard/modern_dashboard_screen.dart';

class ImprovedVaccineSelectionScreen extends StatefulWidget {
  final String childId;
  final DateTime childBirthDate;
  final String token;

  const ImprovedVaccineSelectionScreen({
    Key? key,
    required this.childId,
    required this.childBirthDate,
    required this.token,
  }) : super(key: key);

  @override
  State<ImprovedVaccineSelectionScreen> createState() => _ImprovedVaccineSelectionScreenState();
}

class _ImprovedVaccineSelectionScreenState extends State<ImprovedVaccineSelectionScreen>
    with SingleTickerProviderStateMixin {
  final storage = const FlutterSecureStorage();
  Map<String, List<Map<String, dynamic>>> _vaccinesByAge = {};
  Map<String, Set<String>> _selectedByAge = {};
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;
  int _currentAgeIndex = 0;
  List<String> _ageGroups = [];
  late AnimationController _celebrationController;
  late Animation<double> _scaleAnimation;
  bool _showCelebration = false;

  @override
  void initState() {
    super.initState();
    _celebrationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _celebrationController, curve: Curves.elasticOut),
    );
    _loadVaccineCalendar();
  }

  @override
  void dispose() {
    _celebrationController.dispose();
    super.dispose();
  }

  int _getChildAgeInMonths() {
    final now = DateTime.now();
    final difference = now.difference(widget.childBirthDate);
    final ageInMonths = (difference.inDays / 30.44).floor(); // Plus précis (moyenne jours/mois)
    print("👶 Âge de l'enfant: $ageInMonths mois (${difference.inDays} jours)");
    return ageInMonths;
  }

  String _getAgeLabelFromVaccine(Map<String, dynamic> vaccine) {
    final ageUnit = vaccine['ageUnit'] as String;
    final specificAge = vaccine['specificAge'];
    final minAge = vaccine['minAge'];
    int age = specificAge ?? minAge ?? 0;

    if (age == 0 && ageUnit == 'weeks') {
      return 'À la naissance';
    }

    String unit = '';
    switch (ageUnit) {
      case 'weeks':
        unit = age > 1 ? 'semaines' : 'semaine';
        break;
      case 'months':
        unit = age > 1 ? 'mois' : 'mois';
        break;
      case 'years':
        unit = age > 1 ? 'ans' : 'an';
        break;
    }

    return '$age $unit';
  }

  Future<void> _loadVaccineCalendar() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final ageInMonths = _getChildAgeInMonths();
      
      final url = Uri.parse("http://localhost:5000/api/vaccine-calendar");
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer ${widget.token}",
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> allCalendar = jsonDecode(response.body);

        print("📋 Total vaccins dans le calendrier: ${allCalendar.length}");
        
        // Filtrer les vaccins jusqu'à l'âge actuel de l'enfant
        final relevantVaccines = allCalendar.where((vaccine) {
          final ageUnit = vaccine['ageUnit'] as String;
          double vaccineAgeInMonths = 0;

          if (vaccine['specificAge'] != null) {
            final age = vaccine['specificAge'] as int;
            if (ageUnit == 'months') {
              vaccineAgeInMonths = age.toDouble();
            } else if (ageUnit == 'weeks') {
              vaccineAgeInMonths = age / 4.33; // Conversion plus précise semaines -> mois
            } else if (ageUnit == 'years') {
              vaccineAgeInMonths = age * 12.0;
            }
          } else if (vaccine['minAge'] != null) {
            final age = vaccine['minAge'] as int;
            if (ageUnit == 'months') {
              vaccineAgeInMonths = age.toDouble();
            } else if (ageUnit == 'weeks') {
              vaccineAgeInMonths = age / 4.33; // Conversion plus précise semaines -> mois
            } else if (ageUnit == 'years') {
              vaccineAgeInMonths = age * 12.0;
            }
          }

          final shouldInclude = vaccineAgeInMonths <= ageInMonths;
          final vaccineNames = (vaccine['vaccine'] as List).join(', ');
          
          print("💉 Vaccin: $vaccineNames - Âge: ${vaccine['specificAge'] ?? vaccine['minAge']} $ageUnit (${vaccineAgeInMonths.toStringAsFixed(1)} mois) - ${shouldInclude ? '✅ INCLUS' : '❌ EXCLU'}");
          
          return shouldInclude;
        }).toList();
        
        print("✅ Vaccins pertinents trouvés: ${relevantVaccines.length}");

        // Grouper par âge ET séparer chaque vaccin individuellement
        Map<String, List<Map<String, dynamic>>> grouped = {};
        for (var vaccine in relevantVaccines) {
          final ageLabel = _getAgeLabelFromVaccine(vaccine);
          if (!grouped.containsKey(ageLabel)) {
            grouped[ageLabel] = [];
            _selectedByAge[ageLabel] = {};
            print("📅 Nouvelle période d'âge: $ageLabel");
          }
          
          final vaccines = (vaccine['vaccine'] as List).cast<String>();
          // Ajouter chaque vaccin séparément
          for (var vaccineName in vaccines) {
            grouped[ageLabel]!.add({
              'id': vaccine['_id'],
              'vaccineName': vaccineName,
              'dose': vaccine['dose'],
              'description': vaccine['description'] ?? '',
            });
            print("   ➕ Ajout vaccin: $vaccineName (${vaccine['dose']})");
          }
        }

        print("\n📊 Résumé des périodes:");
        grouped.forEach((age, vaccines) {
          print("   $age: ${vaccines.length} vaccin(s)");
        });

        setState(() {
          _vaccinesByAge = grouped;
          _ageGroups = grouped.keys.toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = "Erreur lors du chargement du calendrier vaccinal";
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = "Erreur de connexion au serveur";
        _isLoading = false;
      });
    }
  }

  void _toggleVaccine(String ageGroup, String vaccineKey) {
    setState(() {
      if (_selectedByAge[ageGroup]!.contains(vaccineKey)) {
        _selectedByAge[ageGroup]!.remove(vaccineKey);
        _showCelebration = false;
      } else {
        _selectedByAge[ageGroup]!.add(vaccineKey);
        
        // Vérifier si tous les vaccins de cette période sont cochés
        final totalVaccines = _vaccinesByAge[ageGroup]!.length;
        final selectedCount = _selectedByAge[ageGroup]!.length;
        
        if (selectedCount == totalVaccines) {
          // Tous les vaccins de cette période sont cochés → Animation !
          _showCelebration = true;
          _celebrationController.forward(from: 0.0);
        }
      }
    });
  }

  bool _isAgeGroupComplete(String ageGroup) {
    final totalVaccines = _vaccinesByAge[ageGroup]!.length;
    final selectedCount = _selectedByAge[ageGroup]!.length;
    return selectedCount == totalVaccines;
  }

  double _getAgeGroupProgress(String ageGroup) {
    final totalVaccines = _vaccinesByAge[ageGroup]!.length;
    final selectedCount = _selectedByAge[ageGroup]!.length;
    return totalVaccines > 0 ? selectedCount / totalVaccines : 0;
  }

  int _getTotalSelectedVaccines() {
    int total = 0;
    for (var selected in _selectedByAge.values) {
      total += selected.length;
    }
    return total;
  }

  int _getTotalVaccines() {
    int total = 0;
    for (var vaccines in _vaccinesByAge.values) {
      total += vaccines.length;
    }
    return total;
  }

  double _getGlobalProgress() {
    final total = _getTotalVaccines();
    final selected = _getTotalSelectedVaccines();
    return total > 0 ? selected / total : 0;
  }

  Future<void> _saveAndContinue() async {
    // Récupérer tous les vaccins sélectionnés
    Set<String> allSelected = {};
    for (var selected in _selectedByAge.values) {
      allSelected.addAll(selected);
    }

    if (allSelected.isEmpty) {
      await _navigateToDashboard();
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      final url = Uri.parse(
          "http://localhost:5000/api/mobile/children/${widget.childId}/mark-vaccines-done");
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${widget.token}",
        },
        body: jsonEncode({
          "vaccines": allSelected.toList(),
        }),
      );

      if (response.statusCode == 200) {
        await _navigateToDashboard();
      } else {
        final data = jsonDecode(response.body);
        setState(() {
          _error = data["message"] ?? "Erreur lors de l'enregistrement";
          _isSaving = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = "Erreur de connexion au serveur";
        _isSaving = false;
      });
    }
  }

  Future<void> _navigateToDashboard() async {
    try {
      final url = Uri.parse("http://localhost:5000/api/mobile/children/${widget.childId}");
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer ${widget.token}",
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final childData = data["child"] ?? data;

        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (_) => ModernDashboardScreen(child: childData),
          ),
          (route) => false,
        );
      } else {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (_) => ModernDashboardScreen(
              child: {
                'id': widget.childId,
                '_id': widget.childId,
                'birthDate': widget.childBirthDate.toIso8601String(),
              },
            ),
          ),
          (route) => false,
        );
      }
    } catch (e) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => ModernDashboardScreen(
            child: {
              'id': widget.childId,
              '_id': widget.childId,
              'birthDate': widget.childBirthDate.toIso8601String(),
            },
          ),
        ),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(
                color: Color(0xFF3B760F),
              ),
              const SizedBox(height: 16),
              Text(
                "Chargement du calendrier vaccinal...",
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF0A1A33)),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red,
                ),
                const SizedBox(height: 16),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    color: Colors.red,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _loadVaccineCalendar,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B760F),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    "Réessayer",
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_ageGroups.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          title: Text(
            "Vaccins déjà effectués",
            style: GoogleFonts.poppins(
              color: const Color(0xFF0A1A33),
              fontWeight: FontWeight.w600,
            ),
          ),
          centerTitle: true,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.check_circle_outline,
                  size: 64,
                  color: Color(0xFF3B760F),
                ),
                const SizedBox(height: 16),
                Text(
                  "Aucun vaccin à sélectionner",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0A1A33),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Votre enfant est trop jeune ou aucun vaccin n'est disponible pour son âge.",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _navigateToDashboard,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B760F),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    "Continuer",
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final currentAgeGroup = _ageGroups[_currentAgeIndex];
    final currentVaccines = _vaccinesByAge[currentAgeGroup]!;
    final progress = _getAgeGroupProgress(currentAgeGroup);
    final isComplete = _isAgeGroupComplete(currentAgeGroup);
    final globalProgress = _getGlobalProgress();
    final isLastAge = _currentAgeIndex == _ageGroups.length - 1;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          "Vaccins déjà effectués",
          style: GoogleFonts.poppins(
            color: const Color(0xFF0A1A33),
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Progression globale
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      const Color(0xFF3B760F).withOpacity(0.1),
                      const Color(0xFF2E7D32).withOpacity(0.1),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF3B760F).withOpacity(0.3),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Progression globale",
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0A1A33),
                          ),
                        ),
                        Text(
                          "${(globalProgress * 100).toStringAsFixed(0)}%",
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF3B760F),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: globalProgress,
                        backgroundColor: Colors.grey[200],
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3B760F)),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "${_getTotalSelectedVaccines()} / ${_getTotalVaccines()} vaccins effectués",
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),

              // Indicateur de période d'âge
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0A1A33),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.vaccines,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currentAgeGroup,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Période ${_currentAgeIndex + 1} / ${_ageGroups.length}",
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isComplete)
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Progression de la période actuelle
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Vaccins de cette période",
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0A1A33),
                          ),
                        ),
                        Text(
                          "${_selectedByAge[currentAgeGroup]?.length ?? 0} / ${currentVaccines.length}",
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF3B760F),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isComplete ? Colors.green : const Color(0xFF3B760F),
                        ),
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Liste des vaccins de la période
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: currentVaccines.length,
                  itemBuilder: (context, index) {
                    final vaccine = currentVaccines[index];
                    final vaccineName = vaccine['vaccineName'] as String;
                    final vaccineKey = "${vaccine['id']}_$vaccineName";
                    final isSelected = _selectedByAge[currentAgeGroup]?.contains(vaccineKey) ?? false;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: isSelected 
                            ? const Color(0xFF3B760F).withOpacity(0.1)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected 
                              ? const Color(0xFF3B760F)
                              : Colors.grey[300]!,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: CheckboxListTile(
                        value: isSelected,
                        onChanged: (bool? value) {
                          _toggleVaccine(currentAgeGroup, vaccineKey);
                        },
                        activeColor: const Color(0xFF3B760F),
                        title: Text(
                          vaccineName,
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF0A1A33),
                          ),
                        ),
                        subtitle: vaccine['dose'] != null
                            ? Text(
                                vaccine['dose'],
                                style: GoogleFonts.poppins(
                                  fontSize: 13,
                                  color: Colors.grey[600],
                                ),
                              )
                            : null,
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? const Color(0xFF3B760F)
                                : Colors.grey[200],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.vaccines,
                            color: isSelected ? Colors.white : Colors.grey[600],
                            size: 24,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Boutons de navigation
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    if (_currentAgeIndex > 0)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _currentAgeIndex--;
                              _showCelebration = false;
                            });
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            side: const BorderSide(color: Color(0xFF3B760F)),
                          ),
                          child: Text(
                            "Précédent",
                            style: GoogleFonts.poppins(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF3B760F),
                            ),
                          ),
                        ),
                      ),
                    if (_currentAgeIndex > 0) const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: _isSaving
                            ? null
                            : () {
                                if (isLastAge) {
                                  _saveAndContinue();
                                } else {
                                  setState(() {
                                    _currentAgeIndex++;
                                    _showCelebration = false;
                                  });
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3B760F),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isSaving
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text(
                                isLastAge ? "Terminer" : "Suivant",
                                style: GoogleFonts.poppins(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          // Overlay de félicitations au centre de l'écran
          if (_showCelebration && isComplete)
            Positioned.fill(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _showCelebration = false;
                  });
                },
                child: Container(
                  color: Colors.black.withOpacity(0.7),
                  child: Center(
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: Container(
                      margin: const EdgeInsets.all(32),
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF4CAF50),
                            Color(0xFF2E7D32),
                            Color(0xFF1B5E20),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.green.withOpacity(0.5),
                            blurRadius: 20,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            "🎉",
                            style: TextStyle(fontSize: 80),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            "GÉNIAL !",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            "Tous les vaccins de cette période sont cochés !",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withOpacity(0.3),
                                width: 2,
                              ),
                            ),
                            child: Text(
                              "✓ Période complète",
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
