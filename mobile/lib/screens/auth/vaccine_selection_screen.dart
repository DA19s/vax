import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../child/child_dashboard_screen.dart';
import '../../core/config/api_config.dart';

class VaccineSelectionScreen extends StatefulWidget {
  final String childId;
  final DateTime childBirthDate;
  final String token;
  final Map<String, dynamic> userData;

  const VaccineSelectionScreen({
    super.key,
    required this.childId,
    required this.childBirthDate,
    required this.token,
    required this.userData,
  });

  @override
  State<VaccineSelectionScreen> createState() => _VaccineSelectionScreenState();
}

class _VaccineSelectionScreenState extends State<VaccineSelectionScreen> {
  final storage = const FlutterSecureStorage();
  List<Map<String, dynamic>> _availableVaccines = []; // Liste de vaccins individuels
  Map<String, int> _selectedVaccinesWithDoses = {}; // Format: "vaccineCalendarId_vaccineId" -> nombre de doses
  bool _isLoading = true;
  bool _isSaving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadVaccineCalendar();
  }

  int _getChildAgeInMonths() {
    final now = DateTime.now();
    final difference = now.difference(widget.childBirthDate);
    return (difference.inDays / 30.44).floor();
  }


  Future<void> _loadVaccineCalendar() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final ageInMonths = _getChildAgeInMonths();
      
      final url = Uri.parse("${ApiConfig.apiBaseUrl}/mobile/vaccine-calendar");
      final response = await http.get(
        url,
        headers: {
          "Authorization": "Bearer ${widget.token}",
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> allCalendar = jsonDecode(response.body);

        // Filtrer les vaccins qui sont pertinents pour l'enfant :
        // 1. Les vaccins dans la plage d'âge actuelle (minAge <= age <= maxAge)
        // 2. Les vaccins recommandés AVANT l'âge actuel (maxAge < age) pour savoir s'ils ont été faits
        final relevantVaccines = allCalendar.where((entry) {
          final ageUnit = entry['ageUnit'] as String;
          final minAge = entry['minAge'] as int?;
          final maxAge = entry['maxAge'] as int?;
          
          // Convertir l'âge de l'enfant dans l'unité du calendrier
          double childAgeInCalendarUnit = 0;
          if (ageUnit == 'MONTHS') {
            childAgeInCalendarUnit = ageInMonths.toDouble();
          } else if (ageUnit == 'WEEKS') {
            childAgeInCalendarUnit = (ageInMonths * 4.33);
          } else if (ageUnit == 'YEARS') {
            childAgeInCalendarUnit = (ageInMonths / 12.0);
          }
          
          // Inclure le vaccin si :
          // - L'enfant est dans la plage d'âge (minAge <= age <= maxAge), OU
          // - Le vaccin est recommandé avant l'âge actuel (maxAge < age) pour vérifier s'il a été fait
          final isInCurrentRange = (minAge == null || childAgeInCalendarUnit >= minAge) &&
                                    (maxAge == null || childAgeInCalendarUnit <= maxAge);
          
          final isPastRange = maxAge != null && childAgeInCalendarUnit > maxAge;
          
          return isInCurrentRange || isPastRange;
        }).toList();

        // Transformer en liste de vaccins individuels
        final List<Map<String, dynamic>> individualVaccines = [];
        
        for (final entry in relevantVaccines) {
          final vaccinesList = entry['vaccines'] as List;
          final vaccineCalendarId = entry['id'];
          final ageUnit = entry['ageUnit'] as String;
          final specificAge = entry['specificAge'];
          final minAge = entry['minAge'];
          final maxAge = entry['maxAge'];
          
          // Créer une entrée pour chaque vaccin dans ce calendrier
          for (final v in vaccinesList) {
            Map<String, dynamic> vaccine;
            if (v is Map) {
              vaccine = {
                'id': v['id'],
                'name': v['name'] as String,
                'dosesRequired': v['dosesRequired'] ?? '1',
              };
            } else {
              vaccine = {
                'id': null,
                'name': v.toString(),
                'dosesRequired': '1',
              };
            }
            
            individualVaccines.add({
              'vaccineId': vaccine['id'],
              'vaccineName': vaccine['name'],
              'dosesRequired': vaccine['dosesRequired'],
              'vaccineCalendarId': vaccineCalendarId,
              'ageUnit': ageUnit,
              'specificAge': specificAge,
              'minAge': minAge,
              'maxAge': maxAge,
            });
          }
        }
        
        setState(() {
          _availableVaccines = individualVaccines;
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

  Future<void> _saveSelectedVaccines() async {
    if (_selectedVaccinesWithDoses.isEmpty) {
      // Pas de vaccins sélectionnés, aller directement à l'interface enfant
      await _navigateToChildDashboard();
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      // Préparer les données pour l'API
      // Le format de key est: vaccineCalendarId_vaccineId
      final vaccinesToMark = <Map<String, dynamic>>[];
      
      for (final entry in _selectedVaccinesWithDoses.entries) {
        final key = entry.key;
        final dosesCount = entry.value;
        final parts = key.split('_');
        if (parts.length >= 2) {
          final vaccineCalendarId = parts[0];
          final vaccineId = parts[1];
          
          // Créer une entrée pour chaque dose administrée
          for (int dose = 1; dose <= dosesCount; dose++) {
            vaccinesToMark.add({
              'vaccineCalendarId': vaccineCalendarId,
              'vaccineId': vaccineId,
              'dose': dose,
            });
          }
        }
      }

      final url = Uri.parse(
          "${ApiConfig.apiBaseUrl}/mobile/children/${widget.childId}/mark-vaccines-done");
      final response = await http.post(
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${widget.token}",
        },
        body: jsonEncode({
          "vaccines": vaccinesToMark,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await _navigateToChildDashboard();
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

  Future<void> _navigateToChildDashboard() async {
    if (!mounted) return;
    
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ChildDashboardScreen(
          userData: widget.userData,
          childId: widget.childId,
        ),
      ),
    );
  }

  String _getAgeLabel(Map<String, dynamic> vaccine) {
    final ageUnit = vaccine['ageUnit'] as String;
    final specificAge = vaccine['specificAge'];
    final minAge = vaccine['minAge'];

    int age = specificAge ?? minAge ?? 0;
    String unit = '';

    switch (ageUnit) {
      case 'WEEKS':
        unit = age > 1 ? 'semaines' : 'semaine';
        break;
      case 'MONTHS':
        unit = 'mois';
        break;
      case 'YEARS':
        unit = age > 1 ? 'ans' : 'an';
        break;
    }

    if (age == 0 && ageUnit == 'WEEKS') {
      return 'À la naissance';
    }

    return '$age $unit';
  }

  @override
  Widget build(BuildContext context) {
    final childAge = _getChildAgeInMonths();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          "Vaccins déjà faits",
          style: GoogleFonts.poppins(
            color: const Color(0xFF0A1A33),
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // En-tête informatif
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF3B760F).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF3B760F).withOpacity(0.3),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.info_outline,
                      color: Color(0xFF3B760F),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        "Âge de l'enfant: ${childAge >= 12 ? '${(childAge / 12).floor()} an(s)' : '$childAge mois'}",
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF3B760F),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  "Sélectionnez les vaccins que votre enfant a déjà reçus. Ces informations nous aideront à suivre son calendrier vaccinal.",
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: const Color(0xFF64748B),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),

          // Liste des vaccins
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF3B760F),
                    ),
                  )
                : _error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.error_outline,
                                color: Colors.red,
                                size: 60,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _error!,
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  color: Colors.red,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _loadVaccineCalendar,
                                child: const Text("Réessayer"),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _availableVaccines.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(
                                    Icons.vaccines_outlined,
                                    color: Color(0xFF64748B),
                                    size: 60,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    "Aucun vaccin disponible pour cet âge",
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      color: const Color(0xFF64748B),
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _availableVaccines.length,
                            itemBuilder: (context, index) {
                              final vaccine = _availableVaccines[index];
                              final vaccineName = vaccine['vaccineName'] as String;
                              final vaccineId = vaccine['vaccineId'] as String?;
                              final vaccineCalendarId = vaccine['vaccineCalendarId'] as String;
                              final dosesRequiredStr = vaccine['dosesRequired'] as String? ?? '1';
                              final dosesRequired = int.tryParse(dosesRequiredStr) ?? 1;
                              
                              // Clé unique pour chaque vaccin: vaccineCalendarId_vaccineId
                              final vaccineKey = vaccineId != null 
                                  ? '${vaccineCalendarId}_$vaccineId'
                                  : '${vaccineCalendarId}_${vaccineName}';
                              
                              final selectedDoses = _selectedVaccinesWithDoses[vaccineKey] ?? 0;
                              final isSelected = selectedDoses > 0;

                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: BorderSide(
                                    color: isSelected
                                        ? const Color(0xFF3B760F)
                                        : const Color(0xFFE2E8F0),
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Checkbox(
                                            value: isSelected,
                                            onChanged: (bool? value) {
                                              setState(() {
                                                if (value == true) {
                                                  _selectedVaccinesWithDoses[vaccineKey] = 1;
                                                } else {
                                                  _selectedVaccinesWithDoses.remove(vaccineKey);
                                                }
                                              });
                                            },
                                            activeColor: const Color(0xFF3B760F),
                                          ),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  vaccineName,
                                                  style: GoogleFonts.poppins(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.w600,
                                                    color: const Color(0xFF0A1A33),
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  'Recommandé à ${_getAgeLabel(vaccine)} • $dosesRequired dose${dosesRequired > 1 ? 's' : ''} requise${dosesRequired > 1 ? 's' : ''}',
                                                  style: GoogleFonts.poppins(
                                                    fontSize: 12,
                                                    color: const Color(0xFF94A3B8),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (isSelected) ...[
                                        const SizedBox(height: 12),
                                        Text(
                                          'Combien de doses avez-vous déjà reçues ?',
                                          style: GoogleFonts.poppins(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w500,
                                            color: const Color(0xFF0A1A33),
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: List.generate(dosesRequired, (index) {
                                            final doseNumber = index + 1;
                                            final isDoseSelected = selectedDoses >= doseNumber;
                                            return Expanded(
                                              child: Padding(
                                                padding: EdgeInsets.only(
                                                  right: index < dosesRequired - 1 ? 8 : 0,
                                                ),
                                                child: GestureDetector(
                                                  onTap: () {
                                                    setState(() {
                                                      if (isDoseSelected && selectedDoses == doseNumber) {
                                                        // Désélectionner cette dose et toutes celles après
                                                        _selectedVaccinesWithDoses[vaccineKey] = doseNumber - 1;
                                                        if (doseNumber - 1 == 0) {
                                                          _selectedVaccinesWithDoses.remove(vaccineKey);
                                                        }
                                                      } else {
                                                        // Sélectionner jusqu'à cette dose
                                                        _selectedVaccinesWithDoses[vaccineKey] = doseNumber;
                                                      }
                                                    });
                                                  },
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                                    decoration: BoxDecoration(
                                                      color: isDoseSelected
                                                          ? const Color(0xFF3B760F).withOpacity(0.1)
                                                          : const Color(0xFFF8FAFC),
                                                      borderRadius: BorderRadius.circular(12),
                                                      border: Border.all(
                                                        color: isDoseSelected
                                                            ? const Color(0xFF3B760F)
                                                            : const Color(0xFFE2E8F0),
                                                        width: isDoseSelected ? 2 : 1,
                                                      ),
                                                    ),
                                                    child: Center(
                                                      child: Text(
                                                        'Dose $doseNumber',
                                                        style: GoogleFonts.poppins(
                                                          fontSize: 13,
                                                          fontWeight: isDoseSelected
                                                              ? FontWeight.w600
                                                              : FontWeight.w500,
                                                          color: isDoseSelected
                                                              ? const Color(0xFF3B760F)
                                                              : const Color(0xFF64748B),
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            );
                                          }),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),

          // Bouton de validation
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
            child: Column(
              children: [
                if (_selectedVaccinesWithDoses.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      "${_selectedVaccinesWithDoses.length} vaccin(s) sélectionné(s)",
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF3B760F),
                      ),
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _saveSelectedVaccines,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B760F),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : Text(
                            _selectedVaccinesWithDoses.isEmpty
                                ? "Continuer sans sélection"
                                : "Valider et continuer",
                            style: GoogleFonts.poppins(
                              fontSize: 16,
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
    );
  }
}

