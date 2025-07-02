// assets/js/main.js

// Vérifie si Firebase est bien initialisé (devrait l'être via firebase-config.js)
if (typeof firebase === "undefined") {
  console.error(
    "Firebase SDK n'est pas chargé ou initialisé. Vérifiez vos balises script."
  );
} else {
  // Les variables 'auth' et 'db' sont définies dans firebase-config.js et sont globales
  console.log("Firebase est chargé et initialisé.");
  if (typeof auth === "undefined" || typeof db === "undefined") {
    console.error(
      "Les variables 'auth' et 'db' ne sont pas définies globalement. Vérifiez firebase-config.js."
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Gestion du menu mobile ---
  const menuToggle = document.querySelector(".menu-toggle");
  const navList = document.querySelector(".nav-list");

  if (menuToggle && navList) {
    menuToggle.addEventListener("click", () => {
      navList.classList.toggle("active");
      const icon = menuToggle.querySelector("i");
      if (navList.classList.contains("active")) {
        icon.setAttribute("data-feather", "x"); // Change icon to 'x'
      } else {
        icon.setAttribute("data-feather", "menu"); // Change back to 'menu'
      }
      feather.replace(); // Re-render feather icons
    });
  }

  // --- 2. Fonction utilitaire pour afficher les messages ---
  function displayMessage(elementId, message, isError = false) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.display = "block"; // Assurez-vous que l'élément est visible
      if (isError) {
        messageElement.classList.add("error");
        messageElement.classList.remove("success");
      } else {
        messageElement.classList.add("success");
        messageElement.classList.remove("error");
      }
      // Cache le message après 5 secondes
      setTimeout(() => {
        messageElement.style.display = "none";
        messageElement.textContent = "";
        messageElement.classList.remove("error", "success"); // Nettoyer les classes
      }, 5000);
    }
  }

  // --- 3. Gestion de la déconnexion (pour les utilisateurs et les admins) ---
  const logoutBtn = document.getElementById("adminLogoutBtn"); // Bouton dans le dashboard admin
  // Assurez-vous d'avoir un ID 'userLogoutBtn' sur le bouton de déconnexion pour les utilisateurs réguliers (ex: dans index.html ou un futur dashboard utilisateur)
  const userLogoutBtn = document.getElementById("userLogoutBtn");

  const handleLogout = async (event) => {
    event.preventDefault();
    try {
      await auth.signOut();
      // Redirection après déconnexion
      if (window.location.pathname.includes("/admin/")) {
        window.location.href = "../admin/login.html"; // Redirige les admins vers leur page de connexion
      } else {
        window.location.href = "index.html"; // Redirige les utilisateurs vers la page d'accueil
      }
    } catch (error) {
      console.error("Erreur de déconnexion:", error.message);
      // Pour l'utilisateur, on peut afficher un message. Pour l'admin, c'est moins critique après une tentative de déconnexion.
      if (!window.location.pathname.includes("/admin/")) {
        displayMessage(
          "loginMessage",
          "Erreur de déconnexion. Veuillez réessayer.",
          true
        );
      }
    }
  };

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  if (userLogoutBtn) {
    userLogoutBtn.addEventListener("click", handleLogout);
  }

  // --- 4. Protection des routes d'administration ---
  function protectAdminRoute() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Utilisateur connecté, vérifions si c'est un admin
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === "admin") {
          console.log("Admin connecté et autorisé.");
          // Aucune redirection, l'admin peut rester sur la page
        } else {
          // Non admin ou rôle non défini, rediriger
          alert(
            "Accès non autorisé. Vous devez être un administrateur pour accéder à cette page."
          );
          window.location.href = "../login.html"; // Redirige vers la connexion publique
        }
      } else {
        // Pas d'utilisateur connecté, rediriger vers la page de connexion admin
        alert("Veuillez vous connecter pour accéder à cette page.");
        window.location.href = "login.html"; // Redirige vers la page de connexion admin
      }
    });
  }

  // Appeler la fonction de protection si nous sommes sur une page d'administration
  // sauf sur la page de connexion admin elle-même
  if (
    window.location.pathname.includes("/admin/") &&
    !window.location.pathname.includes("/admin/login.html")
  ) {
    protectAdminRoute();
  }

  // --- 5. Logique d'Inscription (Page register.html) ---
  const registrationForm = document.getElementById("registrationForm");
  if (registrationForm) {
    registrationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = registrationForm["fullName"].value;
      const email = registrationForm["emailRegister"].value;
      const password = registrationForm["passwordRegister"].value;
      const confirmPassword = registrationForm["confirmPassword"].value;
      // Le champ courseToEnroll est un champ caché, il n'est pas toujours présent
      const courseToEnroll = registrationForm["courseToEnroll"]
        ? registrationForm["courseToEnroll"].value
        : "";

      if (password !== confirmPassword) {
        displayMessage(
          "registrationMessage",
          "Les mots de passe ne correspondent pas.",
          true
        );
        return;
      }

      if (password.length < 6) {
        displayMessage(
          "registrationMessage",
          "Le mot de passe doit contenir au moins 6 caractères.",
          true
        );
        return;
      }

      try {
        // Crée un nouvel utilisateur avec email et mot de passe dans Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(
          email,
          password
        );
        const user = userCredential.user;

        // Enregistre les informations supplémentaires de l'utilisateur dans Firestore
        await db.collection("users").doc(user.uid).set({
          fullName: fullName,
          email: email,
          role: "user", // Rôle par défaut pour les nouvelles inscriptions
          status: "active", // 'active' ou 'pending' si vous voulez une validation manuelle par l'admin
          createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Horodatage du serveur
        });

        displayMessage(
          "registrationMessage",
          "Inscription réussie ! Vous pouvez maintenant vous connecter.",
          false
        );
        registrationForm.reset(); // Réinitialise le formulaire

        // Rediriger après un court délai
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } catch (error) {
        console.error("Erreur d'inscription:", error.code, error.message);
        let errorMessage = "Une erreur est survenue lors de l'inscription.";
        if (error.code === "auth/email-already-in-use") {
          errorMessage =
            "Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "Le mot de passe est trop faible.";
        }
        displayMessage("registrationMessage", errorMessage, true);
      }
    });
  }

  // --- 6. Logique de Connexion Utilisateur (Page login.html) ---
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = loginForm["emailLogin"].value;
      const password = loginForm["passwordLogin"].value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(
          email,
          password
        );
        const user = userCredential.user;

        // Vérifier le statut de l'utilisateur dans Firestore (si vous utilisez 'pending')
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists && userDoc.data().status === "pending") {
          await auth.signOut(); // Déconnecte l'utilisateur en attente
          displayMessage(
            "loginMessage",
            "Votre compte est en attente d'approbation. Veuillez contacter l'administration.",
            true
          );
          return;
        } else if (userDoc.exists && userDoc.data().status === "suspended") {
          await auth.signOut(); // Déconnecte l'utilisateur suspendu
          displayMessage(
            "loginMessage",
            "Votre compte a été suspendu. Veuillez contacter l'administration.",
            true
          );
          return;
        }

        // Si tout est bon (non 'pending' et non 'suspended'), rediriger
        displayMessage(
          "loginMessage",
          "Connexion réussie ! Redirection...",
          false
        );
        loginForm.reset();
        setTimeout(() => {
          window.location.href = "index.html"; // Redirige l'utilisateur vers la page d'accueil ou son dashboard
        }, 1500);
      } catch (error) {
        console.error("Erreur de connexion:", error.code, error.message);
        let errorMessage =
          "Email ou mot de passe incorrect. Veuillez réessayer.";
        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          errorMessage = "Email ou mot de passe invalide.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Format d'email invalide.";
        }
        displayMessage("loginMessage", errorMessage, true);
      }
    });
  }

  // --- 7. Logique de Connexion Administrateur (Page admin/login.html) ---
  const adminLoginForm = document.getElementById("adminLoginForm");
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = adminLoginForm["adminEmail"].value;
      const password = adminLoginForm["adminPassword"].value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(
          email,
          password
        );
        const user = userCredential.user;

        // Vérifier le rôle de l'utilisateur dans Firestore
        const userDoc = await db.collection("users").doc(user.uid).get();

        if (userDoc.exists && userDoc.data().role === "admin") {
          displayMessage(
            "adminLoginMessage",
            "Connexion administrateur réussie ! Redirection...",
            false
          );
          adminLoginForm.reset();
          setTimeout(() => {
            window.location.href = "dashboard.html"; // Redirige vers le tableau de bord admin
          }, 1500);
        } else {
          // Si l'utilisateur n'est pas un admin, déconnectez-le et affichez une erreur
          await auth.signOut();
          displayMessage(
            "adminLoginMessage",
            "Accès refusé. Vous n'êtes pas un administrateur.",
            true
          );
        }
      } catch (error) {
        console.error("Erreur de connexion admin:", error.code, error.message);
        let errorMessage =
          "Email ou mot de passe administrateur incorrect. Veuillez réessayer.";
        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          errorMessage = "Email ou mot de passe invalide.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Format d'email invalide.";
        }
        displayMessage("adminLoginMessage", errorMessage, true);
      }
    });
  }

  // --- 8. Gestion du formulaire de contact (Page contact.html) ---
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = contactForm["name"].value;
      const email = contactForm["email"].value;
      const subject = contactForm["subject"].value;
      const message = contactForm["message"].value;

      try {
        await db.collection("messages").add({
          name: name,
          email: email,
          subject: subject,
          message: message,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Horodatage du serveur
        });

        displayMessage(
          "contactMessage",
          "Votre message a été envoyé avec succès !",
          false
        );
        contactForm.reset(); // Réinitialise le formulaire après envoi
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        displayMessage(
          "contactMessage",
          "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer.",
          true
        );
      }
    });
  }

  // --- 9. Récupération des données du dashboard admin (Page admin/dashboard.html) ---
  // Cette section ne s'exécute que si nous sommes sur la page dashboard.html
  if (window.location.pathname.includes("/admin/dashboard.html")) {
    const totalUsersCount = document.getElementById("totalUsersCount");
    const pendingUsersCount = document.getElementById("pendingUsersCount");
    const totalCoursesCount = document.getElementById("totalCoursesCount"); // Assurez-vous que cet ID existe dans votre HTML
    const totalMessagesCount = document.getElementById("totalMessagesCount"); // Assurez-vous que cet ID existe dans votre HTML

    async function updateDashboardMetrics() {
      try {
        // Compter les utilisateurs
        const usersSnapshot = await db.collection("users").get();
        totalUsersCount.textContent = usersSnapshot.size;

        const pendingUsersSnapshot = await db
          .collection("users")
          .where("status", "==", "pending")
          .get();
        pendingUsersCount.textContent = pendingUsersSnapshot.size;

        // Compter les messages
        const messagesSnapshot = await db.collection("messages").get();
        totalMessagesCount.textContent = messagesSnapshot.size;

        // Compter les formations (pour l'instant, c'est statique, à adapter si vous les gérez dynamiquement)
        // Par exemple, si vous avez une collection 'courses' dans Firestore:
        // const coursesSnapshot = await db.collection('courses').get();
        // totalCoursesCount.textContent = coursesSnapshot.size;
        totalCoursesCount.textContent = 4; // Mise à jour statique basée sur courses.html
      } catch (error) {
        console.error(
          "Erreur lors du chargement des métriques du dashboard:",
          error
        );
        totalUsersCount.textContent = "N/A";
        pendingUsersCount.textContent = "N/A";
        totalCoursesCount.textContent = "N/A";
        totalMessagesCount.textContent = "N/A";
      }
    }

    // Appeler la fonction de mise à jour des métriques UNIQUEMENT si un admin est connecté
    auth.onAuthStateChanged((user) => {
      if (user) {
        db.collection("users")
          .doc(user.uid)
          .get()
          .then((doc) => {
            if (doc.exists && doc.data().role === "admin") {
              updateDashboardMetrics();
            }
          });
      }
    });
  }

  // --- 10. Gestion des utilisateurs (Page admin/users.html) ---
  // Cette section ne s'exécute que si nous sommes sur la page users.html
  if (window.location.pathname.includes("/admin/users.html")) {
    const usersTableBody = document.getElementById("usersTableBody");
    const userSearchInput = document.getElementById("userSearch");
    const userFilterStatus = document.getElementById("userFilterStatus");
    const applyFilterBtn = document.getElementById("applyFilterBtn");
    const noUsersFoundDiv = document.getElementById("noUsersFound");
    const usersPagination = document.getElementById("usersPagination");

    let currentPage = 1;
    const usersPerPage = 10; // Nombre d'utilisateurs par page

    async function fetchAndDisplayUsers(
      searchQuery = "",
      filterStatus = "all",
      page = 1
    ) {
      usersTableBody.innerHTML =
        '<tr><td colspan="5">Chargement des utilisateurs...</td></tr>';
      noUsersFoundDiv.style.display = "none";

      try {
        let query = db.collection("users").orderBy("createdAt", "desc");

        if (filterStatus !== "all") {
          query = query.where("status", "==", filterStatus);
        }

        const snapshot = await query.get();
        let users = [];
        snapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() });
        });

        // Filtrage côté client pour la recherche (à optimiser si très grand nombre d'utilisateurs)
        if (searchQuery) {
          const lowerCaseQuery = searchQuery.toLowerCase();
          users = users.filter(
            (user) =>
              (user.fullName &&
                user.fullName.toLowerCase().includes(lowerCaseQuery)) ||
              (user.email && user.email.toLowerCase().includes(lowerCaseQuery))
          );
        }

        if (users.length === 0) {
          usersTableBody.innerHTML = ""; // Vider le tableau
          noUsersFoundDiv.style.display = "block";
          usersPagination.innerHTML = ""; // Vider la pagination
          return;
        }

        // Logique de pagination
        const totalPages = Math.ceil(users.length / usersPerPage);
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const usersToDisplay = users.slice(startIndex, endIndex);

        usersTableBody.innerHTML = ""; // Vider les utilisateurs précédents

        usersToDisplay.forEach((user) => {
          const row = usersTableBody.insertRow();
          const createdAt = user.createdAt
            ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
            : "N/A";
          const statusBadgeClass = user.status || "active"; // Par défaut 'active' si non défini
          const statusText = user.status
            ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
            : "Actif";

          row.innerHTML = `
                        <td>${user.fullName || "N/A"}</td>
                        <td>${user.email || "N/A"}</td>
                        <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
                        <td>${createdAt}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-small edit-user-btn" data-id="${
                                  user.id
                                }"><i data-feather="edit"></i> Modifier</button>
                                <button class="btn btn-danger btn-small delete-user-btn" data-id="${
                                  user.id
                                }"><i data-feather="trash-2"></i> Supprimer</button>
                                ${
                                  user.status === "pending"
                                    ? `<button class="btn btn-secondary btn-small approve-user-btn" data-id="${user.id}"><i data-feather="check-circle"></i> Approuver</button>`
                                    : ""
                                }
                                ${
                                  user.status !== "suspended"
                                    ? `<button class="btn btn-warning btn-small suspend-user-btn" data-id="${user.id}"><i data-feather="slash"></i> Suspendre</button>`
                                    : `<button class="btn btn-success btn-small activate-user-btn" data-id="${user.id}"><i data-feather="play"></i> Activer</button>`
                                }
                            </div>
                        </td>
                    `;
        });

        feather.replace(); // Re-initialiser Feather Icons pour les nouvelles icônes ajoutées

        // Générer les contrôles de pagination
        usersPagination.innerHTML = "";
        if (totalPages > 1) {
          const prevBtn = document.createElement("button");
          prevBtn.textContent = "Précédent";
          prevBtn.disabled = page === 1;
          prevBtn.addEventListener("click", () => {
            currentPage--;
            fetchAndDisplayUsers(
              userSearchInput.value,
              userFilterStatus.value,
              currentPage
            );
          });
          usersPagination.appendChild(prevBtn);

          const pageSpan = document.createElement("span");
          pageSpan.textContent = `Page ${page} sur ${totalPages}`;
          usersPagination.appendChild(pageSpan);

          const nextBtn = document.createElement("button");
          nextBtn.textContent = "Suivant";
          nextBtn.disabled = page === totalPages;
          nextBtn.addEventListener("click", () => {
            currentPage++;
            fetchAndDisplayUsers(
              userSearchInput.value,
              userFilterStatus.value,
              currentPage
            );
          });
          usersPagination.appendChild(nextBtn);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des utilisateurs:",
          error
        );
        usersTableBody.innerHTML =
          '<tr><td colspan="5" style="color: red;">Erreur lors du chargement des utilisateurs.</td></tr>';
      }
    }

    // Événements de recherche et de filtre
    applyFilterBtn.addEventListener("click", () => {
      currentPage = 1; // Réinitialise la page lors de l'application d'un filtre/recherche
      fetchAndDisplayUsers(
        userSearchInput.value,
        userFilterStatus.value,
        currentPage
      );
    });

    // Charger les utilisateurs au chargement de la page (après vérification admin)
    auth.onAuthStateChanged((user) => {
      if (user) {
        db.collection("users")
          .doc(user.uid)
          .get()
          .then((doc) => {
            if (doc.exists && doc.data().role === "admin") {
              // Charger les utilisateurs une fois que l'admin est confirmé
              fetchAndDisplayUsers();

              // Écouteurs pour les boutons d'action (modifier, supprimer, approuver, suspendre, activer)
              usersTableBody.addEventListener("click", async (event) => {
                const target = event.target.closest("button"); // Utilise closest pour gérer les clics sur l'icône
                if (!target || !target.dataset.id) return; // S'assurer qu'un bouton avec data-id est cliqué

                const userId = target.dataset.id;
                const action = target.classList[2]; // ex: 'delete-user-btn', 'approve-user-btn'

                if (target.classList.contains("delete-user-btn")) {
                  if (
                    confirm(
                      "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
                    )
                  ) {
                    try {
                      // Supprimer l'utilisateur de Firestore
                      await db.collection("users").doc(userId).delete();
                      // NB: La suppression de l'utilisateur de Firebase Authentication doit être faite
                      // via une fonction Cloud pour des raisons de sécurité. Ce code ne supprime que l'entrée Firestore.

                      displayMessage(
                        "noUsersFound",
                        "Utilisateur supprimé avec succès.",
                        false
                      );
                      fetchAndDisplayUsers(
                        userSearchInput.value,
                        userFilterStatus.value,
                        currentPage
                      ); // Recharger les utilisateurs
                    } catch (error) {
                      console.error(
                        "Erreur lors de la suppression de l'utilisateur:",
                        error
                      );
                      displayMessage(
                        "noUsersFound",
                        "Erreur lors de la suppression de l'utilisateur. Vérifiez les permissions Firestore.",
                        true
                      );
                    }
                  }
                } else if (target.classList.contains("approve-user-btn")) {
                  if (
                    confirm("Voulez-vous vraiment approuver cet utilisateur ?")
                  ) {
                    try {
                      await db
                        .collection("users")
                        .doc(userId)
                        .update({ status: "active" });
                      displayMessage(
                        "noUsersFound",
                        "Utilisateur approuvé avec succès.",
                        false
                      );
                      fetchAndDisplayUsers(
                        userSearchInput.value,
                        userFilterStatus.value,
                        currentPage
                      );
                    } catch (error) {
                      console.error(
                        "Erreur lors de l'approbation de l'utilisateur:",
                        error
                      );
                      displayMessage(
                        "noUsersFound",
                        "Erreur lors de l'approbation de l'utilisateur.",
                        true
                      );
                    }
                  }
                } else if (target.classList.contains("suspend-user-btn")) {
                  if (
                    confirm(
                      "Voulez-vous vraiment suspendre cet utilisateur ? Il ne pourra plus se connecter."
                    )
                  ) {
                    try {
                      await db
                        .collection("users")
                        .doc(userId)
                        .update({ status: "suspended" });
                      displayMessage(
                        "noUsersFound",
                        "Utilisateur suspendu avec succès.",
                        false
                      );
                      fetchAndDisplayUsers(
                        userSearchInput.value,
                        userFilterStatus.value,
                        currentPage
                      );
                    } catch (error) {
                      console.error(
                        "Erreur lors de la suspension de l'utilisateur:",
                        error
                      );
                      displayMessage(
                        "noUsersFound",
                        "Erreur lors de la suspension de l'utilisateur.",
                        true
                      );
                    }
                  }
                } else if (target.classList.contains("activate-user-btn")) {
                  if (
                    confirm("Voulez-vous vraiment réactiver cet utilisateur ?")
                  ) {
                    try {
                      await db
                        .collection("users")
                        .doc(userId)
                        .update({ status: "active" });
                      displayMessage(
                        "noUsersFound",
                        "Utilisateur réactivé avec succès.",
                        false
                      );
                      fetchAndDisplayUsers(
                        userSearchInput.value,
                        userFilterStatus.value,
                        currentPage
                      );
                    } catch (error) {
                      console.error(
                        "Erreur lors de la réactivation de l'utilisateur:",
                        error
                      );
                      displayMessage(
                        "noUsersFound",
                        "Erreur lors de la réactivation de l'utilisateur.",
                        true
                      );
                    }
                  }
                } else if (target.classList.contains("edit-user-btn")) {
                  // Rediriger vers une page d'édition ou ouvrir un modal
                  alert(
                    "Fonctionnalité d'édition de l'utilisateur à implémenter. ID de l'utilisateur: " +
                      userId
                  );
                  // Pour un projet plus avancé, vous pourriez rediriger vers:
                  // window.location.href = `edit-user.html?id=${userId}`;
                }
              });
            }
          });
      }
    });
  }
}); // Fin de DOMContentLoaded

// assets/js/main.js (à la fin du fichier, avant la dernière });)

// --- 11. Gestion des Formations (Page admin/courses.html) ---
if (window.location.pathname.includes("/admin/courses.html")) {
  const addCourseBtn = document.getElementById("addCourseBtn");
  const courseFormContainer = document.getElementById("courseFormContainer");
  const courseFormTitle = document.getElementById("courseFormTitle");
  const courseForm = document.getElementById("courseForm");
  const courseIdField = document.getElementById("courseId");
  const courseTitleField = document.getElementById("courseTitle");
  const courseDescriptionField = document.getElementById("courseDescription");
  const courseInstructorField = document.getElementById("courseInstructor");
  const coursePriceField = document.getElementById("coursePrice");
  const courseDurationField = document.getElementById("courseDuration");
  const courseImageField = document.getElementById("courseImage");
  const saveCourseBtn = document.getElementById("saveCourseBtn");
  const cancelCourseBtn = document.getElementById("cancelCourseBtn");
  const courseFormMessage = document.getElementById("courseFormMessage");

  const coursesTableBody = document.getElementById("coursesTableBody");
  const courseSearchInput = document.getElementById("courseSearch");
  const applyCourseFilterBtn = document.getElementById("applyCourseFilterBtn");
  const noCoursesFoundDiv = document.getElementById("noCoursesFound");
  const coursesPagination = document.getElementById("coursesPagination");

  let currentCoursePage = 1;
  const coursesPerPage = 5; // Nombre de formations par page

  let editingCourseId = null; // Pour savoir si nous sommes en mode édition

  // Fonction pour afficher/cacher le formulaire de formation
  function toggleCourseForm(show = true) {
    if (show) {
      courseFormContainer.style.display = "block";
      // Faire défiler vers le formulaire pour une meilleure UX
      courseFormContainer.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      courseFormContainer.style.display = "none";
      courseForm.reset(); // Réinitialise le formulaire
      editingCourseId = null;
      courseFormTitle.textContent = "Ajouter une Formation";
      saveCourseBtn.textContent = "Enregistrer la Formation";
      courseFormMessage.style.display = "none"; // Cacher le message
      courseFormMessage.classList.remove("success", "error");
    }
  }

  // Charger et afficher les formations
  async function fetchAndDisplayCourses(searchQuery = "", page = 1) {
    coursesTableBody.innerHTML =
      '<tr><td colspan="6">Chargement des formations...</td></tr>';
    noCoursesFoundDiv.style.display = "none";

    try {
      let query = db.collection("courses").orderBy("createdAt", "desc");

      const snapshot = await query.get();
      let courses = [];
      snapshot.forEach((doc) => {
        courses.push({ id: doc.id, ...doc.data() });
      });

      // Filtrage côté client pour la recherche
      if (searchQuery) {
        const lowerCaseQuery = searchQuery.toLowerCase();
        courses = courses.filter(
          (course) =>
            (course.title &&
              course.title.toLowerCase().includes(lowerCaseQuery)) ||
            (course.instructor &&
              course.instructor.toLowerCase().includes(lowerCaseQuery))
        );
      }

      if (courses.length === 0) {
        coursesTableBody.innerHTML = "";
        noCoursesFoundDiv.style.display = "block";
        coursesPagination.innerHTML = "";
        return;
      }

      // Logique de pagination
      const totalPages = Math.ceil(courses.length / coursesPerPage);
      const startIndex = (page - 1) * coursesPerPage;
      const endIndex = startIndex + coursesPerPage;
      const coursesToDisplay = courses.slice(startIndex, endIndex);

      coursesTableBody.innerHTML = "";

      coursesToDisplay.forEach((course) => {
        const row = coursesTableBody.insertRow();
        const courseImageSrc =
          course.image || "../assets/img/default-course.jpg"; // Image par défaut
        const price =
          course.price !== undefined ? `$${course.price.toFixed(2)}` : "N/A";
        const duration = course.duration || "N/A";

        row.innerHTML = `
                        <td><img src="${courseImageSrc}" alt="${
          course.title
        }" class="course-thumb"></td>
                        <td>${course.title || "N/A"}</td>
                        <td>${course.instructor || "N/A"}</td>
                        <td>${price}</td>
                        <td>${duration}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-small edit-course-btn" data-id="${
                                  course.id
                                }"><i data-feather="edit"></i> Modifier</button>
                                <button class="btn btn-danger btn-small delete-course-btn" data-id="${
                                  course.id
                                }"><i data-feather="trash-2"></i> Supprimer</button>
                            </div>
                        </td>
                    `;
      });
      feather.replace(); // Re-render feather icons

      // Générer les contrôles de pagination
      coursesPagination.innerHTML = "";
      if (totalPages > 1) {
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "Précédent";
        prevBtn.disabled = page === 1;
        prevBtn.addEventListener("click", () => {
          currentCoursePage--;
          fetchAndDisplayCourses(courseSearchInput.value, currentCoursePage);
        });
        coursesPagination.appendChild(prevBtn);

        const pageSpan = document.createElement("span");
        pageSpan.textContent = `Page ${page} sur ${totalPages}`;
        coursesPagination.appendChild(pageSpan);

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Suivant";
        nextBtn.disabled = page === totalPages;
        nextBtn.addEventListener("click", () => {
          currentCoursePage++;
          fetchAndDisplayCourses(courseSearchInput.value, currentCoursePage);
        });
        coursesPagination.appendChild(nextBtn);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des formations:", error);
      coursesTableBody.innerHTML =
        '<tr><td colspan="6" style="color: red;">Erreur lors du chargement des formations.</td></tr>';
    }
  }

  // Ouvrir le formulaire pour ajouter une nouvelle formation
  addCourseBtn.addEventListener("click", () => {
    toggleCourseForm(true);
    courseFormTitle.textContent = "Ajouter une Nouvelle Formation";
    saveCourseBtn.textContent = "Enregistrer la Formation";
    editingCourseId = null;
  });

  // Annuler l'ajout/édition
  cancelCourseBtn.addEventListener("click", () => {
    toggleCourseForm(false);
  });

  // Soumission du formulaire d'ajout/édition
  courseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = courseTitleField.value;
    const description = courseDescriptionField.value;
    const instructor = courseInstructorField.value;
    const price = parseFloat(coursePriceField.value);
    const duration = courseDurationField.value;
    const image = courseImageField.value;

    if (!title || !description || !instructor || isNaN(price) || !duration) {
      displayMessage(
        "courseFormMessage",
        "Veuillez remplir tous les champs obligatoires.",
        true
      );
      return;
    }

    try {
      if (editingCourseId) {
        // Mode édition
        await db.collection("courses").doc(editingCourseId).update({
          title,
          description,
          instructor,
          price,
          duration,
          image,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        displayMessage(
          "courseFormMessage",
          "Formation mise à jour avec succès !",
          false
        );
      } else {
        // Mode ajout
        await db.collection("courses").add({
          title,
          description,
          instructor,
          price,
          duration,
          image,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        displayMessage(
          "courseFormMessage",
          "Formation ajoutée avec succès !",
          false
        );
      }

      toggleCourseForm(false); // Cacher le formulaire
      fetchAndDisplayCourses(courseSearchInput.value, currentCoursePage); // Recharger la liste
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la formation:", error);
      displayMessage(
        "courseFormMessage",
        "Erreur lors de l'enregistrement de la formation. " + error.message,
        true
      );
    }
  });

  // Événements de recherche
  applyCourseFilterBtn.addEventListener("click", () => {
    currentCoursePage = 1;
    fetchAndDisplayCourses(courseSearchInput.value, currentCoursePage);
  });

  // Écouteurs pour les boutons d'action (modifier, supprimer) dans le tableau
  coursesTableBody.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target || !target.dataset.id) return;

    const courseId = target.dataset.id;

    if (target.classList.contains("edit-course-btn")) {
      // Charger les données de la formation pour l'édition
      try {
        const doc = await db.collection("courses").doc(courseId).get();
        if (doc.exists) {
          const courseData = doc.data();
          courseIdField.value = doc.id;
          courseTitleField.value = courseData.title || "";
          courseDescriptionField.value = courseData.description || "";
          courseInstructorField.value = courseData.instructor || "";
          coursePriceField.value =
            courseData.price !== undefined ? courseData.price : "";
          courseDurationField.value = courseData.duration || "";
          courseImageField.value = courseData.image || "";

          editingCourseId = doc.id;
          courseFormTitle.textContent = "Modifier la Formation";
          saveCourseBtn.textContent = "Mettre à jour la Formation";
          toggleCourseForm(true); // Afficher le formulaire
        } else {
          displayMessage(
            "noCoursesFound",
            "Formation introuvable pour modification.",
            true
          );
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement de la formation pour édition:",
          error
        );
        displayMessage(
          "noCoursesFound",
          "Erreur lors du chargement des données de la formation.",
          true
        );
      }
    } else if (target.classList.contains("delete-course-btn")) {
      if (
        confirm(
          "Êtes-vous sûr de vouloir supprimer cette formation ? Cette action est irréversible."
        )
      ) {
        try {
          await db.collection("courses").doc(courseId).delete();
          displayMessage(
            "noCoursesFound",
            "Formation supprimée avec succès.",
            false
          );
          fetchAndDisplayCourses(courseSearchInput.value, currentCoursePage); // Recharger la liste
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de la formation:",
            error
          );
          displayMessage(
            "noCoursesFound",
            "Erreur lors de la suppression de la formation. " + error.message,
            true
          );
        }
      }
    }
  });

  // Appeler la fonction au chargement de la page (après vérification admin)
  auth.onAuthStateChanged((user) => {
    if (user) {
      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists && doc.data().role === "admin") {
            fetchAndDisplayCourses(); // Charger les formations si l'admin est connecté
          }
        });
    }
  });
}

// --- 12. Afficher les formations sur la page 'courses.html' publique ---
if (
  window.location.pathname.includes("/courses.html") ||
  window.location.pathname.endsWith("/courses/")
) {
  const publicCoursesContainer = document.getElementById(
    "publicCoursesContainer"
  ); // Conteneur dans courses.html

  async function loadPublicCourses() {
    if (!publicCoursesContainer) return;

    publicCoursesContainer.innerHTML =
      '<p class="text-center">Chargement des formations...</p>';

    try {
      const snapshot = await db
        .collection("courses")
        .orderBy("createdAt", "desc")
        .get();
      let courses = [];
      snapshot.forEach((doc) => {
        courses.push({ id: doc.id, ...doc.data() });
      });

      if (courses.length === 0) {
        publicCoursesContainer.innerHTML =
          '<p class="text-center">Aucune formation disponible pour le moment.</p>';
        return;
      }

      publicCoursesContainer.innerHTML = ""; // Vider le message de chargement

      courses.forEach((course) => {
        const priceText =
          course.price > 0 ? `$${course.price.toFixed(2)}` : "Gratuit";
        const courseCard = `
                        <div class="course-card">
                            <img src="${
                              course.image || "assets/img/default-course.jpg"
                            }" alt="${course.title}">
                            <div class="card-content">
                                <h3>${course.title}</h3>
                                <p class="instructor"><i data-feather="user"></i> ${
                                  course.instructor
                                }</p>
                                <p class="description">${course.description.substring(
                                  0,
                                  100
                                )}...</p>
                                <div class="course-details">
                                    <span><i data-feather="clock"></i> ${
                                      course.duration
                                    }</span>
                                    <span class="price">${priceText}</span>
                                </div>
                                <a href="course-details.html?id=${
                                  course.id
                                }" class="btn btn-primary btn-small">En Savoir Plus</a>
                            </div>
                        </div>
                    `;
        publicCoursesContainer.innerHTML += courseCard;
      });
      feather.replace(); // Pour les icônes dans les cartes de formation
    } catch (error) {
      console.error(
        "Erreur lors du chargement des formations publiques:",
        error
      );
      publicCoursesContainer.innerHTML =
        '<p class="text-center error-message">Erreur lors du chargement des formations. Veuillez réessayer plus tard.</p>';
    }
  }

  loadPublicCourses(); // Appeler la fonction au chargement de la page
}

// assets/js/main.js (à la fin du fichier, avant la dernière });)

// --- 13. Gestion des Messages Reçus (Page admin/messages.html) ---
if (window.location.pathname.includes("/admin/messages.html")) {
  const messagesTableBody = document.getElementById("messagesTableBody");
  const messagesPagination = document.getElementById("messagesPagination");
  const noMessagesFoundDiv = document.getElementById("noMessagesFound");

  let currentMessagePage = 1;
  const messagesPerPage = 10;

  async function fetchAndDisplayMessages(page = 1) {
    messagesTableBody.innerHTML =
      '<tr><td colspan="6">Chargement des messages...</td></tr>';
    noMessagesFoundDiv.style.display = "none";

    try {
      // Lire les messages, seuls les admins ont la permission (via Firestore Rules)
      const snapshot = await db
        .collection("messages")
        .orderBy("timestamp", "desc")
        .get();
      let messages = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      if (messages.length === 0) {
        messagesTableBody.innerHTML = "";
        noMessagesFoundDiv.style.display = "block";
        messagesPagination.innerHTML = "";
        return;
      }

      const totalPages = Math.ceil(messages.length / messagesPerPage);
      const startIndex = (page - 1) * messagesPerPage;
      const endIndex = startIndex + messagesPerPage;
      const messagesToDisplay = messages.slice(startIndex, endIndex);

      messagesTableBody.innerHTML = "";

      messagesToDisplay.forEach((message) => {
        const row = messagesTableBody.insertRow();
        const timestamp = message.timestamp
          ? new Date(message.timestamp.seconds * 1000).toLocaleString()
          : "N/A";
        const truncatedMessage =
          (message.message || "").substring(0, 100) +
          ((message.message || "").length > 100 ? "..." : "");

        row.innerHTML = `
                        <td>${message.name || "N/A"}</td>
                        <td>${message.email || "N/A"}</td>
                        <td>${message.subject || "N/A"}</td>
                        <td>${truncatedMessage}</td>
                        <td>${timestamp}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-small view-message-btn" data-id="${
                                  message.id
                                }"><i data-feather="eye"></i> Voir</button>
                                <button class="btn btn-danger btn-small delete-message-btn" data-id="${
                                  message.id
                                }"><i data-feather="trash-2"></i> Supprimer</button>
                            </div>
                        </td>
                    `;
      });
      feather.replace();

      messagesPagination.innerHTML = "";
      if (totalPages > 1) {
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "Précédent";
        prevBtn.disabled = page === 1;
        prevBtn.addEventListener("click", () => {
          currentMessagePage--;
          fetchAndDisplayMessages(currentMessagePage);
        });
        messagesPagination.appendChild(prevBtn);

        const pageSpan = document.createElement("span");
        pageSpan.textContent = `Page ${page} sur ${totalPages}`;
        messagesPagination.appendChild(pageSpan);

        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Suivant";
        nextBtn.disabled = page === totalPages;
        nextBtn.addEventListener("click", () => {
          currentMessagePage++;
          fetchAndDisplayMessages(currentMessagePage);
        });
        messagesPagination.appendChild(nextBtn);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
      messagesTableBody.innerHTML =
        '<tr><td colspan="6" style="color: red;">Erreur lors du chargement des messages.</td></tr>';
    }
  }

  messagesTableBody.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target || !target.dataset.id) return;

    const messageId = target.dataset.id;

    if (target.classList.contains("delete-message-btn")) {
      if (confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
        try {
          await db.collection("messages").doc(messageId).delete();
          displayMessage(
            "noMessagesFound",
            "Message supprimé avec succès.",
            false
          );
          fetchAndDisplayMessages(currentMessagePage);
        } catch (error) {
          console.error("Erreur lors de la suppression du message:", error);
          displayMessage(
            "noMessagesFound",
            "Erreur lors de la suppression du message. Vérifiez les permissions Firestore.",
            true
          );
        }
      }
    } else if (target.classList.contains("view-message-btn")) {
      try {
        const doc = await db.collection("messages").doc(messageId).get();
        if (doc.exists) {
          const msg = doc.data();
          alert(
            `Détails du Message:\n\nDe: ${msg.name} (${msg.email})\nSujet: ${
              msg.subject
            }\nDate: ${new Date(
              msg.timestamp.seconds * 1000
            ).toLocaleString()}\n\nMessage:\n${msg.message}`
          );
        } else {
          alert("Message introuvable.");
        }
      } catch (error) {
        console.error("Erreur lors de l'affichage du message:", error);
        alert("Erreur lors de l'affichage du message.");
      }
    }
  });

  // Charger les messages au chargement de la page (après vérification admin)
  auth.onAuthStateChanged((user) => {
    if (user) {
      db.collection("users")
        .doc(user.uid)
        .get()
        .then((doc) => {
          if (doc.exists && doc.data().role === "admin") {
            fetchAndDisplayMessages(); // Charger les messages si l'admin est connecté
          }
        });
    }
  });
}
