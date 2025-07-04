<!DOCTYPE html>
<html lang="fr">
  <head>
    <base href="/techgeniushub-website/" />
    <meta charset="UTF-8" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TechGeniusHub - Accueil</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Open+Sans:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="assets/css/style.css" />
    <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js"></script>
  </head>
  <body>
    <header class="header">
      <div class="container">
        <a href="index.html" class="logo">
          <img src="assets/img/logo.png" alt="Logo TechGeniusHub" />
          TechGeniusHub
        </a>
        <nav class="main-nav">
          <button class="menu-toggle" aria-label="Toggle navigation">
            <i data-feather="menu"></i>
          </button>
          <ul class="nav-list">
            <li><a href="index.html" class="nav-link active">Accueil</a></li>
            <li><a href="about.html" class="nav-link">À Propos</a></li>
            <li><a href="team.html" class="nav-link">Équipe</a></li>
            <li><a href="courses.html" class="nav-link">Formations</a></li>
            <li><a href="contact.html" class="nav-link">Contact</a></li>

            <li id="navGuestLinks">
              <a href="login.html" class="nav-link btn btn-primary"
                >Connexion</a
              >
              <a href="register.html" class="nav-link btn btn-secondary"
                >Inscription</a
              >
            </li>

            <li id="navUserLinks" style="display: none">
              <a href="#" class="nav-link" id="profileLink"
                ><i data-feather="user"></i> Mon Compte</a
              >
              <a href="#" class="nav-link btn btn-secondary" id="userLogoutBtn"
                >Déconnexion</a
              >
            </li>

            <li id="navAdminLink" style="display: none">
              <a href="admin/dashboard.html" class="nav-link">Admin</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <section id="hero" class="hero-section">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              Découvrez votre Potentiel Tech avec TechGeniusHub
            </h1>
            <p class="hero-subtitle">
              Formations pratiques, accompagnement expert, et une communauté
              pour propulser votre carrière numérique.
            </p>
            <a href="courses.html" class="btn btn-primary btn-large"
              >Voir Nos Formations <i data-feather="arrow-right"></i
            ></a>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3>TechGeniusHub</h3>
            <p>Votre partenaire pour l'excellence numérique en RDC.</p>
            <div class="social-links">
              <a href="#"><i data-feather="twitter"></i></a>
              <a href="#"><i data-feather="linkedin"></i></a>
              <a href="#"><i data-feather="facebook"></i></a>
            </div>
          </div>
          <div class="footer-col">
            <h3>Liens Rapides</h3>
            <ul>
              <li><a href="index.html">Accueil</a></li>
              <li><a href="about.html">À Propos</a></li>
              <li><a href="team.html">Équipe</a></li>
              <li><a href="courses.html">Formations</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h3>Contact</h3>
            <p>Email: info@techgeniushub.com</p>
            <p>Téléphone: +243 xx xxx xxxx</p>
            <p>Adresse: Bukavu, RDC</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 TechGeniusHub. Tous droits réservés.</p>
        </div>
      </div>
    </footer>

    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

    <script src="assets/js/firebase-config.js"></script>
    <script src="assets/js/main.js"></script>
    <script>
      // Active Feather Icons après le chargement du DOM
      feather.replace();
    </script>
  </body>
</html>

