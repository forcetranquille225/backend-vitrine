# 📬 Système de Newsletter - Documentation

## 🚀 Mise en Place

### 1. **Configuration Préalable**

Assurez-vous d'avoir les variables d'environnement configurées dans `.env` :

```env
BREVO_API_KEY=your_brevo_api_key
PERSONAL_EMAIL=your-email@example.com
```

- **BREVO_API_KEY** : Votre clé API Brevo (obtenue sur https://app.brevo.com)
- **PERSONAL_EMAIL** : Votre email personnel qui sera utilisé comme expéditeur

### 2. **Installation des Dépendances**

```bash
npm install
```

### 3. **Migration de la Base de Données**

```bash
npx prisma migrate dev
```

Cela va créer les tables `NewsletterSubscriber` et `Newsletter`.

### 4. **Démarrer le Serveur**

```bash
npm run start:dev
```

---

## 📋 API Endpoints

### **Endpoints Publics** (Pour vos visiteurs)

#### 1. **S'inscrire à la Newsletter**
```
POST /newsletter/subscribe
```

**Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe"  // optionnel
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Subscription successful",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "SUBSCRIBED",
    "createdAt": "2026-04-23T10:00:00.000Z"
  }
}
```

---

#### 2. **Se désinscrire de la Newsletter**
```
POST /newsletter/unsubscribe
```

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Unsubscription successful"
}
```

---

### **Endpoints Protégés** (Pour l'admin - Authentification JWT requise)

Ajouter le header:
```
Authorization: Bearer <your_jwt_token>
```

---

#### 3. **Envoyer une Newsletter**
```
POST /newsletter/send
```

**Body:**
```json
{
  "subject": "Bienvenue dans notre Newsletter!",
  "htmlContent": "<h1>Bienvenue!</h1><p>Voici le contenu de votre newsletter...</p>",
  "sendImmediately": true
}
```

- Si `sendImmediately: true` → La newsletter est envoyée immédiatement à tous les abonnés
- Si `sendImmediately: false` → La newsletter est sauvegardée en tant que brouillon

**Réponse:**
```json
{
  "success": true,
  "message": "Newsletter sent successfully",
  "data": {
    "id": "uuid",
    "subject": "Bienvenue dans notre Newsletter!",
    "content": "...",
    "status": "SENT",
    "sentAt": "2026-04-23T10:05:00.000Z",
    "createdAt": "2026-04-23T10:05:00.000Z"
  }
}
```

---

#### 4. **Obtenir Tous les Abonnés**
```
GET /newsletter/subscribers
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user1@example.com",
      "name": "John",
      "status": "SUBSCRIBED",
      "createdAt": "2026-04-23T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### 5. **Obtenir les Statistiques des Abonnés**
```
GET /newsletter/subscribers/stats
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "subscribed": 150,
    "unsubscribed": 10,
    "bounced": 5,
    "total": 165
  }
}
```

---

#### 6. **Supprimer un Abonné**
```
DELETE /newsletter/subscribers/:email
```

**Réponse:**
```json
{
  "success": true,
  "message": "Subscriber deleted"
}
```

---

#### 7. **Obtenir Toutes les Newsletters**
```
GET /newsletter
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "subject": "Newsletter #1",
      "content": "...",
      "status": "SENT",
      "sentAt": "2026-04-23T10:05:00.000Z",
      "createdAt": "2026-04-23T10:05:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### 8. **Obtenir une Newsletter par ID**
```
GET /newsletter/:id
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "Newsletter #1",
    "content": "...",
    "status": "DRAFT",
    "sentAt": null,
    "createdAt": "2026-04-23T10:05:00.000Z"
  }
}
```

---

#### 9. **Envoyer une Newsletter en Brouillon**
```
POST /newsletter/:id/send
```

Envoie une newsletter qui était précédemment enregistrée en tant que brouillon.

**Réponse:**
```json
{
  "success": true,
  "message": "Newsletter sent successfully",
  "data": {
    "id": "uuid",
    "status": "SENT",
    "sentAt": "2026-04-23T10:10:00.000Z"
  }
}
```

---

## 🗂️ Structure des Modèles de Données

### **NewsletterSubscriber**
```prisma
model NewsletterSubscriber {
  id        String
  email     String (unique)
  name      String?
  status    SubscriptionStatus (SUBSCRIBED, UNSUBSCRIBED, BOUNCED)
  createdAt DateTime
  updatedAt DateTime
}
```

### **Newsletter**
```prisma
model Newsletter {
  id        String
  subject   String
  content   String (HTML)
  status    NewsletterStatus (DRAFT, SCHEDULED, SENT, FAILED)
  sentAt    DateTime?
  createdAt DateTime
  updatedAt DateTime
}
```

---

## 🔒 Sécurité

✅ **Points de sécurité implémentés:**

1. **Validation d'Email** - Vérification du format email avec Brevo
2. **Protection JWT** - Les endpoints sensibles sont protégés par authentification JWT
3. **Gestion d'Erreurs** - Gestion robuste des erreurs de l'API Brevo
4. **Validation des Données** - Utilisation de `class-validator` pour la validation
5. **Email Personnel** - Les emails sont toujours envoyés via votre adresse personnelle

---

## 📧 Utilisation avec Brevo

### Points Clés:

- **Validation d'email** : Avant chaque inscription, l'email est validé via l'API Brevo
- **Envoi en masse** : Les newsletters sont envoyées via l'API SMTP de Brevo
- **Email personnalisé** : Tous les emails utilisent l'adresse configurée dans `PERSONAL_EMAIL`
- **Gestion des bounce** : Les emails invalides peuvent être marqués comme `BOUNCED`

---

## 🚦 Workflow Recommandé

1. **S'inscrire** : Visiteur remplit le formulaire d'inscription
2. **Créer une Newsletter** : Admin crée une newsletter (brouillon ou envoyée immédiatement)
3. **Envoyer** : La newsletter est envoyée à tous les abonnés via Brevo
4. **Gérer** : Admin peut consulter les statistiques et gérer les abonnés

---

## 🎯 Exemple d'Utilisation Complète

### Client Frontend (Inscription)

```javascript
// S'inscrire à la newsletter
const response = await fetch('/newsletter/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'Jean Dupont'
  })
});

const result = await response.json();
console.log(result.message); // "Subscription successful"
```

### Admin (Créer et Envoyer)

```javascript
// Créer et envoyer une newsletter
const response = await fetch('/newsletter/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    subject: 'Nouvelle Newsletter - Avril 2026',
    htmlContent: `
      <h1>Bonjour!</h1>
      <p>Voici notre newsletter du mois...</p>
      <p>À bientôt!</p>
    `,
    sendImmediately: true
  })
});

const result = await response.json();
console.log(result.message); // "Newsletter sent successfully"
```

---

## 🐛 Dépannage

### Erreur: "Invalid API Key"
→ Vérifiez que `BREVO_API_KEY` est correctement configurée dans `.env`

### Erreur: "Invalid email format"
→ Assurez-vous que l'email fourni est au bon format

### Erreur: "No active subscribers found"
→ Aucun abonné avec le statut `SUBSCRIBED` n'existe

### Erreur: "Email already subscribed"
→ Cet email est déjà inscrit. Utilisez l'endpoint unsubscribe puis subscribe pour réinscrire

---

## 📈 Prochaines Améliorations Possibles

- [ ] Templates de newsletter pré-configurés
- [ ] Planification d'envoi (cron jobs)
- [ ] Suivi des taux d'ouverture et de clics
- [ ] Segmentation des abonnés
- [ ] Export des abonnés (CSV)
- [ ] Gestion des bounces automatiques
- [ ] Webhooks Brevo intégrés

---

**État du système : ✅ Production Ready**

Bon mailing! 📬✨
