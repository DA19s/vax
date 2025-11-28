class Campaign {
  final String id;
  final String title;
  final String? description;
  final DateTime startDate;
  final DateTime endDate;
  final String? region;
  final String? targetVaccine;
  final String? targetAgeGroup;
  final int? targetPopulation;
  final int vaccinatedCount;
  final String status; // planned, ongoing, completed, cancelled
  final List<Media> medias;
  final DateTime createdAt;
  
  Campaign({
    required this.id,
    required this.title,
    this.description,
    required this.startDate,
    required this.endDate,
    this.region,
    this.targetVaccine,
    this.targetAgeGroup,
    this.targetPopulation,
    this.vaccinatedCount = 0,
    required this.status,
    this.medias = const [],
    required this.createdAt,
  });
  
  factory Campaign.fromJson(Map<String, dynamic> json) {
    return Campaign(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? 'Campagne',
      description: json['description'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      region: json['region'],
      targetVaccine: json['targetVaccine'],
      targetAgeGroup: json['targetAgeGroup'],
      targetPopulation: json['targetPopulation'],
      vaccinatedCount: json['vaccinatedCount'] ?? 0,
      status: json['status'] ?? 'planned',
      medias: (json['medias'] as List<dynamic>?)
          ?.map((m) => Media.fromJson(m))
          .toList() ?? [],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
  
  // Calculer le pourcentage de progression
  double get progress {
    if (targetPopulation == null || targetPopulation == 0) return 0;
    return (vaccinatedCount / targetPopulation!).clamp(0.0, 1.0);
  }
  
  // Vérifier si la campagne est en cours
  bool get isOngoing {
    final now = DateTime.now();
    return now.isAfter(startDate) && now.isBefore(endDate);
  }
  
  // Vérifier si la campagne est à venir
  bool get isUpcoming {
    return DateTime.now().isBefore(startDate);
  }
  
  // Vérifier si la campagne est terminée
  bool get isCompleted {
    return DateTime.now().isAfter(endDate) || status == 'completed';
  }
  
  // Nombre de jours restants
  int get daysRemaining {
    if (isCompleted) return 0;
    if (isUpcoming) return startDate.difference(DateTime.now()).inDays;
    return endDate.difference(DateTime.now()).inDays;
  }
}

class Media {
  final String url;
  final String type; // video, pdf
  
  Media({
    required this.url,
    required this.type,
  });
  
  factory Media.fromJson(Map<String, dynamic> json) {
    return Media(
      url: json['url'] ?? '',
      type: json['type'] ?? 'video',
    );
  }
}
