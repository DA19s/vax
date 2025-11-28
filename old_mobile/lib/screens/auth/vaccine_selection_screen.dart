import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../dashboard/modern_dashboard_screen.dart';

class VaccineSelectionScreen extends StatefulWidget {
  final String childId;
  final DateTime childBirthDate;
  final String token;

  const VaccineSelectionScreen({
    Key? key,
    required this.childId,
    required this.childBirthDate,
    required this.token,
  }) : super(key: key);

  @override
  State<VaccineSelectionScreen> createState() => _VaccineSelectionScreenState();
}

class _VaccineSelectionScreenState extends State<VaccineSelectionScreen> {
  final storage = const FlutterSecureStorage();
  List<Map<String, dynamic>> _availableVaccines = [];
  Set<String> _selectedVaccines = {};
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
    return (difference.inDays / 30).floor();
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

        // Filtrer les vaccins jusqu'à l'âge actuel de l'enfant
        final relevantVaccines = allCalendar.where((vaccine) {
          final ageUnit = vaccine['ageUnit'] as String;
          int vaccineAgeInMonths = 0;

          if (vaccine['specificAge'] != null) {
            final age = vaccine['specificAge'] as int;
            if (ageUnit == 'months') {
              vaccineAgeInMonths = age;
            } else if (ageUnit == 'weeks') {
              vaccineAgeInMonths = (age / 4).floor();
            } else if (ageUnit == 'years') {
              vaccineAgeInMonths = age * 12;
            }
          } else if (vaccine['minAge'] != null) {
            final age = vaccine['minAge'] as int;
            if (ageUnit == 'months') {
              vaccineAgeInMonths = age;
            } else if (ageUnit == 'weeks') {
              vaccineAgeInMonths = (age / 4).floor();
            } else if (ageUnit == 'years') {
              vaccineAgeInMonths = age * 12;
            }
          }

          return vaccineAgeInMonths <= ageInMonths;
        }).toList();

        setState(() {
          _availableVaccines = relevantVaccines.map((v) {
            final vaccines = (v['vaccine'] as List).cast<String>();
            return {
              'id': v['_id'],
              'vaccines': vaccines,
              'dose': v['dose'],
              'ageUnit': v['ageUnit'],
              'specificAge': v['specificAge'],
              'minAge': v['minAge'],
              'description': v['description'] ?? '',
            };
          }).toList();
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
    if (_selectedVaccines.isEmpty) {
      // Pas de vaccins sélectionnés, aller directement au dashboard
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
          "vaccines": _selectedVaccines.toList(),
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
      // Charger les données de l'enfant depuis l'API
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
        // En cas d'erreur, utiliser les données minimales disponibles
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
      // En cas d'erreur, utiliser les données minimales disponibles
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

  String _getAgeLabel(Map<String, dynamic> vaccine) {
    final ageUnit = vaccine['ageUnit'] as String;
    final specificAge = vaccine['specificAge'];
    final minAge = vaccine['minAge'];

    int age = specificAge ?? minAge ?? 0;
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
                              final vaccines =
                                  vaccine['vaccines'] as List<String>;
                              final vaccineKey =
                                  '${vaccine['id']}_${vaccines.join('_')}';
                              final isSelected =
                                  _selectedVaccines.contains(vaccineKey);

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
                                child: CheckboxListTile(
                                  value: isSelected,
                                  onChanged: (bool? value) {
                                    setState(() {
                                      if (value == true) {
                                        _selectedVaccines.add(vaccineKey);
                                      } else {
                                        _selectedVaccines.remove(vaccineKey);
                                      }
                                    });
                                  },
                                  activeColor: const Color(0xFF3B760F),
                                  title: Text(
                                    vaccines.join(', '),
                                    style: GoogleFonts.poppins(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF0A1A33),
                                    ),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 4),
                                      Text(
                                        vaccine['dose'],
                                        style: GoogleFonts.poppins(
                                          fontSize: 13,
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Recommandé à ${_getAgeLabel(vaccine)}',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          color: const Color(0xFF94A3B8),
                                        ),
                                      ),
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
                if (_selectedVaccines.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      "${_selectedVaccines.length} vaccin(s) sélectionné(s)",
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
                            _selectedVaccines.isEmpty
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
