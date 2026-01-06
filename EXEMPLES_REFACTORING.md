# Exemples de Refactoring

Ce document contient des exemples concrets de refactoring pour améliorer la qualité du code.

---

## 🔴 BACKEND

### 1. Extraction de la logique d'extraction de token

**Avant** (`src/middleware/auth.js`) :
```javascript
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const tokenMatch = authHeader.match(/^bearer\s+(.+)$/i);
  const token = tokenMatch ? tokenMatch[1].trim() : "";

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  // ...
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const tokenMatch = authHeader.match(/^bearer\s+(.+)$/i);
  let token = tokenMatch ? tokenMatch[1].trim() : "";
  
  if (!token && req.query.token) {
    token = req.query.token;
  }
  // ...
};
```

**Après** :
```javascript
// src/utils/tokenExtractor.js
const extractToken = (req, options = {}) => {
  const { allowQuery = false } = options;
  
  // Essayer d'abord le header Authorization
  const authHeader = req.headers.authorization || "";
  const tokenMatch = authHeader.match(/^bearer\s+(.+)$/i);
  let token = tokenMatch ? tokenMatch[1].trim() : "";
  
  // Si pas de token dans le header et que query est autorisé
  if (!token && allowQuery && req.query.token) {
    token = req.query.token;
  }
  
  return token;
};

// src/middleware/auth.js
const { extractToken } = require("../utils/tokenExtractor");

const requireAuth = async (req, res, next) => {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  // ...
};

const optionalAuth = async (req, res, next) => {
  const token = extractToken(req, { allowQuery: true });
  
  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }
  // ...
};
```

---

### 2. Gestion centralisée des erreurs Prisma

**Avant** (répété dans chaque contrôleur) :
```javascript
try {
  // ... code ...
} catch (error) {
  if (error.code === "P2002") {
    return res.status(409).json({ message: "Contrainte unique violée" });
  }
  if (error.code === "P2025") {
    return res.status(404).json({ message: "Ressource non trouvée" });
  }
  if (error.code === "P2003") {
    return res.status(400).json({ message: "Contrainte de clé étrangère" });
  }
  next(error);
}
```

**Après** :
```javascript
// src/utils/prismaErrorHandler.js
const PRISMA_ERROR_CODES = {
  UNIQUE_CONSTRAINT: "P2002",
  RECORD_NOT_FOUND: "P2025",
  FOREIGN_KEY_CONSTRAINT: "P2003",
  REQUIRED_FIELD_MISSING: "P2011",
};

const PRISMA_ERROR_MESSAGES = {
  [PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT]: "Cette ressource existe déjà",
  [PRISMA_ERROR_CODES.RECORD_NOT_FOUND]: "Ressource non trouvée",
  [PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT]: "Impossible de supprimer cette ressource car elle est encore utilisée",
  [PRISMA_ERROR_CODES.REQUIRED_FIELD_MISSING]: "Champ requis manquant",
};

const handlePrismaError = (error, res, customMessages = {}) => {
  const errorCode = error.code;
  const messages = { ...PRISMA_ERROR_MESSAGES, ...customMessages };
  
  if (errorCode === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT) {
    return res.status(409).json({ 
      message: messages[errorCode],
      field: error.meta?.target?.[0] || "unknown"
    });
  }
  
  if (errorCode === PRISMA_ERROR_CODES.RECORD_NOT_FOUND) {
    return res.status(404).json({ message: messages[errorCode] });
  }
  
  if (errorCode === PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT) {
    return res.status(400).json({ 
      message: messages[errorCode],
      details: error.meta?.field_name || "Relation inconnue"
    });
  }
  
  return null; // Erreur non gérée, passer au handler suivant
};

module.exports = { handlePrismaError, PRISMA_ERROR_CODES };

// Utilisation dans un contrôleur
const { handlePrismaError } = require("../utils/prismaErrorHandler");

try {
  // ... code ...
} catch (error) {
  const handled = handlePrismaError(error, res, {
    P2002: "Ce vaccin existe déjà dans le système"
  });
  if (handled) return;
  next(error);
}
```

---

### 3. Système de logging structuré

**Avant** :
```javascript
console.log("✅ Client Twilio WhatsApp initialisé");
console.error("Error deleting vaccine:", error);
console.warn("⚠️ Twilio credentials manquants");
```

**Après** :
```javascript
// src/utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "vaxcare-api" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;

// Utilisation
const logger = require("../utils/logger");

logger.info("Client Twilio WhatsApp initialisé", { service: "whatsapp" });
logger.error("Error deleting vaccine", { 
  error: error.message,
  stack: error.stack,
  vaccineId: req.params.id,
  userId: req.user.id
});
logger.warn("Twilio credentials manquants", { service: "whatsapp" });
```

---

### 4. Validation des données avec Joi

**Avant** :
```javascript
const createVaccine = async (req, res, next) => {
  const { name, description, dosesRequired } = req.body;
  
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Le nom est requis" });
  }
  
  if (dosesRequired && !["1", "2", "3"].includes(dosesRequired)) {
    return res.status(400).json({ message: "Nombre de doses invalide" });
  }
  // ...
};
```

**Après** :
```javascript
// src/validators/vaccineValidator.js
const Joi = require("joi");

const createVaccineSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().allow("").max(1000),
  dosesRequired: Joi.string().valid("1", "2", "3").required(),
});

const updateVaccineSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().allow("").max(1000),
  dosesRequired: Joi.string().valid("1", "2", "3"),
}).min(1); // Au moins un champ requis

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return res.status(400).json({ 
        message: "Erreurs de validation",
        errors 
      });
    }
    
    req.body = value; // Utiliser les valeurs validées et nettoyées
    next();
  };
};

module.exports = {
  validateCreateVaccine: validate(createVaccineSchema),
  validateUpdateVaccine: validate(updateVaccineSchema),
};

// Utilisation dans les routes
const { validateCreateVaccine } = require("../validators/vaccineValidator");

router.post("/", validateCreateVaccine, vaccineController.createVaccine);
```

---

## 🟡 FRONTEND

### 1. Refactoring d'un gros composant

**Avant** (`stocks/page.tsx` - 10091 lignes) :
```typescript
// Tout dans un seul fichier
export default function StocksPage() {
  // 10000+ lignes de code...
}
```

**Après** :
```typescript
// app/dashboard/stocks/page.tsx
import { StocksPageContainer } from "./components/StocksPageContainer";

export default function StocksPage() {
  return <StocksPageContainer />;
}

// app/dashboard/stocks/components/StocksPageContainer.tsx
import { useStocks } from "../hooks/useStocks";
import { StocksHeader } from "./StocksHeader";
import { StocksFilters } from "./StocksFilters";
import { StocksTable } from "./StocksTable";
import { StockModals } from "./StockModals";

export function StocksPageContainer() {
  const stocksData = useStocks();
  
  return (
    <DashboardShell>
      <StocksHeader stats={stocksData.stats} />
      <StocksFilters 
        filters={stocksData.filters}
        onFilterChange={stocksData.setFilters}
      />
      <StocksTable 
        stocks={stocksData.stocks}
        onAction={stocksData.handleAction}
      />
      <StockModals 
        modals={stocksData.modals}
        onClose={stocksData.closeModal}
      />
    </DashboardShell>
  );
}

// app/dashboard/stocks/hooks/useStocks.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useStocks() {
  const { data: stocks, isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => apiClient.getStocks(),
  });
  
  const createLotMutation = useMutation({
    mutationFn: apiClient.createLot,
    onSuccess: () => {
      // Invalidate queries
    },
  });
  
  // ... autres hooks
  
  return {
    stocks,
    isLoading,
    createLot: createLotMutation.mutate,
    // ...
  };
}
```

---

### 2. Client API centralisé

**Avant** (répété partout) :
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";

const response = await fetch(`${API_URL}/api/stocks`, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
const data = await response.json();
```

**Après** :
```typescript
// lib/apiClient.ts
import { useAuth } from "@/context/AuthContext";

class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: "Erreur inconnue" 
      }));
      throw new ApiError(error.message, response.status);
    }
    
    return response.json();
  }
  
  private getToken(): string | null {
    // Récupérer depuis les cookies ou le contexte
    if (typeof window !== "undefined") {
      return Cookies.get("vax_access_token") || null;
    }
    return null;
  }
  
  // Méthodes spécifiques
  async getStocks() {
    return this.request<StockResponse>("/api/stock");
  }
  
  async createLot(data: CreateLotRequest) {
    return this.request<LotResponse>("/api/stock/lots", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  
  // ... autres méthodes
}

export const apiClient = new ApiClient();

// Utilisation avec React Query
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

function StocksTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => apiClient.getStocks(),
  });
  
  // ...
}
```

---

### 3. Refactoring AuthContext

**Avant** (436 lignes dans un seul fichier) :
```typescript
export function AuthProvider({ children }) {
  // Toute la logique ici...
}
```

**Après** :
```typescript
// context/auth/AuthProvider.tsx
import { AuthStateProvider } from "./AuthStateProvider";
import { AuthActionsProvider } from "./AuthActionsProvider";

export function AuthProvider({ children }) {
  return (
    <AuthStateProvider>
      <AuthActionsProvider>
        {children}
      </AuthActionsProvider>
    </AuthStateProvider>
  );
}

// context/auth/hooks/useAuthState.ts
export function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  
  // Logique de state seulement
  return { user, tokens, setUser, setTokens };
}

// context/auth/hooks/useAuthActions.ts
export function useAuthActions() {
  const { setUser, setTokens } = useAuthState();
  const router = useRouter();
  
  const login = useCallback(async (credentials) => {
    // Logique de login
  }, []);
  
  const logout = useCallback(async () => {
    // Logique de logout
  }, []);
  
  return { login, logout };
}

// context/auth/AuthContext.tsx
export function useAuth() {
  const state = useAuthState();
  const actions = useAuthActions();
  return { ...state, ...actions };
}
```

---

## 🟢 MOBILE

### 1. Séparation des services API

**Avant** (`api_service.dart` - 238 lignes) :
```dart
class ApiService {
  static Future<List<Map<String, dynamic>>> getAppointments(String childId) async {
    // ...
  }
  
  static Future<List<Map<String, dynamic>>> getNotifications(String childId) async {
    // ...
  }
  
  // ... 20+ autres méthodes
}
```

**Après** :
```dart
// services/http/http_client.dart
class HttpClient {
  final String baseUrl;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  HttpClient({required this.baseUrl});
  
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
  
  Future<http.Response> get(String endpoint) async {
    final headers = await _getHeaders();
    return http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
    );
  }
  
  Future<http.Response> post(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    return http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }
  
  // ... autres méthodes HTTP
}

// services/api/appointment_service.dart
class AppointmentService {
  final HttpClient _http;
  
  AppointmentService(this._http);
  
  Future<List<Appointment>> getAppointments(String childId) async {
    final response = await _http.get('/mobile/children/$childId/appointments');
    _handleError(response);
    final data = jsonDecode(response.body);
    return (data['appointments'] as List)
        .map((json) => Appointment.fromJson(json))
        .toList();
  }
}

// services/api/notification_service.dart
class NotificationService {
  final HttpClient _http;
  
  NotificationService(this._http);
  
  Future<List<Notification>> getNotifications(String childId) async {
    final response = await _http.get('/mobile/children/$childId/notifications');
    _handleError(response);
    final data = jsonDecode(response.body);
    return (data['notifications'] as List)
        .map((json) => Notification.fromJson(json))
        .toList();
  }
}

// services/api/api_service_factory.dart
class ApiServiceFactory {
  static final HttpClient _http = HttpClient(
    baseUrl: ApiConfig.apiBaseUrl,
  );
  
  static final AppointmentService appointments = AppointmentService(_http);
  static final NotificationService notifications = NotificationService(_http);
  // ... autres services
}
```

---

### 2. Gestion d'erreurs améliorée

**Avant** :
```dart
try {
  final response = await http.get(/* ... */);
  if (response.statusCode >= 400) {
    throw Exception('Erreur API: ${response.statusCode}');
  }
} catch (e) {
  print('❌ Erreur: $e');
  return [];
}
```

**Après** :
```dart
// exceptions/api_exceptions.dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  
  ApiException(this.message, [this.statusCode]);
}

class UnauthorizedException extends ApiException {
  UnauthorizedException([String? message]) 
    : super(message ?? 'Non autorisé', 401);
}

class NotFoundException extends ApiException {
  NotFoundException([String? message]) 
    : super(message ?? 'Ressource non trouvée', 404);
}

// utils/error_handler.dart
class ErrorHandler {
  static void handleHttpError(http.Response response) {
    switch (response.statusCode) {
      case 401:
        throw UnauthorizedException();
      case 404:
        throw NotFoundException();
      case 500:
        throw ApiException('Erreur serveur', 500);
      default:
        throw ApiException('Erreur API: ${response.statusCode}', response.statusCode);
    }
  }
  
  static String getErrorMessage(dynamic error) {
    if (error is ApiException) {
      return error.message;
    }
    return 'Une erreur inattendue s\'est produite';
  }
}

// Utilisation
try {
  final response = await _http.get('/endpoint');
  ErrorHandler.handleHttpError(response);
  // ...
} on UnauthorizedException {
  // Gérer la déconnexion
} on NotFoundException {
  // Gérer la ressource non trouvée
} on ApiException catch (e) {
  // Afficher le message d'erreur
  showError(ErrorHandler.getErrorMessage(e));
}
```

---

Ces exemples montrent comment améliorer progressivement la qualité du code en suivant les principes SOLID et les bonnes pratiques de chaque framework.
