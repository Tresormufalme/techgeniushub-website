// Votre configuration Firebase
// Ces valeurs proviennent de votre console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC-jnejUFmRgL9GUBhG4dnOFEjt-uzcYbs",
  authDomain: "techgenuishub-signin.firebaseapp.com",
  projectId: "techgenuishub-signin",
  storageBucket: "techgenuishub-signin.firebasestorage.app",
  messagingSenderId: "192585269090",
  appId: "1:192585269090:web:eb3f121b5e32285952363b",
  // measurementId: "G-LCNHM889QZ" // Cette ligne est optionnelle si vous n'utilisez pas Google Analytics
};

// Initialisation de Firebase avec la syntaxe de la version 8 du SDK
// La variable 'firebase' est disponible globalement grâce aux SDK chargés dans l'HTML
firebase.initializeApp(firebaseConfig);

// Exporter les modules Firebase (Auth et Firestore) pour une utilisation ultérieure
// Ces instances seront accessibles globalement dans votre main.js et autres scripts
const auth = firebase.auth();
const db = firebase.firestore();

// Note : Si vous souhaitez utiliser Google Analytics avec Firebase v8,
// vous l'initialiseriez comme ceci (après avoir chargé le SDK analytics dans l'HTML) :
// const analytics = firebase.analytics();
